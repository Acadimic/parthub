import { type ApiResponse } from './api-response.interface';

export interface ErrorResponse<E = unknown> extends ApiResponse<never, E> {
  error: {
    code: number;
    message: string;
    details?: E;
  };
}
