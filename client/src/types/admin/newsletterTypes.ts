// Double opt-in lifecycle: PENDING until the confirmation link is clicked
export type NewsletterStatus = "PENDING" | "CONFIRMED" | "UNSUBSCRIBED";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: NewsletterStatus;
  createdAt: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  // Pending sign-ups only: when the emailed confirmation link stops working
  confirmLinkExpiresAt: string | null;
  // Pending and the link no longer works (decided by the server's clock)
  linkExpired: boolean;
}

export interface NewsletterStats {
  confirmed: number;
  new30: number;
  new7: number;
  pending: number;
  expired: number;
  unsubscribed: number;
}

/** One page of the admin list; counts follow the search, stats are for the whole list */
export interface NewsletterListResponse {
  message: string;
  data: NewsletterSubscriber[];
  total: number;
  totalPages: number;
  currentPage: number;
  counts: Record<"ALL" | NewsletterStatus, number>;
  stats: NewsletterStats;
}
