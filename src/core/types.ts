export type ExerciseValidator = (
    code: string,
    output: string,
    languageId?: string
) => true | string;

export interface LanguageVariant {
    initialCode: string;
    testCode: string;
    solutionCode?: string;
    validatorCode?: string;
    validate?: ExerciseValidator;
}

export interface Exercise {
    id: string;
    title: string;
    description: string;
    variants?: Record<string, LanguageVariant>;
}

export function getExerciseVariant(exercise: Exercise, langId: string): LanguageVariant {
    return exercise.variants?.[langId] || {
        initialCode: '',
        testCode: '',
    };
}

export interface Chapter {
    id: string;
    title: string;

    exercises: Exercise[];
}

export interface ExecutionResult {
    success: boolean;
    output: string;
    error?: string;
}


export type RunnerStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface CodeRunner {
    name: string;
    getStatus?(): RunnerStatus;
    isReady(): Promise<boolean>;
    whenReady?(): Promise<void>;
    getInitError?(): string | null;
    subscribeStatus?(listener: (status: RunnerStatus, error?: string | null) => void): () => void;
    run(userCode: string, testCode?: string): Promise<ExecutionResult>;
    lint?(code: string): Promise<any>;
    reset?(): Promise<void> | void;
    terminate?(): void;
}

// Chat Domain Types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    isError?: boolean;
    failedPrompt?: string;
    userMsgId?: string;
}

export interface ChatConversation {
    id: string;
    lessonSlug: string;
    languageId: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
    unread?: boolean;
}

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

export const defaultChatSettings: ChatSettings = {
    enabled: false,
    baseUrl: '',
    apiKey: '',
    model: '',
    selectedEndpointId: 'default-endpoint',
    endpoints: [
        {
            id: 'default-endpoint',
            name: '',
            baseUrl: '',
            apiKey: '',
            model: '',
        },
    ],
};

export interface GistAuthSettings {
    enabled: boolean;
    token: string;
    autoSync: boolean;
}

export const defaultGistAuthSettings: GistAuthSettings = {
    enabled: false,
    token: '',
    autoSync: true,
};

export interface LocalGistSyncState {
    gistId: string;
    lastSyncedAt?: number;
}

export interface GistSyncSettings {
    enabled: boolean;
    token: string;
    gistId: string;
    autoSync: boolean;
    lastSyncedAt?: number;
}

export const defaultGistSyncSettings: GistSyncSettings = {
    enabled: false,
    token: '',
    gistId: '',
    autoSync: true,
};

export interface LastVisitedInfo {
    siteSlug: string;
    siteTitle: string;
    lessonSlug: string;
    lessonTitle: string;
    updatedAt: number;
}

export interface LastCompletedInfo {
    siteSlug: string;
    siteTitle: string;
    lessonSlug: string;
    lessonTitle: string;
    nextLessonSlug: string | null;
    nextLessonTitle: string | null;
    completedAt: number;
}

export interface UserSettings {
    version: number;
    vimMode: boolean;
    preferredLanguage?: string;
    chatSettings: ChatSettings;
    gistAuth: GistAuthSettings;
    lastVisited?: LastVisitedInfo;
    lastCompleted?: LastCompletedInfo;
}

export interface PersistedInstanceState {
    activeLessonSlug: string;
    activeLessonTitle?: string;
    exerciseCount?: number;
    currentLanguageId: string;
    completedSlugs: string[];
    userCode: Record<string, string>;
    userCodeTimestamps?: Record<string, number>;
    chatConversations: Record<string, ChatConversation[]>;
    activeConversationId: Record<string, string>;
    gistSync: LocalGistSyncState;
}

// Store Slices & Combined AppState
export interface ExerciseSlice {
    activeLessonSlug: string;
    activeLessonTitle: string;
    exerciseCount: number;
    currentLanguageId: string;
    completedSlugs: string[];
    userCode: Record<string, string>;
    userCodeTimestamps?: Record<string, number>;
    vimMode: boolean;
    markComplete: (slug: string) => void;
    setCurrent: (slug: string) => void;
    recordLessonVisit: (slug: string) => void;
    setLanguage: (langId: string, options?: { updatePreference?: boolean }) => void;
    saveUserCode: (lessonSlug: string, languageId: string, code: string) => void;
    getUserCode: (lessonSlug: string, languageId: string) => string | undefined;
    setVimMode: (enabled: boolean) => void;
}

export interface ChatSlice {
    chatConversations: Record<string, ChatConversation[]>;
    activeConversationId: Record<string, string>;
    createConversation: (lessonSlug: string, languageId: string, title?: string) => string;
    setActiveConversation: (lessonSlug: string, conversationId: string) => void;
    updateConversationTitle: (lessonSlug: string, conversationId: string, title: string) => void;
    deleteConversation: (lessonSlug: string, conversationId: string) => void;
    getActiveConversation: (lessonSlug: string) => ChatConversation | undefined;
    addChatMessage: (lessonSlug: string, message: ChatMessage, conversationId?: string) => void;
    removeChatMessages: (lessonSlug: string, messageIds: string[], conversationId?: string) => void;
    clearChatHistory: (lessonSlug: string, conversationId?: string) => void;
}

export interface SettingsSlice {
    chatSettings: ChatSettings;
    preferredLanguage?: string;
    lastVisited?: LastVisitedInfo;
    lastCompleted?: LastCompletedInfo;
    setChatSettings: (settings: Partial<ChatSettings>) => void;
    setPreferredLanguage: (langId: string) => void;
    setLastVisited: (info: LastVisitedInfo) => void;
    setLastCompleted: (info: LastCompletedInfo) => void;
}

export interface SyncSlice {
    gistSyncSettings: GistSyncSettings;
    setGistSyncSettings: (settings: Partial<GistSyncSettings>) => void;
    unlinkGist: () => void;
}

export interface BackupSlice {
    resetProgress: () => void;
    restoreBackup: (backupState: Partial<AppState>) => void;
}

export type AppState = ExerciseSlice & ChatSlice & SettingsSlice & SyncSlice & BackupSlice;