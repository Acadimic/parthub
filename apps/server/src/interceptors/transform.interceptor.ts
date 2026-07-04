import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { SuccessResponse } from '@parthhub/shared';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data: T) => ({
        data,
      })),
    );
  }
}
