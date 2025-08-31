
export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  totalResults?: number | null;
  createdAt: string;
}