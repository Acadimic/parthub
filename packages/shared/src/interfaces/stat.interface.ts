/**
 * Client-side rollups the apps compute from their stores, not wire shapes — no endpoint returns
 * them. They live here because learning and teaching both derive them and had identical (and in
 * one case near-identical) copies declared inside their own store files.
 */
export interface IBatchStat {
  standard: string;
  subject: string;
  count: number;
  lastUpdatedAt: string;
}

export interface IMaterialStat {
  standard: string;
  subject: string;
  count: number;
  /** Teaching shows total duration per subject; learning does not compute it. */
  durationMins?: number;
  lastUpdatedAt: string;
}
