import { IS_PRIVATE_KEY } from '@decorators/private.decorator';
import { IS_PUBLIC_KEY } from '@decorators/public.decorator';
import { FirebaseUserDto } from '@modules/firebase/firebase.dto';
import { FirebaseService } from '@modules/firebase/firebase.service';
import { UserDocument } from '@modules/user/user.schema';
import { UserService } from '@modules/user/user.service';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Secrets } from '@secrets/secrets';
import { SecretsService } from '@secrets/secrets.service';
import { AccessType, Subdomain } from '@parthhub/shared';
import { RegisterUserDto, UserDto } from '@parthhub/shared/validations';
import { INITIAL_LOGIN_DATA_URL } from '@utils/constants';
import { getRegisterPayload, getSubdomainFromUrl } from '@utils/util';
import { DecodedIdToken } from 'firebase-admin/auth';
import { ClsService } from 'nestjs-cls';
import { IRequestContext } from '../context/request-context.interface';

type ContextPayload = {
  apiRoute: string;
  accessType: AccessType;
  subdomain?: Subdomain;
  timezone?: string;
  timezoneOffset?: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly clsService: ClsService,
    private reflector: Reflector,
    private readonly userService: UserService,
    private readonly firebaseService: FirebaseService,
    private secretsService: SecretsService,
  ) {}

  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest<Request & { user: UserDto; headers: Record<string, string> }>();
  }

  getValue(context: ExecutionContext, key: string) {
    return this.reflector.getAllAndOverride<boolean>(key, [context.getHandler(), context.getClass()]);
  }

  getHeaderValue(context: ExecutionContext, key: string) {
    const request = this.getRequest(context);
    const headers = request.headers as unknown as Record<string, string | string[] | undefined>;
    const value = headers[key] || headers[key.toLowerCase()];
    return value;
  }

  setRequestContext(payload: UserDto | RegisterUserDto, otherPayload: ContextPayload) {
    const requestContext: IRequestContext = {
      userId: String(payload._id),
      org: String(payload.org),
      role: (payload as UserDto).role ? String((payload as UserDto).role) : '',
      ...otherPayload,
    };
    this.clsService.set('requestContext', requestContext);
  }

  setMinimalRequestContext(otherPayload: ContextPayload) {
    const requestContext: IRequestContext = {
      userId: '',
      org: '',
      role: '',
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
    const name = firebaseUser.name as string;
    const phone_number = firebaseUser.phone_number as string;
    return { email, uid, name, phone_number };
  }

  async validateAndGetUser(context: ExecutionContext, accessType: AccessType): Promise<UserDto> {
    const request = this.getRequest(context);
    const timezone = this.getHeaderValue(context, 'timezone') as string;
    const timezoneOffset = this.getHeaderValue(context, 'timezone-offset') as string;
    const url = (request as any).url as string;
    const subdomain = getSubdomainFromUrl(url);
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
      const payload = getRegisterPayload(firebaseUser);
      this.setRequestContext(payload, { apiRoute: url, accessType, subdomain, timezone, timezoneOffset });
      user = await this.userService.registerUser(payload, subdomain);
    }
    if (!user) throw new UnauthorizedException('DB user not found!');
    this.userService.updateLastActive(String(user._id), new Date());
    return this.userService.transformUser(user as UserDocument);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const url = (request as any).url as string;
    const method = (request as any).method as string;
    const apiRoute = `${method} ${url}`;
    const subdomain = getSubdomainFromUrl(url);
    const timezone = this.getHeaderValue(context, 'timezone') as string;
    const timezoneOffset = this.getHeaderValue(context, 'timezone-offset') as string;

    const isPublic = this.getValue(context, IS_PUBLIC_KEY);
    const isPrivate = this.getValue(context, IS_PRIVATE_KEY);

    let accessType = AccessType.AUTH;

    if (isPublic) {
      accessType = AccessType.PUBLIC;
      this.setMinimalRequestContext({ apiRoute, accessType, subdomain, timezone, timezoneOffset });
      return true;
    }
    if (isPrivate) {
      accessType = AccessType.PRIVATE;
      const headers = request.headers as unknown as Record<string, string>;
      const apiKey = this.secretsService.get(Secrets.PRIVATE_API_KEY) as string;
      if (headers && apiKey && [headers['api-key']].includes(apiKey)) {
        this.setMinimalRequestContext({ apiRoute, accessType, subdomain, timezone, timezoneOffset });
        return true;
      }
    }

    const user: UserDto = await this.validateAndGetUser(context, accessType);

    if (!user) throw new UnauthorizedException('User not found!');

    this.setRequestContext(user, { apiRoute, accessType, subdomain, timezone, timezoneOffset });

    (request as any).user = user;

    return Promise.resolve(true);
  }
}
