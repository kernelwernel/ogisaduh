export interface SnipeEntry {
  authorTag: string;
  authorAvatar: string;
  content: string;
  image: string | null;
  createdAt: number;
}

export interface EditSnipeEntry {
  authorTag: string;
  authorAvatar: string;
  oldContent: string;
  newContent: string;
}

export const snipes: Record<string, SnipeEntry> = {};
export const snipeHistory: SnipeEntry[] = [];

export const editSnipes: Record<string, EditSnipeEntry> = {};
export const editSnipeHistory: EditSnipeEntry[] = [];
