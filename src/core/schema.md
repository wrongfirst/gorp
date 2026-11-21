# Data Schema Specification

Specification of data shapes across persistence and transfer paths:
1. **LocalStorage** (Two-key same-origin split: shared `user_settings` + per-instance `${SITE_SLUG}_storage`)
2. **GitHub Gist** (Cloud sync)
3. **Export Backups** (File export/import)

---

## 1. Current Schemas

### 1.1 LocalStorage (Two-Key Same-Origin Architecture)

Client state is split across two `localStorage` keys on the same origin so preferences, AI credentials, and GitHub authentication are shared across book instances while exercise progress, code, conversations, and per-book Gist pointers remain isolated.

| Key | Scope | Fields | Secrets |
| :--- | :--- | :--- | :--- |
| `user_settings` | Shared across all instances on the origin | `version`, `vimMode`, `preferredLanguage?`, `chatSettings`, `gistAuth` (`{ enabled, token, autoSync }`), `lastVisited?` (`{ siteSlug, siteTitle, lessonSlug, lessonTitle, updatedAt }`) | `chatSettings.apiKey`, `chatSettings.endpoints[].apiKey`, `gistAuth.token` encrypted at rest (`enc:v1:...`) |
| `${SITE_SLUG}_storage` | Per-instance (Zustand `persist` envelope `{ state, version }`) | `activeLessonSlug`, `activeLessonTitle?`, `exerciseCount?`, `currentLanguageId`, `completedSlugs`, `userCode`, `userCodeTimestamps`, `chatConversations`, `activeConversationId`, `gistSync` (`{ gistId, lastSyncedAt }`) | None (credentials live exclusively in `user_settings`) |

#### Shared Key: `user_settings`

Stored as a flat JSON object at the origin root.

```typescript
export interface GistAuthSettings {
  enabled: boolean;
  token: string;                                    // Encrypted at rest (enc:v1:...)
  autoSync: boolean;
}

export interface LastVisitedInfo {
  siteSlug: string;
  siteTitle: string;
  lessonSlug: string;
  lessonTitle: string;
  updatedAt: number;                                // epoch ms
}

export interface UserSettings {
  version: number;                                  // Currently 1
  vimMode: boolean;
  preferredLanguage?: string;                       // Used as fallback on first visit to an instance
  chatSettings: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;                                 // Encrypted at rest (enc:v1:...)
    model: string;
    selectedEndpointId: string;
    endpoints: Array<{
      id: string;
      name?: string;
      baseUrl: string;
      apiKey: string;                               // Encrypted at rest (enc:v1:...)
      model: string;
    }>;
  };
  gistAuth: GistAuthSettings;
  lastVisited?: LastVisitedInfo;
}
```

#### Per-Instance Key: `${SITE_SLUG}_storage`

Stored inside Zustand `persist`'s `{ state: PersistedInstanceState, version: 0 }` envelope.

```typescript
export interface LocalGistSyncState {
  gistId: string;
  lastSyncedAt?: number;                            // epoch ms
}

export interface PersistedInstanceState {
  activeLessonSlug: string;
  activeLessonTitle?: string;
  exerciseCount?: number;
  currentLanguageId: string;
  completedSlugs: string[];
  userCode: Record<string, string>;                 // "${lessonSlug}:${languageId}" -> code
  userCodeTimestamps?: Record<string, number>;      // "${lessonSlug}:${languageId}" -> epoch ms
  chatConversations: Record<string, ChatConversation[]>; // lessonSlug -> conversations
  activeConversationId: Record<string, string>;     // lessonSlug -> active conversationId
  gistSync: LocalGistSyncState;
}
```

#### In-Memory Store (`AppState`)

At runtime, Zustand composes `user_settings` and `${SITE_SLUG}_storage` into a single `AppState` view:
- `gistSyncSettings` combines `user_settings.gistAuth` (`enabled`, `token`, `autoSync`) with `${SITE_SLUG}_storage.state.gistSync` (`gistId`, `lastSyncedAt`).
- `vimMode`, `chatSettings`, `preferredLanguage`, and `lastVisited` hydrate from and persist to `user_settings`.
- On first boot of an instance with no saved `currentLanguageId`, `user_settings.preferredLanguage` is selected if present in `enabledLanguageIds`, otherwise `defaultLanguageId` is used.

