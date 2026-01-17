export interface Article {
  title: string;
  summary: string;
  source: string;
  link: string;
  image_url: string | null;
  created_at: string;
}

export interface ArticlesResponse {
  count: number;
  articles: Article[];
}

export interface TrendData {
  day: string;
  newsVolume: number;
  sentimentScore: number;
}