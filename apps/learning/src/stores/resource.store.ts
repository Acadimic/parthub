import { type BookmarkDto, type FollowerDto, type ReactionDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { CollectionType } from '../enums';
import { BookmarkService, FollowerService, ReactionService } from '../services';
import { getObjectId } from '../utils/helpers';
import { useMaterialStore } from './material.store';
import { useSelectorStore } from './selector.store';
import { useTestPaperStore } from './test-paper.store';
import { useUserStore } from './user.store';

/** The fetches this store tracks. `toggleReaction` and `toggleFollowing` get their own. */
type ResourceFetch = 'bookmarks' | 'reactions' | 'followings' | 'toggleReaction' | 'toggleFollowing';

export interface IResourceState extends IRequestSlice<ResourceFetch> {
  bookmarkMap: Record<string, BookmarkDto>;
  reactionMap: Record<string, ReactionDto>;
  followingMap: Record<string, FollowerDto>;

  getBookmarks: () => BookmarkDto[];
  getReactions: () => ReactionDto[];
  getFollowings: () => FollowerDto[];
  getBookmarkByItemId: (courseId: string, collectionItem: string) => BookmarkDto | undefined;
  getReactionByItemId: (courseId: string, collectionItem: string) => ReactionDto | undefined;
  getFollowerFollowingMap: (followerId: string, followingId: string) => FollowerDto | undefined;
  /** Whether the selected course's item is bookmarked — a soft-deleted row counts as not. */
  isBookmarked: (collectionItem: string) => boolean;
  isReacted: (collectionItem: string) => boolean;
  isFollowing: (userId: string) => boolean;

  addBookmarks: (bookmarks: BookmarkDto[]) => void;
  addReactions: (reactions: ReactionDto[]) => void;
  addFollowings: (followings: FollowerDto[]) => void;

  loadBookmarks: () => Promise<void>;
  loadReactions: () => Promise<void>;
  loadFollowings: () => Promise<void>;
  /** Adds the bookmark, or flips `_deleted` on the one already there. */
  toggleBookmark: (collectionItem: string, collectionRef: CollectionType) => Promise<void>;
  toggleReaction: (collectionItem: string, collectionRef: CollectionType) => Promise<void>;
  toggleFollowing: (followingId: string) => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

export const useResourceStore = create<IResourceState>()((set, get) => ({
  bookmarkMap: {},
  reactionMap: {},
  followingMap: {},
  ...createRequestSlice(['bookmarks', 'reactions', 'followings', 'toggleReaction', 'toggleFollowing'], set, get),

  getBookmarks: () => Object.values(get().bookmarkMap),

  getReactions: () => Object.values(get().reactionMap),

  getFollowings: () => Object.values(get().followingMap),

  getBookmarkByItemId: (courseId, collectionItem) =>
    get()
      .getBookmarks()
      .find((item) => item.course === courseId && item.collectionItem === collectionItem),

  getReactionByItemId: (courseId, collectionItem) =>
    get()
      .getReactions()
      .find((item) => item.course === courseId && item.collectionItem === collectionItem),

  getFollowerFollowingMap: (followerId, followingId) =>
    get()
      .getFollowings()
      .find((item) => item.follower === followerId && item.following === followingId),

  isBookmarked: (collectionItem) => {
    const selectedCourseId = useSelectorStore.getState().selectedCourseId;
    if (!selectedCourseId) return false;
    const bookmark = get().getBookmarkByItemId(selectedCourseId, collectionItem);
    return !!bookmark && !bookmark._deleted;
  },

  isReacted: (collectionItem) => {
    const selectedCourseId = useSelectorStore.getState().selectedCourseId;
    if (!selectedCourseId) return false;
    const reaction = get().getReactionByItemId(selectedCourseId, collectionItem);
    return !!reaction && !reaction._deleted;
  },

  isFollowing: (userId) => {
    const selectedUserId = useSelectorStore.getState().selectedUserId;
    if (!selectedUserId) return false;
    const following = get().getFollowerFollowingMap(selectedUserId, userId);
    return !!following && !following._deleted;
  },

  addBookmarks: (bookmarks) => {
    set((state) => ({ bookmarkMap: { ...state.bookmarkMap, ...keyById(bookmarks) } }));
  },

  addReactions: (reactions) => {
    set((state) => ({ reactionMap: { ...state.reactionMap, ...keyById(reactions) } }));
  },

  addFollowings: (followings) => {
    set((state) => ({ followingMap: { ...state.followingMap, ...keyById(followings) } }));
  },

  loadBookmarks: () =>
    get().run('bookmarks', async () => {
      const result = await BookmarkService.getBookmarks();
      if (result?.data) get().addBookmarks(result.data);
    }),

  loadReactions: () =>
    get().run('reactions', async () => {
      const result = await ReactionService.getReactions();
      if (result?.data) get().addReactions(result.data);
    }),

  loadFollowings: () =>
    get().run('followings', async () => {
      const result = await FollowerService.getFollowings();
      if (result?.data) get().addFollowings(result.data);
    }),

  toggleBookmark: async (collectionItem, collectionRef) => {
    const selectedCourseId = useSelectorStore.getState().selectedCourseId;
    if (!selectedCourseId) return;
    const existing = get().getBookmarkByItemId(selectedCourseId, collectionItem);
    // The API removes a row by upserting it with `_deleted`; every read filters those out.
    const payload: BookmarkDto = existing
      ? { ...existing, _deleted: !existing._deleted }
      : { _id: getObjectId(), collectionItem, collectionRef, course: selectedCourseId };
    const result = await BookmarkService.upsertBookmark(payload);
    if (result?.data) get().addBookmarks([result.data]);
  },

  toggleReaction: (collectionItem, collectionRef) =>
    get().run('toggleReaction', async () => {
      const selectedCourseId = useSelectorStore.getState().selectedCourseId;
      if (!selectedCourseId) return;
      const existing = get().getReactionByItemId(selectedCourseId, collectionItem);
      const payload: ReactionDto = existing
        ? { ...existing, _deleted: !existing._deleted }
        : { _id: getObjectId(), collectionItem, collectionRef, course: selectedCourseId };
      const result = await ReactionService.upsertReaction(payload);
      if (result?.data) get().addReactions([result.data]);
      // The count lives on the row the reaction belongs to, so its own store refreshes it.
      if (collectionRef === CollectionType.MATERIAL) {
        await useMaterialStore.getState().loadReactionsCount(collectionItem);
      } else if (collectionRef === CollectionType.TEST_PAPER) {
        await useTestPaperStore.getState().loadReactionsCount(collectionItem);
      }
    }),

  toggleFollowing: (followingId) =>
    get().run('toggleFollowing', async () => {
      const selectedUserId = useSelectorStore.getState().selectedUserId;
      const userStore = useUserStore.getState();
      if (!selectedUserId || !userStore.getUserById(followingId)) return;
      const existing = get().getFollowerFollowingMap(selectedUserId, followingId);
      const payload: FollowerDto = existing
        ? { ...existing, _deleted: !existing._deleted }
        : { _id: getObjectId(), follower: selectedUserId, following: followingId };
      const result = await FollowerService.upsertFollower(payload);
      if (result?.data) get().addFollowings([result.data]);
      await userStore.loadFollowersCount(followingId);
    }),

  reset: () => {
    set({ bookmarkMap: {}, reactionMap: {}, followingMap: {} });
    get().resetRequests();
  },
}));

/**
 * The store's lookups, subscribed to the state they read.
 *
 * `isBookmarked`, `isReacted` and `isFollowing` all depend on the current selection, so this
 * subscribes to the selector store too — otherwise switching course would leave them stale.
 */
export const useResourceLookups = (): IResourceState => {
  useSelectorStore(useShallow((state) => [state.selectedCourseId, state.selectedUserId]));
  return useResourceStore(useShallow((state) => state));
};