#### Canary & Version-Skew Invariants

Because book instances deploy independently on the same origin (canary rollouts), `user_settings` must uphold two strict invariants:

1. **Merge-on-write, never clobber:** Every write to `user_settings` executes on a sequential promise queue, re-reads the raw JSON from `localStorage` immediately before writing, and spreads `{ ...existingRaw, ...patch }` (including nested merges for `chatSettings`, `gistAuth`, and `lastVisited`, and preserving higher `version` values). Older instances never strip unknown fields written by newer canary instances.
2. **Additive-only schema evolution:** Only add optional fields with safe defaults. Never rename or change the type of existing keys in a single rollout step.

#### Legacy Startup Migration

On startup, if `${SITE_SLUG}_storage` contains legacy shared fields (`vimMode`, `chatSettings`, or `gistSyncSettings.{enabled,token,autoSync}`) that are absent from `user_settings`, non-default values are copied into `user_settings` once via merge-on-write without data loss. Per-instance `gistId` and `lastSyncedAt` are read from `gistSync` with fallback to legacy `gistSyncSettings`.

```typescript
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

4 discrete files per Gist (unchanged; one Gist per book instance discovered via `_${SITE_SLUG}.json`):

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

Single JSON file containing all modules (restoring splits shared settings into `user_settings` and per-book state into `${SITE_SLUG}_storage`):

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
| **LocalStorage (`user_settings`)** | Shared flat JSON object (merge-on-write) | `chatSettings.apiKey`, `chatSettings.endpoints[].apiKey`, and `gistAuth.token` encrypted at rest (`enc:v1:...`). |
| **LocalStorage (`${SITE_SLUG}_storage`)** | Per-instance Zustand `persist` JSON envelope | No secrets stored. |
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
| **Vim Mode** | `${SITE_SLUG}_storage.state.vimMode` | `user_settings.vimMode` | Shared across instances; migrated from legacy storage on boot. |
| **Rubber Duck Config** | `${SITE_SLUG}_storage.state.chatSettings` | `user_settings.chatSettings` | Shared across instances with encrypted API keys. |
| **GitHub Auth vs. Gist Pointer** | `${SITE_SLUG}_storage.state.gistSyncSettings` | `user_settings.gistAuth` + `${SITE_SLUG}_storage.state.gistSync` | Token/auth shared across origin; `gistId`/`lastSyncedAt` isolated per instance. |
| **User Code Map** | `userCode["slug:lang"]` | `lessons[i].code[lang]` | Nested per-lesson object map. |

### 4.2 Added / Enhanced Fields

| Field | Location | Rationale |
| :--- | :--- | :--- |
| **`preferredLanguage`** | `user_settings.preferredLanguage` | Cross-book default language fallback when visiting an instance for the first time. |
| **`lastVisited`** | `user_settings.lastVisited` | Tracks latest active `{ siteSlug, siteTitle, lessonSlug, lessonTitle, updatedAt }` for homepage "Continue" affordance. |
| **`activeLessonTitle` & `exerciseCount`** | `${SITE_SLUG}_storage.state` | Cached per-book display metadata for root portal and switcher progress indicators. |
| **`activeConversationId`** | `ConversationsPayload.activeConversationId` | Retains active conversation tab selection across devices and backup restores. |
| **`codeTimestamps`** | `LessonProgressItem.codeTimestamps` | Per-language edit timestamps (`{ [langId]: timestamp }`) for conflict-free multi-language 3-way merges. |

### 4.3 Omitted Fields

| Field | Source | Reason |
| :--- | :--- | :--- |
| **`completedLanguages`** | `LessonProgressItem` in `backup/types.ts` | Dead field; completions are tracked per exercise. |
| **`unread`** | `ChatConversation.unread` in `AppState` | Ephemeral session UI badge; excluded from sync and backups. |
| **Plaintext Secrets** | `apiKey`, `token` | Stripped from Gist sync; encrypted in `user_settings`; omitted from `${SITE_SLUG}_storage`. |
