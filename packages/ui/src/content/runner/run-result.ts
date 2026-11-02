/** What one run of a learner's program produced. */
export interface IRunResult {
  /** Everything the program printed, in order. */
  stdout: string;
  /** The error that stopped it, as its last line ("NameError: name 'x' is not defined"), or null. */
  error: string | null;
  /** True when it ran past the time limit (most likely an infinite loop) and was stopped. */
  isStopped: boolean;
}
