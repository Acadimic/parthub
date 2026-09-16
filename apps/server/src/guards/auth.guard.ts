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

/**
 * What `setMinimalRequestContext` takes — the public and private branches share it.
 *
 * The three headers widen back to `| undefined` here, and only here, because a `@Public()` route
 * cannot require them: `/` and `/health` are called by load balancers and uptime checks that send
 * no headers at all, and `common/public-data` is fetched by an anonymous visitor through
 * `callUnAuthApi`. Requiring `app` on that path once rejected every public request. The private
 * branch passes the strict values anyway.
 *
 * `userId`/`orgId` are stated by the caller rather than defaulted inside the function: the private
 * branch resolves a real service account, the public branch passes empty strings to mean "nobody".
 */
interface MinimalContextPayload extends Omit<ContextPayload, 'subdomain' | 'timezone' | 'timezoneOffset'> {
  userId: string;
  orgId: string;
  subdomain: Subdomain | undefined;
  timezone: string | undefined;
  timezoneOffset: string | undefined;
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

  getRequest(context: ExecutionContext): AuthRequest {
    return context.switchToHttp().getRequest<AuthRequest>();
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
   * The app the request came from, or undefined when the header was not sent. An unrecognised
   * value is always refused, so a typo cannot silently read as "no app".
   *
   * It used to be parsed out of the request path, which never worked: no client URL carries a
   * `learn`/`teach`/`support` segment and no global prefix adds one, so every `@Subdomains` route
   * was refused.
   *
   * Public routes read it through here rather than `getApp`: none of them declares `@Subdomains`,
   * and an anonymous visitor calls them through `callUnAuthApi`, which sends no app header.
   * Requiring it there rejected every public request.
   */
  /**
   * A header the caller must send. Throws rather than returning undefined, so a missing value
   * surfaces at the edge instead of becoming an empty string three layers down.
   *
   * Only used on the authenticated and private paths. `@Public()` routes stay tolerant on purpose:
   * `/` and `/health` are hit by load balancers and uptime checks that send no headers at all, and
   * `common/public-data` is fetched by an anonymous visitor.
   */
  getRequiredHeader(context: ExecutionContext, key: string): string {
    const value = this.getHeaderValue(context, key) as string | undefined;
    if (!value) throw new UnauthorizedException(`The ${key} header is required.`);
    return value;
  }

  readApp(context: ExecutionContext): Subdomain | undefined {
    const value = this.getHeaderValue(context, 'app') as string | undefined;
    if (!value) return undefined;
    if (!(Object.values(Subdomain) as string[]).includes(value)) {
      throw new UnauthorizedException(`Unknown app: ${value}`);
    }
    return value as Subdomain;
  }

  /** The app header, required. Every authenticated route must say which app it is (@Subdomains). */
  getApp(context: ExecutionContext): Subdomain {
    const app = this.readApp(context);
    if (!app) throw new UnauthorizedException('The app header is required.');
    return app;
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
  private privateIdentity?: { userId: string; orgId: string };

  private async getPrivateIdentity(): Promise<{ userId: string; orgId: string }> {
    if (this.privateIdentity) return this.privateIdentity;

    const email = this.secretsService.get(Secrets.PRIVATE_API_EMAIL) as string;
    if (!email) throw new UnauthorizedException('Private API service account is not configured.');

    const users = await this.userService.getUsersByEmail(email);
    const user = users?.[0];
    if (!user) throw new UnauthorizedException(`Private API service account ${email} was not found.`);

    this.privateIdentity = { userId: String(user._id), orgId: String(user.org) };
    return this.privateIdentity;
  }

  setMinimalRequestContext(otherPayload: MinimalContextPayload) {
    const requestContext: IRequestContext = {
      permission: DefaultRole.ADMIN,
      ...otherPayload,
    };
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
    const subdomain = this.readApp(context);
    const timezone = this.getHeaderValue(context, 'timezone') as string;
    const timezoneOffset = this.getHeaderValue(context, 'timezone-offset') as string;

    const isPublic = this.getValue(context, IS_PUBLIC_KEY);
    const isPrivate = this.getValue(context, IS_PRIVATE_KEY);

    let accessType = AccessType.AUTH;

    if (isPublic) {
      accessType = AccessType.PUBLIC;
      // No identity: a public route has no user and no organization.
      this.setMinimalRequestContext({
        apiRoute,
        accessType,
        subdomain,
        timezone,
        timezoneOffset,
        userId: '',
        orgId: '',
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
      // Re-read strictly: a private caller is one of our apps, so it must identify itself the same
      // way an authenticated one does. The tolerant values above exist for the public branch.
      this.setMinimalRequestContext({
        apiRoute,
        accessType,
        subdomain: this.getApp(context),
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
