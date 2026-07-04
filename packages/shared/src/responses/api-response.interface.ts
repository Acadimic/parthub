export interface ApiResponse<T = unknown, E = unknown> {
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: E;
  };
}
