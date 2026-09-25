import { IS_PRIVATE_KEY } from '@decorators/private.decorator';
import { IS_PUBLIC_KEY } from '@decorators/public.decorator';
import { FirebaseUserDto } from '@modules/firebase/firebase.dto';
import { FirebaseService } from '@modules/firebase/firebase.service';
import { UserDocument } from '@modules/user/user.schema';
import { UserService } from '@modules/user/user.service';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessType, DefaultRole, Subdomain } from '@repo/shared/enums';
import { RegisterUserDto, UserDto } from '@repo/shared/validations';
import { Secrets } from '@secrets/secrets';
import { SecretsService } from '@secrets/secrets.service';
import { INITIAL_LOGIN_DATA_URL } from '@utils/constants';
import { getRegisterPayload } from '@utils/util';
import { DecodedIdToken } from 'firebase-admin/auth';
import { ClsService } from 'nestjs-cls';
import { IRequestContext } from '../context/request-context.interface';

/**
 * What a `@Public()` route is allowed to arrive without.
 *
 * `/`, `/health` and `/sync-indexes` are called by load balancers, uptime checks and a terminal —
 * none of which sends the headers an app does. SUPPORT is the stand-in because these are platform
 * and operations routes rather than anything a learner or teacher reaches.
 */
const PUBLIC_HEADER_DEFAULTS: Record<string, string> = {
  app: Subdomain.SUPPORT,
  timezone: 'UTC',
  'timezone-offset': '0',
};

/** The parts of the incoming request this guard reads. */
interface AuthRequest {
  url: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  user?: UserDto;
}

/**
 * The context an authenticated or private request carries. Every field is required *and* holds a
 * value — the three headers are read through `getApp` / `getRequiredHeader`, which throw rather
 * than return undefined, so nothing here can be an empty string smuggled in from a missing header.
 *
 * That is safe because all three apps now send `app`, `timezone` and `timezone-offset` as base
 * headers, on every request rather than only inside the auth interceptor.
 */
interface ContextPayload {
  apiRoute: string;
  accessType: AccessType;
  subdomain: Subdomain;
  timezone: string;
  timezoneOffset: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  // NestJS injects collaborators through the constructor, so the count reflects this class's
  // dependencies rather than a parameter list that could be shortened by extraction.
  // eslint-disable-next-line max-params
  constructor(
    private readonly clsService: ClsService,
    private reflector: Reflector,
    private readonly userService: UserService,
    private readonly firebaseService: FirebaseService,
    private secretsService: SecretsService,
  ) {}

