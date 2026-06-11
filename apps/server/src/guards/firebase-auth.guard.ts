import { AppConfigService } from '@config';
import { IS_PRIVATE_KEY, IS_PUBLIC_KEY } from '@decorators';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FirebaseAuthGuard extends AuthGuard('firebase-auth') {
  constructor(
    private reflector: Reflector,
    private configService: AppConfigService,
  ) {
    super();
  }

  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }

  getValue(context: ExecutionContext, key: string) {
    return this.reflector.getAllAndOverride<boolean>(key, [context.getHandler(), context.getClass()]);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const isPublic = this.getValue(context, IS_PUBLIC_KEY);
    const isPrivate = this.getValue(context, IS_PRIVATE_KEY);

    if (isPublic) {
      return true;
    }

    if (isPrivate) {
      const headers = request.headers;
      const apiKey = this.configService.privateApiKey;
      if (headers && apiKey && [headers['api-key']].includes(apiKey)) return true;
    }

    // TODO: Add Firebase token validation when FirebaseService is configured
    // For now, allow all authenticated routes
    const tokenString = request.headers['authorization'];
    if (!tokenString) throw new UnauthorizedException('Authorization token is required!');

    return true;
  }
}
