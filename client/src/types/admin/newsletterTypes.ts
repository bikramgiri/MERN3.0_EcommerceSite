// Double opt-in lifecycle: PENDING until the confirmation link is clicked
export type NewsletterStatus = "PENDING" | "CONFIRMED" | "UNSUBSCRIBED";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: NewsletterStatus;
  createdAt: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
}

export interface NewsletterListResponse {
  message: string;
  totalSubscribers: number;
  data: NewsletterSubscriber[];
}