  /**
   * The live request, with `PUBLIC_HEADER_DEFAULTS` filled in behind whatever the caller sent.
   *
   * Only for a `@Public()` route: an authenticated or private caller that cannot say which app it
   * is must still be refused, and defaulting here for everyone would let a missing `app` header
   * read as SUPPORT. Headers are merged in place rather than copied because `validateAndGetUser`
   * assigns `request.user` on the object this returns.
   */
  getRequest(context: ExecutionContext): AuthRequest {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!this.getValue(context, IS_PUBLIC_KEY)) return request;
    request.headers = { ...PUBLIC_HEADER_DEFAULTS, ...request.headers };
    return request;
  }

  getValue(context: ExecutionContext, key: string) {
    return this.reflector.getAllAndOverride<boolean>(key, [context.getHandler(), context.getClass()]);
  }

  getHeaderValue(context: ExecutionContext, key: string) {
    const request = this.getRequest(context);
    const { headers } = request;
    const value = headers[key] || headers[key.toLowerCase()];
    return value;
  }

  /**
   * A header the caller must send. Throws rather than returning undefined, so a missing value
   * surfaces at the edge instead of becoming an empty string three layers down.
   *
   * Every branch reads through here, public included. A `@Public()` route survives a caller that
   * sends nothing — a load balancer, an uptime check — because `getRequest` has already filled in
   * `PUBLIC_HEADER_DEFAULTS` behind whatever arrived, not because this is lenient.
   */
  getRequiredHeader(context: ExecutionContext, key: string): string {
    const value = this.getHeaderValue(context, key) as string | undefined;
    if (!value) throw new UnauthorizedException(`The ${key} header is required.`);
    return value;
  }

  /**
   * The app the request came from. Required on every branch, and checked against the enum, so a
   * typo is refused by name rather than travelling on as a `Subdomain` nothing will ever match.
   *
   * It used to be parsed out of the request path, which never worked: no client URL carries a
   * `learn`/`teach`/`support` segment and no global prefix adds one, so every `@Subdomains` route
   * was refused.
   */
  getApp(context: ExecutionContext): Subdomain {
    const app = this.getRequiredHeader(context, 'app');
    if (!(Object.values(Subdomain) as string[]).includes(app)) {
      throw new UnauthorizedException(`Unknown app: ${app}`);
    }
    return app as Subdomain;
  }

  setRequestContext(payload: UserDto | RegisterUserDto, otherPayload: ContextPayload) {
    const requestContext: IRequestContext = {
      userId: String(payload._id),
      orgId: String(payload.org),
      permission: payload.permission,
      ...otherPayload,
    };
    this.clsService.set('requestContext', requestContext);
  }

  /**
   * The account every `@Private()` route writes as, resolved once and cached.
   *
   * Without it a private write throws: `change-tracking.plugin` demands an org from the request
   * context and the minimal context carries none, while `createdBy`/`updatedBy` would be skipped
   * silently because the plugin only stamps them `if (user)`.
   *
   * Configured as an email rather than two ObjectIds because those are database ids and differ per
   * environment — one setting that stays correct in dev and production beats two that must be
   * looked up and kept in step.
   *
   * The account is expected to belong to exactly one organization; `getUsersByEmail` returns a row
   * per org, and the first is taken.
   */
  private privateIdentity?: { userId: string; orgId: string; permission: DefaultRole };

  private async getPrivateIdentity(): Promise<{ userId: string; orgId: string; permission: DefaultRole }> {
    if (this.privateIdentity) return this.privateIdentity;

    const email = this.secretsService.get(Secrets.PRIVATE_API_EMAIL) as string;
    if (!email) throw new UnauthorizedException('Private API service account is not configured.');

    const users = await this.userService.getUsersByEmail(email);
    const user = users?.[0];
    if (!user) throw new UnauthorizedException(`Private API service account ${email} was not found.`);

    this.privateIdentity = { userId: String(user._id), orgId: String(user.org), permission: user.permission };
    return this.privateIdentity;
  }

  setWholeRequestContext(requestContext: IRequestContext) {
    this.clsService.set('requestContext', requestContext);
  }

  async validateAndGetFirebaseUser(context: ExecutionContext): Promise<FirebaseUserDto> {
    const tokenString = this.getHeaderValue(context, 'Authorization') as string;
    const token = tokenString ? tokenString.split('Bearer ')[1] : null;
    if (!token) throw new UnauthorizedException('Firebase token not found!');
    const firebaseUser = (await this.firebaseService.validateToken(token)) as DecodedIdToken;
    if (!firebaseUser) throw new UnauthorizedException('Firebase user not found!');
    const uid = firebaseUser.uid;
    const email = firebaseUser.email as string;
    const name = (firebaseUser.name || firebaseUser.displayName || firebaseUser.display_name) as string;
    const phone_number = firebaseUser.phone_number as string;
    return { email, uid, name, phone_number };
  }

  async validateAndGetUser(context: ExecutionContext, accessType: AccessType): Promise<UserDto> {
    const request = this.getRequest(context);
    const timezone = this.getRequiredHeader(context, 'timezone');
    const timezoneOffset = this.getRequiredHeader(context, 'timezone-offset');
    const { url } = request;
    const subdomain = this.getApp(context);
    const org = this.getHeaderValue(context, 'organization') as string;
    if (!org && !url.includes(INITIAL_LOGIN_DATA_URL)) {
      throw new UnauthorizedException('Organization is required!');
    }
    const firebaseUser = await this.validateAndGetFirebaseUser(context);
    if (!firebaseUser.email) throw new UnauthorizedException('Firebase email not found!');
    if (!firebaseUser.uid) throw new UnauthorizedException('Firebase uid not found!');
    let user = org
      ? await this.userService.getUserByOrgIdAndUid({ uid: firebaseUser.uid, org })
      : (await this.userService.getUsersByUid(firebaseUser.uid))[0];
    if (org && !user) throw new UnauthorizedException(`DB user not found for org id: ${org}`);
    if (!user && url.includes(INITIAL_LOGIN_DATA_URL)) {
      const payload = getRegisterPayload(subdomain, firebaseUser);
      this.setRequestContext(payload, { apiRoute: url, accessType, subdomain, timezone, timezoneOffset });
      user = await this.userService.registerUser(payload, subdomain);
    }
    if (!user) throw new UnauthorizedException('DB user not found!');
    // Revoking access writes isInactive and nothing used to read it, so a revoked member kept
    // their token and every permission their role granted. Refused here rather than in
    // AccessGuard: an inactive membership is not an authorization question, it is not a session.
    if (user.isInactive) throw new UnauthorizedException('Your access to this organization has been revoked.');
    this.userService.updateLastActive(String(user._id), new Date());
    return this.userService.transformUser(user as UserDocument);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const { url } = request;
    const { method } = request;
    const apiRoute = `${method} ${url}`;
    const subdomain = this.getApp(context);
    const timezone = this.getHeaderValue(context, 'timezone') as string;
    const timezoneOffset = this.getHeaderValue(context, 'timezone-offset') as string;

    const isPublic = this.getValue(context, IS_PUBLIC_KEY);
    const isPrivate = this.getValue(context, IS_PRIVATE_KEY);

    let accessType = AccessType.AUTH;

    if (isPublic) {
      accessType = AccessType.PUBLIC;
      // No identity: a public route has no user and no organization. The empty strings are the
      // only place a context id is not a real ObjectId, which is why `getUserId`/`getOrgId` throw
      // here — nothing on a public route may write, and a write is what those getters serve.
      this.setWholeRequestContext({
        apiRoute,
        accessType,
        subdomain,
        timezone,
        timezoneOffset,
        userId: '',
        orgId: '',
        permission: DefaultRole.ADMIN,
      });
      return true;
    }
    if (isPrivate) {
      // A private route is machine-to-machine only. A wrong or missing key is rejected outright;
      // it must never fall through to Firebase auth, which would let any signed-in user in.
      accessType = AccessType.PRIVATE;
      const presented = this.getHeaderValue(context, 'api-key') as string;
      const expected = this.secretsService.get(Secrets.PRIVATE_API_KEY) as string;
      if (!presented) throw new UnauthorizedException('Private API key is required.');
      if (!expected) throw new UnauthorizedException('Private API key is not configured.');
      if (expected !== presented) {
        throw new UnauthorizedException('Invalid API key.');
      }
      const identity = await this.getPrivateIdentity();
      // Re-read the two timezone headers strictly: a private caller is one of our apps, so it must
      // identify itself the way an authenticated one does rather than inherit a public default.
      // `identity` supplies userId, orgId and permission, so it is spread last.
      this.setWholeRequestContext({
        apiRoute,
        accessType,
        subdomain,
        timezone: this.getRequiredHeader(context, 'timezone'),
        timezoneOffset: this.getRequiredHeader(context, 'timezone-offset'),
        ...identity,
      });
      return true;
    }

    const user: UserDto = await this.validateAndGetUser(context, accessType);

    if (!user) throw new UnauthorizedException('User not found!');

    this.setRequestContext(user, {
      apiRoute,
      accessType,
      subdomain: this.getApp(context),
      timezone: this.getRequiredHeader(context, 'timezone'),
      timezoneOffset: this.getRequiredHeader(context, 'timezone-offset'),
    });

    request.user = user;

    return Promise.resolve(true);
  }
}
