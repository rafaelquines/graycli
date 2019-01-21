import { Message } from "./message";

export interface FullMessage {
  highlight_ranges: any;
  message: Message;
  index: string;
  decoration_stats?: any;
}