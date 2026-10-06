import { type BookmarkDto, type FollowerDto, type ReactionDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { CollectionType } from '../enums';
import { BookmarkService, FollowerService, ReactionService } from '../services';
import { getObjectId } from '../utils/helpers';
import { useDiscussionStore } from './discussion.store';
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
  /** Forget a row that never reached the server, after an optimistic add failed. */
  dropBookmark: (bookmarkId: string) => void;
  dropReaction: (reactionId: string) => void;
  dropFollowing: (followingId: string) => void;
  addReactions: (reactions: ReactionDto[]) => void;
  addFollowings: (followings: FollowerDto[]) => void;

  loadBookmarks: () => Promise<void>;
  loadReactions: () => Promise<void>;
  loadFollowings: () => Promise<void>;
  /** Adds the bookmark, or flips `_deleted` on the one already there. */
  toggleBookmark: (collectionItem: string, collectionRef: CollectionType) => Promise<void>;
  /** Removes a bookmark by its row, for screens with no selected course, such as the activity page. */
  removeBookmark: (bookmark: BookmarkDto) => Promise<void>;
  toggleReaction: (collectionItem: string, collectionRef: CollectionType) => Promise<void>;
  toggleFollowing: (followingId: string) => Promise<void>;
  reset: () => void;
}

/** Nudges the item's like count on whichever store holds the item, ahead of the server's answer. */
const adjustReactionsCount = (collectionRef: CollectionType, collectionItem: string, delta: number) => {
  if (collectionRef === CollectionType.MATERIAL) {
    const material = useMaterialStore.getState().getMaterialById(collectionItem);
    if (material) {
      useMaterialStore.getState().patchMaterial(collectionItem, {
        reactionsCount: Math.max(0, (material.reactionsCount ?? 0) + delta),
      });
    }
  } else if (collectionRef === CollectionType.COURSE_COMMENT || collectionRef === CollectionType.COURSE_REVIEW) {
    useDiscussionStore.getState().adjustLikes(collectionItem, delta);
  } else if (collectionRef === CollectionType.TEST_PAPER) {
    const testPaper = useTestPaperStore.getState().getTestPaperById(collectionItem);
    if (testPaper) {
      useTestPaperStore.getState().patchTestPaper(collectionItem, {
        reactionsCount: Math.max(0, (testPaper.reactionsCount ?? 0) + delta),
      });
    }
  }
};

