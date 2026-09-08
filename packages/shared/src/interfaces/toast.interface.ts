/** The four toast variants. A union rather than a bare string, so a typo is a compile error. */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * A queued toast. Client-only — no endpoint returns one — but all three apps render the same
 * shape, so it lives here rather than being declared three times.
 */
export interface IToast {
  id: number;
  message: string;
  description?: string;
  type: ToastType;
}
