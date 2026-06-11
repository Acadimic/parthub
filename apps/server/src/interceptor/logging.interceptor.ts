import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import * as path from 'path';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: PinoLogger,
    private readonly reflector: Reflector,
  ) {}

  public intercept(context: ExecutionContext, call$: CallHandler): Observable<unknown> {
    const controllerPath = this.reflector.get<string>(PATH_METADATA, context.getClass());
    const routeHandlerPath = this.reflector.get<string>(PATH_METADATA, context.getHandler());
    const route = path.join(controllerPath || '', routeHandlerPath || '');

    this.logger.assign({ route });

    const startTime = Date.now();

    return call$.handle().pipe(
      tap({
        next: (): void => {
          const reply = context.switchToHttp().getResponse();
          if (reply?.request?.originalUrl === '/health') return;
          this.logger.info({
            type: 'request completed',
            statusCode: reply.statusCode,
            ms: Date.now() - startTime,
            msg: 'Request End',
          });
        },
        error: (err: Error): void => {
          if (err instanceof HttpException) {
            const statusCode = err.getStatus();
            const logData = {
              type: 'request completed',
              statusCode,
              ms: Date.now() - startTime,
              error: err,
            };
            if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
              this.logger.error(logData, err.stack);
            } else {
              this.logger.warn(logData);
            }
          } else {
            this.logger.error({ type: 'request completed' }, err.stack);
          }
        },
      }),
    );
  }
}