/** Re-reads the item's like count from the server, so the local nudge is corrected if it drifted. */
const refreshReactionsCount = async (collectionRef: CollectionType, collectionItem: string) => {
  if (collectionRef === CollectionType.MATERIAL) await useMaterialStore.getState().loadReactionsCount(collectionItem);
  else if (collectionRef === CollectionType.TEST_PAPER) {
    await useTestPaperStore.getState().loadReactionsCount(collectionItem);
  }
};

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

  dropBookmark: (bookmarkId) => {
    set((state) => {
      const { [bookmarkId]: _dropped, ...bookmarkMap } = state.bookmarkMap;
      return { bookmarkMap };
    });
  },

  dropReaction: (reactionId) => {
    set((state) => {
      const { [reactionId]: _dropped, ...reactionMap } = state.reactionMap;
      return { reactionMap };
    });
  },

  dropFollowing: (followingId) => {
    set((state) => {
      const { [followingId]: _dropped, ...followingMap } = state.followingMap;
      return { followingMap };
    });
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
    // The API removes a row by upserting it with `_deleted`; every read filters those out. Only
    // the DTO's fields go back: a row read from the API carries `__v` and the audit fields, which
    // the server's whitelist rejects.
    const payload: BookmarkDto = existing
      ? { _id: existing._id, collectionItem, collectionRef, course: selectedCourseId, _deleted: !existing._deleted }
      : { _id: getObjectId(), collectionItem, collectionRef, course: selectedCourseId };
    // Shown at once and confirmed by the response; put back the way it was if the save fails.
    get().addBookmarks([payload]);
    try {
      const result = await BookmarkService.upsertBookmark(payload);
      if (result?.data) get().addBookmarks([result.data]);
    } catch (error) {
      if (existing) get().addBookmarks([existing]);
      else get().dropBookmark(payload._id);
      throw error;
    }
  },

  removeBookmark: async (bookmark) => {
    // Only the DTO's fields, for the same reason as `toggleBookmark`.
    const payload: BookmarkDto = {
      _id: bookmark._id,
      collectionItem: bookmark.collectionItem,
      collectionRef: bookmark.collectionRef,
      course: bookmark.course,
      _deleted: true,
    };
    // The row goes at once and comes back only if the save fails: the round trip to the database
    // is long enough that a card lingering after "Remove" reads as the click not working.
    get().addBookmarks([{ ...bookmark, _deleted: true }]);
    try {
      const result = await BookmarkService.upsertBookmark(payload);
      if (result?.data) get().addBookmarks([result.data]);
    } catch (error) {
      get().addBookmarks([bookmark]);
      throw error;
    }
  },

  toggleReaction: (collectionItem, collectionRef) =>
    get().run('toggleReaction', async () => {
      const selectedCourseId = useSelectorStore.getState().selectedCourseId;
      if (!selectedCourseId) return;
      const existing = get().getReactionByItemId(selectedCourseId, collectionItem);
      // Only the DTO's fields, for the same reason as `toggleBookmark`.
      const payload: ReactionDto = existing
        ? { _id: existing._id, collectionItem, collectionRef, course: selectedCourseId, _deleted: !existing._deleted }
        : { _id: getObjectId(), collectionItem, collectionRef, course: selectedCourseId };
      const isLiking = !payload._deleted;
      // Shown at once — the row and the count on the item — and confirmed by the response. The
      // count is re-read afterwards without being waited for, so the button never sits on a spinner
      // for a second round trip; if the save fails, both go back the way they were.
      get().addReactions([payload]);
      adjustReactionsCount(collectionRef, collectionItem, isLiking ? 1 : -1);
      try {
        const result = await ReactionService.upsertReaction(payload);
        if (result?.data) get().addReactions([result.data]);
        void refreshReactionsCount(collectionRef, collectionItem);
      } catch (error) {
        if (existing) get().addReactions([existing]);
        else get().dropReaction(payload._id);
        adjustReactionsCount(collectionRef, collectionItem, isLiking ? -1 : 1);
        throw error;
      }
    }),

  toggleFollowing: (followingId) =>
    get().run('toggleFollowing', async () => {
      const selectedUserId = useSelectorStore.getState().selectedUserId;
      const userStore = useUserStore.getState();
      if (!selectedUserId || !userStore.getUserById(followingId)) return;
      const existing = get().getFollowerFollowingMap(selectedUserId, followingId);
      // Only the DTO's fields, for the same reason as `toggleBookmark`.
      const payload: FollowerDto = existing
        ? { _id: existing._id, follower: selectedUserId, following: followingId, _deleted: !existing._deleted }
        : { _id: getObjectId(), follower: selectedUserId, following: followingId };
      const isFollowing = !payload._deleted;
      const followed = userStore.getUserById(followingId);
      // Shown at once, as for reactions; the follower count is nudged locally and re-read later.
      get().addFollowings([payload]);
      userStore.patchUser(followingId, {
        followersCount: Math.max(0, (followed?.followersCount ?? 0) + (isFollowing ? 1 : -1)),
      });
      try {
        const result = await FollowerService.upsertFollower(payload);
        if (result?.data) get().addFollowings([result.data]);
        void userStore.loadFollowersCount(followingId);
      } catch (error) {
        if (existing) get().addFollowings([existing]);
        else get().dropFollowing(payload._id);
        userStore.patchUser(followingId, { followersCount: followed?.followersCount ?? 0 });
        throw error;
      }
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
