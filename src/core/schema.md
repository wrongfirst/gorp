# Data Schema Specification

Specification of data shapes across persistence and transfer paths:
1. **LocalStorage** (Client state)
2. **GitHub Gist** (Cloud sync)
3. **Export Backups** (File export/import)

---

## 1. Current Schemas

### 1.1 LocalStorage (`AppState`)

Key: `${SITE_SLUG}_storage`. Secrets encrypted at rest (`enc:v1:...`).

```typescript
export interface AppState {
  // Lessons
  activeLessonSlug: string;
  currentLanguageId: string;
  completedSlugs: string[];
  userCode: Record<string, string>;               // "${lessonSlug}:${languageId}" -> code
  userCodeTimestamps?: Record<string, number>;     // "${lessonSlug}:${languageId}" -> epoch ms
  vimMode: boolean;

  // Chat
  chatConversations: Record<string, ChatConversation[]>; // lessonSlug -> conversations
  activeConversationId: Record<string, string>;          // lessonSlug -> active conversationId

  // Settings
  chatSettings: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;                               // Encrypted in storage
    model: string;
    selectedEndpointId: string;
    endpoints: Array<{
      id: string;
      name?: string;
      baseUrl: string;
      apiKey: string;
      model: string;
    }>;
  };

  // Sync
  gistSyncSettings: {
    enabled: boolean;
    token: string;                                // Encrypted in storage
    gistId: string;
    autoSync: boolean;
    lastSyncedAt?: number;
  };
}

export interface ChatConversation {
  id: string;
  lessonSlug: string;
  languageId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    isError?: boolean;
    failedPrompt?: string;
    userMsgId?: string;
  }>;
  unread?: boolean;
}
```

---

### 1.2 GitHub Gist (Cloud Sync)

4 discrete files per Gist:

#### `_${SITE_SLUG}.json` (Metadata)
```json
{
  "version": 1,
  "siteTitle": "Site Title",
  "siteSlug": "site-slug",
  "storageKey": "site-slug_storage",
  "exportedAt": "2026-08-21T09:00:00.000Z",
  "updatedAt": 1724230800000
}
```

#### `lessons.json` (LessonsPayload)
```json
{
  "version": 1,
  "activeLessonSlug": "lesson-id",
  "activeLanguageId": "typescript",
  "lessons": [
    {
      "slug": "lesson-id",
      "completed": true,
      "code": {
        "typescript": "...",
        "python": "..."
      },
      "updatedAt": 1724230800000
    }
  ]
}
```

#### `conversations.json` (ConversationsPayload)
```json
{
  "version": 1,
  "conversations": [
    {
      "id": "conv-id",
      "lessonSlug": "lesson-id",
      "languageId": "typescript",
      "title": "Chat Title",
      "createdAt": 1724230700000,
      "updatedAt": 1724230800000,
      "messages": [
        {
          "id": "msg-id",
          "role": "user",
          "content": "...",
          "timestamp": 1724230750000
        }
      ]
    }
  ]
}
```

#### `settings.json` (SettingsPayload)
```json
{
  "vimMode": false,
  "chatSettings": {
    "enabled": true,
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "",
    "model": "gpt-4o",
    "selectedEndpointId": "default-endpoint",
    "endpoints": [
      {
        "id": "default-endpoint",
        "name": "Endpoint 1",
        "baseUrl": "https://api.openai.com/v1",
        "apiKey": "",
        "model": "gpt-4o"
      }
    ]
  },
  "gistSyncSettings": {
    "enabled": true,
    "token": "",
    "gistId": "gist-id",
    "autoSync": true,
    "lastSyncedAt": 1724230800000
  }
}
```

---

### 1.3 Export Backups (`ModularBackupPayload`)

Single JSON file containing all modules:

```json
{
  "metadata": { /* MetadataPayload */ },
  "lessons": { /* LessonsPayload */ },
  "conversations": { /* ConversationsPayload */ },
  "settings": { /* SettingsPayload */ }
}
```

---

## 2. Unified Schema

Canonical data models across all channels:

