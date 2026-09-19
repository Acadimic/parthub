/** What the server found when it looked up one address, for the AI importers' reference checks. */
export interface ILinkCheck {
  url: string;
  /** Reachable and answering 2xx (for a YouTube address: the video exists and is public). */
  ok: boolean;
  status?: number;
  contentType?: string;
  /** Set when the check could not even be attempted or the request failed outright. */
  error?: string;
}
