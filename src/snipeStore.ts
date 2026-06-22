export interface SnipeEntry {
  authorTag: string;
  authorAvatar: string;
  content: string;
  image: string | null;
  createdAt: number;
}

export const snipes: Record<string, SnipeEntry> = {};
export const snipeHistory: SnipeEntry[] = [];
