import { AppState, ChatConversation, ChatMessage, ChatSettings, GistSyncSettings } from '../types';

export interface MetadataPayload {
  version: number;
  siteTitle: string;
  siteSlug: string;
  storageKey: string;
  exportedAt: string;
  updatedAt: number;
}

export interface LessonProgressItem {
  slug: string;
  completed: boolean;
  code?: Record<string, string>;
  updatedAt?: number;
}

export interface LessonsPayload {
  version: number;
  activeLessonSlug: string;
  activeLanguageId: string;
  lessons: LessonProgressItem[];
}

export type SavedChatMessage = ChatMessage;

export type SavedConversation = Omit<ChatConversation, 'unread'>;

export interface ConversationsPayload {
  version: number;
  conversations: SavedConversation[];
}

export interface SettingsPayload {
  vimMode: boolean;
  chatSettings: ChatSettings;
  gistSyncSettings: GistSyncSettings;
}

export interface ModularBackupPayload {
  metadata: MetadataPayload;
  lessons: LessonsPayload;
  conversations: ConversationsPayload;
  settings: SettingsPayload;
}

export interface ExportOptions {
  includeKeys?: boolean;
}

