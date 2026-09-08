import { type ApiResponse } from './api-response.interface';

export interface SuccessResponse<T = unknown> extends ApiResponse<T, never> {
  data: T;
}
