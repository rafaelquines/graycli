import { FullMessage } from "./full-message";

export interface SearchResult {
  built_query: string;
  query: string;
  messages: FullMessage[];
  fields: string[];
  time: number;
  total_results: number;
  from: string;
  to: string;
  decoration_stats?: any;
}