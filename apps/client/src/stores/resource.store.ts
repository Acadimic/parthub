import { Instance, flow, getRoot, types as t } from 'mobx-state-tree';
import { CollectionType } from '../enums';
import { BookmarkService, FollowerService, ReactionService } from '../services';
import { getObjectId } from '../utils/helpers';
import { Bookmark, Follower, IBookmark, IFollower, IMaterial, IReaction, ITestPaper, Reaction } from './models';
import { IStore } from './root.store';

export const ResourceStore = t
  .model({
    bookmarkMaps: t.map(Bookmark),
    reactionMaps: t.map(Reaction),
    followingMaps: t.map(Follower),
    isLoadingBookmark: t.optional(t.boolean, false),
    isLoadingReaction: t.optional(t.boolean, false),
    isLoadingFollowing: t.optional(t.boolean, false),
    isToggleFollowing: t.optional(t.boolean, false),
    isToggleReaction: t.optional(t.boolean, false),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    get bookmarks(): IBookmark[] {
      return Array.from(self.bookmarkMaps.values());
    },

    get reactions(): IReaction[] {
      return Array.from(self.reactionMaps.values());
    },

    get followings(): IFollower[] {
      return Array.from(self.followingMaps.values());
    },
  }))
  .views((self) => ({
    getBookmarkByItemId(course: string, collectionItem: string): IBookmark | undefined {
      return self.bookmarks.find((item) => item.course === course && item.collectionItem === collectionItem);
    },

    getReactionByItemId(course: string, collectionItem: string): IReaction | undefined {
      return self.reactions.find((item) => item.course === course && item.collectionItem === collectionItem);
    },

    getFollowerFollowingMap(followerId: string, followingId: string): IFollower | undefined {
      return self.followings.find((item) => item.follower === followerId && item.following === followingId);
    },
  }))
  .views((self) => ({
    isBookmarked(collectionItem: string): boolean {
      const selectedCourseId = self.rootStore.selectorStore.selectedCourseId;
      if (!selectedCourseId) return false;
      const bookmarkItem = self.getBookmarkByItemId(selectedCourseId, collectionItem);
      return bookmarkItem && !bookmarkItem.isDeleted ? true : false;
    },

    isReacted(collectionItem: string): boolean {
      const selectedCourseId = self.rootStore.selectorStore.selectedCourseId;
      if (!selectedCourseId) return false;
      const reactionItem = self.getReactionByItemId(selectedCourseId, collectionItem);
      return reactionItem && !reactionItem.isDeleted ? true : false;
    },

    isFollowing(userId: string): boolean {
      const selectedUserId = self.rootStore.selectorStore.selectedUserId;
      if (!selectedUserId) return false;
      const followingItem = self.getFollowerFollowingMap(selectedUserId, userId);
      return followingItem && !followingItem.isDeleted ? true : false;
    },
  }))
  .actions((self) => ({
    addBookmark: (obj: IBookmark) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.bookmarkMaps.has(objId);
      if (isObj) self.bookmarkMaps.set(objId, obj);
      else self.bookmarkMaps.put(obj);
    },

    addReaction: (obj: IReaction) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.reactionMaps.has(objId);
      if (isObj) self.reactionMaps.set(objId, obj);
      else self.reactionMaps.put(obj);
    },

    addFollowing: (obj: IFollower) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.followingMaps.has(objId);
      if (isObj) self.followingMaps.set(objId, obj);
      else self.followingMaps.put(obj);
    },
  }))
  .actions((self) => ({
    addBookmarks: (objects: IBookmark[]) => {
      objects.forEach((obj) => self.addBookmark(obj));
    },

    addReactions: (objects: IReaction[]) => {
      objects.forEach((obj) => self.addReaction(obj));
    },

    addFollowings: (objects: IFollower[]) => {
      objects.forEach((obj) => self.addFollowing(obj));
    },
  }))
  .actions((self) => ({
    loadBookmarks: flow(function* () {
      self.isLoadingBookmark = true;
      const result = yield BookmarkService.getBookmarks();
      if (result?.data) self.addBookmarks(result.data);
      self.isLoadingBookmark = false;
    }),

    loadReactions: flow(function* () {
      self.isLoadingReaction = true;
      const result = yield ReactionService.getReactions();
      if (result?.data) self.addReactions(result.data);
      self.isLoadingReaction = false;
    }),

    loadFollowings: flow(function* () {
      self.isLoadingFollowing = true;
      const result = yield FollowerService.getFollowings();
      if (result?.data) self.addFollowings(result.data);
      self.isLoadingFollowing = false;
    }),

    toggleBookmark: flow(function* (collectionItem: string, collectionRef: CollectionType) {
      const selectedCourseId = self.rootStore.selectorStore.selectedCourseId;
      if (!selectedCourseId) return;
      let bookmarkItem = self.getBookmarkByItemId(selectedCourseId, collectionItem);
      if (bookmarkItem) bookmarkItem.toggleDelete();
      else {
        bookmarkItem = Bookmark.create({
          _id: getObjectId(),
          collectionItem,
          collectionRef,
          course: selectedCourseId,
          ...self.rootStore.selectorStore.selectedData,
        });
      }
      const result = yield BookmarkService.upsertBookmark(bookmarkItem);
      if (result?.data) self.addBookmark(result.data);
    }),

    toggleReaction: flow(function* (collectionItem: string, collectionRef: CollectionType) {
      const selectedCourseId = self.rootStore.selectorStore.selectedCourseId;
      let item: IMaterial | ITestPaper | undefined = undefined;
      if (collectionRef === CollectionType.MATERIAL) {
        item = self.rootStore.materialStore.getMaterialById(collectionItem);
      } else if (collectionRef === CollectionType.TEST_PAPER) {
        item = self.rootStore.testPaperStore.getTestPaperById(collectionItem);
      }
      if (!selectedCourseId) return;
      self.isToggleReaction = true;
      let reactionItem = self.getReactionByItemId(selectedCourseId, collectionItem);
      if (reactionItem) reactionItem.toggleDelete();
      else {
        reactionItem = Reaction.create({
          _id: getObjectId(),
          collectionItem,
          collectionRef,
          course: selectedCourseId,
          ...self.rootStore.selectorStore.selectedData,
        });
      }
      const result = yield ReactionService.upsertReaction(reactionItem);
      if (result?.data) self.addReaction(result.data);
      item?.loadReactionsCount();
      self.isToggleReaction = false;
    }),

    toggleFollowing: flow(function* (followingId: string) {
      const selectedUserId = self.rootStore.selectorStore.selectedUserId;
      const following = self.rootStore.userStore.getUserById(followingId);
      if (!selectedUserId || !following) return;
      following.setIsLoadingFollowersCount(true);
      let item = self.getFollowerFollowingMap(selectedUserId, followingId);
      console.log('item: ', item);
      self.isToggleFollowing = true;
      if (item) {
        item.toggleDelete();
      } else {
        item = Follower.create({
          _id: getObjectId(),
          follower: selectedUserId,
          following: followingId,
          ...self.rootStore.selectorStore.selectedData,
        });
      }
      const result = yield FollowerService.upsertFollower(item);
      if (result?.data) self.addFollowing(result.data);
      following.setIsLoadingFollowersCount(false);
      following.loadFollowersCount();
      self.isToggleFollowing = false;
    }),
  }));

export type IResourceStore = Instance<typeof ResourceStore>;