```typescript
// --- Metadata ---
export interface MetadataPayload {
  version: number;
  siteTitle: string;
  siteSlug: string;
  storageKey: string;
  exportedAt: string;
  updatedAt: number;
}

// --- Lessons & Progress ---
export interface LessonProgressItem {
  slug: string;
  completed: boolean;
  code: Record<string, string>;                     // langId -> code
  codeTimestamps?: Record<string, number>;          // langId -> epoch ms
  updatedAt?: number;                               // max timestamp
}

export interface LessonsPayload {
  version: number;
  activeLessonSlug: string;
  activeLanguageId: string;
  lessons: LessonProgressItem[];
}

// --- Chat Conversations ---
export interface SavedChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isError?: boolean;
  failedPrompt?: string;
  userMsgId?: string;
}

export interface SavedConversation {
  id: string;
  lessonSlug: string;
  languageId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: SavedChatMessage[];
}

export interface ConversationsPayload {
  version: number;
  activeConversationId?: Record<string, string>;    // lessonSlug -> conversationId
  conversations: SavedConversation[];
}

// --- Settings ---
export interface ChatEndpoint {
  id: string;
  name?: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ChatSettings {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  selectedEndpointId: string;
  endpoints: ChatEndpoint[];
}

export interface GistSyncSettings {
  enabled: boolean;
  token: string;
  gistId: string;
  autoSync: boolean;
  lastSyncedAt?: number;
}

export interface SettingsPayload {
  vimMode: boolean;
  chatSettings: ChatSettings;
  gistSyncSettings: GistSyncSettings;
}

// --- Backup Payload ---
export interface ModularBackupPayload {
  metadata: MetadataPayload;
  lessons: LessonsPayload;
  conversations: ConversationsPayload;
  settings: SettingsPayload;
}
```

---

## 3. Storage & Transmission Mapping

| Channel | Storage Format | Secrets Handling |
| :--- | :--- | :--- |
| **LocalStorage** | Unified modules in client state | `apiKey` and `token` encrypted at rest (`enc:v1:...`). |
| **GitHub Gist** | 4 files (`_${SITE_SLUG}.json`, `lessons.json`, `conversations.json`, `settings.json`) | `apiKey` and `token` stripped (`""`). |
| **Export File** | Single `ModularBackupPayload` JSON file | Stripped by default; plaintext only on explicit export option (`includeKeys: true`). |

---

## 4. Field Tracking & Divergence

### 4.1 Retained & Standardized Fields

| Field / Concept | Legacy Location | Unified Location | Resolution |
| :--- | :--- | :--- | :--- |
| **Exercise Slug Pointer** | `AppState.currentExerciseId` | `activeLessonSlug` | Standardized to `activeLessonSlug`. |
| **Language Pointer** | `AppState.currentLanguageId` | `activeLanguageId` | Standardized to `activeLanguageId`. |
| **Exercise Association** | `ChatConversation.exerciseId` | `lessonSlug` | Standardized to `lessonSlug`. |
| **Vim Mode** | `AppState.vimMode` | `settings.vimMode` | Stored directly at root of settings (not nested). |
| **User Code Map** | `userCode["slug:lang"]` | `lessons[i].code[lang]` | Nested per-lesson object map. |

### 4.2 Added / Enhanced Fields

| Field | Location | Rationale |
| :--- | :--- | :--- |
| **`activeConversationId`** | `ConversationsPayload.activeConversationId` | Retains active conversation tab selection across devices and backup restores. |
| **`codeTimestamps`** | `LessonProgressItem.codeTimestamps` | Per-language edit timestamps (`{ [langId]: timestamp }`) for conflict-free multi-language 3-way merges. |

### 4.3 Omitted Fields

| Field | Source | Reason |
| :--- | :--- | :--- |
| **`completedLanguages`** | `LessonProgressItem` in `backup/types.ts` | Dead field; completions are tracked per exercise. |
| **`unread`** | `ChatConversation.unread` in `AppState` | Ephemeral session UI badge; excluded from sync and backups. |
| **Plaintext Secrets** | `apiKey`, `token` | Stripped from Gist sync; encrypted in LocalStorage. |
