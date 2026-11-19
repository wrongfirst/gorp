export interface CheatsheetFrontmatter {
  language: string;
  badge: string;
  aliases?: string[];
}

export interface CheatsheetItem {
  id: string;
  title: string;
  language: string;
  badge: string;
  aliases: string[];
  codeLang: string;
  rawMarkdown: string;
  searchableText: string;
}

export interface CheatsheetSearchResult {
  item: CheatsheetItem;
  score: number;
  positions: Set<number>;
}

export interface ScopeOption {
  id: string;
  label: string;
  badge?: string;
  isCurrent?: boolean;
}
