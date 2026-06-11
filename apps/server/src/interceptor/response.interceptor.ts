import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        if (data && data.message) {
          response.send({
            status: data.status || response.statusCode,
            success: true,
            message: data.message,
            data: data.data || null,
          });
        }
        return data;
      }),
    );
  }
}
