// src/core/store/slices/exerciseSlice.ts
import { StateCreator } from 'zustand/vanilla';
import { exercises, getExerciseDisplayTitle } from '../../../exercises/exercise-registry';
import { defaultLanguageId } from '../../../languages/language-registry';
import { SITE_SLUG, SITE_TITLE } from '../../siteConfig';
import { AppState, ExerciseSlice, LastVisitedInfo } from '../../types';
import { scheduleAutoPush, triggerImmediatePush } from '../../sync/syncTriggers';

const initialExerciseSlug = exercises[0]?.id || '';

export const createExerciseSlice: StateCreator<AppState, [], [], ExerciseSlice> = (set, get) => ({
  activeLessonSlug: initialExerciseSlug,
  activeLessonTitle: initialExerciseSlug ? getExerciseDisplayTitle(initialExerciseSlug) : '',
  exerciseCount: exercises.length,
  currentLanguageId: defaultLanguageId,
  completedSlugs: [],
  userCode: {},
  userCodeTimestamps: {},
  vimMode: false,

  markComplete: (slug: string) => {
    const { completedSlugs } = get();
    if (!completedSlugs.includes(slug)) {
      set({ completedSlugs: [...completedSlugs, slug] });
      triggerImmediatePush(get().gistSyncSettings);
    }
  },

  recordLessonVisit: (slug: string) => {
    const title = getExerciseDisplayTitle(slug);
    const lastVisited: LastVisitedInfo = {
      siteSlug: SITE_SLUG,
      siteTitle: SITE_TITLE,
      lessonSlug: slug,
      lessonTitle: title,
      updatedAt: Date.now(),
    };
    set({
      activeLessonSlug: slug,
      activeLessonTitle: title,
      exerciseCount: exercises.length,
      lastVisited,
    });
  },

  setCurrent: (slug: string) => {
    const state = get();
    const title = getExerciseDisplayTitle(slug);
    if (
      state.activeLessonSlug === slug &&
      state.activeLessonTitle === title &&
      state.exerciseCount === exercises.length &&
      state.lastVisited?.siteSlug === SITE_SLUG &&
      state.lastVisited?.lessonSlug === slug &&
      state.lastVisited?.lessonTitle === title
    ) {
      return;
    }
    state.recordLessonVisit(slug);
  },

  setLanguage: (langId: string, options?: { updatePreference?: boolean }) => {
    if (options?.updatePreference === false) {
      set({ currentLanguageId: langId });
    } else {
      set({ currentLanguageId: langId, preferredLanguage: langId });
    }
  },

  saveUserCode: (lessonSlug: string, languageId: string, code: string) => {
    const key = `${lessonSlug}:${languageId}`;
    const now = Date.now();
    set({
      userCode: { ...get().userCode, [key]: code },
      userCodeTimestamps: { ...(get().userCodeTimestamps || {}), [key]: now },
    });
    scheduleAutoPush(get().gistSyncSettings);
  },

  getUserCode: (lessonSlug: string, languageId: string) => {
    const { userCode } = get();
    const key = `${lessonSlug}:${languageId}`;
    return userCode[key];
  },

  setVimMode: (enabled: boolean) => {
    set({ vimMode: enabled });
    scheduleAutoPush(get().gistSyncSettings);
  },
});
