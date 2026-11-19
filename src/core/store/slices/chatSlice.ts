// src/core/store/slices/chatSlice.ts
import { StateCreator } from 'zustand/vanilla';
import { AppState, ChatConversation, ChatMessage, ChatSlice } from '../../types';
import { scheduleAutoPush } from '../../sync/syncManager';
import { createUniqueId } from '../../id';

export const createChatSlice: StateCreator<AppState, [], [], ChatSlice> = (set, get) => ({
  chatConversations: {},
  activeConversationId: {},

  createConversation: (lessonSlug: string, languageId: string, title?: string) => {
    const convs = get().chatConversations[lessonSlug] || [];
    const id = createUniqueId('conv');
    const newConv: ChatConversation = {
      id,
      lessonSlug,
      languageId,
      title: title || 'Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    set({
      chatConversations: {
        ...get().chatConversations,
        [lessonSlug]: [newConv, ...convs],
      },
      activeConversationId: {
        ...get().activeConversationId,
        [lessonSlug]: id,
      },
    });
    scheduleAutoPush();
    return id;
  },

  setActiveConversation: (lessonSlug: string, conversationId: string) => {
    const currentConvs = get().chatConversations[lessonSlug] || [];
    const updatedConvs = currentConvs.map((c) =>
      c.id === conversationId ? { ...c, unread: false } : c
    );
    set({
      chatConversations: {
        ...get().chatConversations,
        [lessonSlug]: updatedConvs,
      },
      activeConversationId: {
        ...get().activeConversationId,
        [lessonSlug]: conversationId,
      },
    });
  },

  updateConversationTitle: (lessonSlug: string, conversationId: string, title: string) => {
    const currentConvs = get().chatConversations[lessonSlug] || [];
    const updatedConvs = currentConvs.map((c) =>
      c.id === conversationId ? { ...c, title } : c
    );
    set({
      chatConversations: {
        ...get().chatConversations,
        [lessonSlug]: updatedConvs,
      },
    });
    scheduleAutoPush();
  },

  deleteConversation: (lessonSlug: string, conversationId: string) => {
    const currentConvs = get().chatConversations[lessonSlug] || [];
    const delIdx = currentConvs.findIndex((c) => c.id === conversationId);
    const updatedConvs = currentConvs.filter((c) => c.id !== conversationId);
    const activeId = get().activeConversationId[lessonSlug];
    let nextActiveId = activeId;
    if (activeId === conversationId) {
      if (updatedConvs.length > 0) {
        const nextIdx = Math.min(Math.max(0, delIdx), updatedConvs.length - 1);
        nextActiveId = updatedConvs[nextIdx].id;
      } else {
        nextActiveId = '';
      }
    }
    set({
      chatConversations: {
        ...get().chatConversations,
        [lessonSlug]: updatedConvs,
      },
      activeConversationId: {
        ...get().activeConversationId,
        [lessonSlug]: nextActiveId,
      },
    });
    scheduleAutoPush();
  },

  getActiveConversation: (lessonSlug: string) => {
    const state = get();
    const convs = state.chatConversations[lessonSlug] || [];
    const activeId = state.activeConversationId[lessonSlug];
    if (!activeId) return undefined;
    return convs.find((c) => c.id === activeId);
  },

  addChatMessage: (lessonSlug: string, message: ChatMessage, conversationId?: string) => {
    const state = get();
    let convs = [...(state.chatConversations[lessonSlug] || [])];
    let targetId = conversationId || state.activeConversationId[lessonSlug];
    const isCurrentActive =
      state.activeLessonSlug === lessonSlug && state.activeConversationId[lessonSlug] === targetId;
    const isUnread = !isCurrentActive && message.role === 'assistant';

    let targetConv = convs.find((c) => c.id === targetId);
    if (!targetConv) {
      const newId = createUniqueId('conv');
      targetConv = {
        id: newId,
        lessonSlug,
        languageId: state.currentLanguageId,
        title: 'Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [message],
        unread: isUnread,
      };
      convs.unshift(targetConv);
      targetId = newId;
    } else {
      convs = convs.map((c) => {
        if (c.id === targetId) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, message],
            unread: isCurrentActive ? false : c.unread || isUnread,
          };
        }
        return c;
      });
    }

    const existingActiveId = state.activeConversationId[lessonSlug];
    const nextActiveId = existingActiveId || targetId;

    set({
      chatConversations: {
        ...state.chatConversations,
        [lessonSlug]: convs,
      },
      activeConversationId: {
        ...state.activeConversationId,
        [lessonSlug]: nextActiveId,
      },
    });
    scheduleAutoPush();
  },

  removeChatMessages: (lessonSlug: string, messageIds: string[], conversationId?: string) => {
    const state = get();
    const targetId = conversationId || state.activeConversationId[lessonSlug];
    if (!targetId || !messageIds.length) return;

    const idSet = new Set(messageIds);
    const convs = (state.chatConversations[lessonSlug] || []).map((c) => {
      if (c.id === targetId) {
        return {
          ...c,
          updatedAt: Date.now(),
          messages: c.messages.filter((m) => !idSet.has(m.id)),
        };
      }
      return c;
    });

    set({
      chatConversations: {
        ...state.chatConversations,
        [lessonSlug]: convs,
      },
    });
    scheduleAutoPush();
  },

  clearChatHistory: (lessonSlug: string, conversationId?: string) => {
    const state = get();
    const targetId = conversationId || state.activeConversationId[lessonSlug];
    if (!targetId) return;

    const convs = (state.chatConversations[lessonSlug] || []).map((c) => {
      if (c.id === targetId) {
        return { ...c, messages: [], updatedAt: Date.now() };
      }
      return c;
    });

    set({
      chatConversations: {
        ...state.chatConversations,
        [lessonSlug]: convs,
      },
    });
    scheduleAutoPush();
  },
});
