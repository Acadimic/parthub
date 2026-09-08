import { type IStandardSubjectQuery, type ISelectItem } from '@interfaces';
import { type Instance, flow, getRoot, types as t } from 'mobx-state-tree';
import { ChapterService, StandardService, SubjectService } from '../services';
import { STANDARD_GROUP_ORDER } from '../utils/constants';
import { getObjectId, getStandardSelectItem } from '../utils/helpers';
import {
  Chapter,
  type IChapter,
  type IStandard,
  type IStandardSubjectMapping,
  type ISubject,
  Standard,
  StandardSubjectMapping,
  Subject,
} from './models';
import { type IStore } from './root.store';

export const StandardStore = t
  .model({
    standardMaps: t.map(Standard),
    subjectMaps: t.map(Subject),
    chapterMaps: t.map(Chapter),
    standardSubjectMappingMaps: t.map(StandardSubjectMapping),
    isLoadingSubject: t.optional(t.boolean, false),
    isLoadedSubject: t.optional(t.boolean, false),
    isLoadingStandard: t.optional(t.boolean, false),
    isLoadedStandard: t.optional(t.boolean, false),
    isLoadingMapping: t.optional(t.boolean, false),
    isLoadedMapping: t.optional(t.boolean, false),
    isLoadingChapter: t.optional(t.boolean, false),
    isLoadedChapter: t.optional(t.boolean, false),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    getStandardById(standardId: string): IStandard | undefined {
      return standardId ? self.standardMaps.get(standardId) : undefined;
    },

    getSubjectById(subjectId: string): ISubject | undefined {
      return subjectId ? self.subjectMaps.get(subjectId) : undefined;
    },

    getChapterById(chapterId: string): IChapter | undefined {
      return chapterId ? self.chapterMaps.get(chapterId) : undefined;
    },

    get standards(): IStandard[] {
      return Array.from(self.standardMaps.values()).sort((a, b) => a.order - b.order);
    },

    get subjects(): ISubject[] {
      return Array.from(self.subjectMaps.values());
    },

    get chapters(): IChapter[] {
      return Array.from(self.chapterMaps.values());
    },

    get standardSubjectMappings(): IStandardSubjectMapping[] {
      return Array.from(self.standardSubjectMappingMaps.values());
    },
  }))
  .views((self) => ({
    getStandardsByIds(standardIds: string[]): IStandard[] {
      const standards: IStandard[] = [];
      standardIds.forEach((standardId) => {
        const standard = self.getStandardById(standardId);
        if (standard) standards.push(standard);
      });
      return standards;
    },

    getSubjectsByIds(subjectIds: string[]): ISubject[] {
      const subjects: ISubject[] = [];
      subjectIds.forEach((subjectId) => {
        const subject = self.getSubjectById(subjectId);
        if (subject) subjects.push(subject);
      });
      return subjects;
    },

    getStandardSubjectMappings(standardId: string): IStandardSubjectMapping[] {
      return self.standardSubjectMappings.filter((mapping) => mapping.standard === standardId);
    },

    get standardItems(): ISelectItem[] {
      return self.standards.map((standard) => getStandardSelectItem(standard));
    },
  }))
  .views((self) => ({
    getStandardSubjects(standardId: string): ISubject[] {
      const standardSubjectMappings = self.getStandardSubjectMappings(standardId).sort((a, b) => a.order - b.order);
      const subjectIds = standardSubjectMappings.map((mapping) => mapping.subject);
      return self.getSubjectsByIds(subjectIds);
    },

    getNextStandardGroupOrder(standardId: string, group: string): number {
      const standards = self.standards.filter((standard) => standard.group === group && standard._id !== standardId);
      const initialOrder = STANDARD_GROUP_ORDER[group];
      if (!initialOrder) return 0;
      return standards.length + initialOrder;
    },

    getStandardSubjectChapters(standardId: string, subjectId: string): IChapter[] {
      return self.chapters.filter((chapter) => chapter.standard === standardId && chapter.subject === subjectId);
    },
  }))
  .actions((self) => ({
    addStandard: (obj: IStandard) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.standardMaps.has(objId);
      if (isObj) self.standardMaps.set(objId, obj);
      else self.standardMaps.put(obj);
    },

    addSubject: (obj: ISubject) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.subjectMaps.has(objId);
      if (isObj) self.subjectMaps.set(objId, obj);
      else self.subjectMaps.put(obj);
    },

    addChapter: (obj: IChapter) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.chapterMaps.has(objId);
      if (isObj) self.chapterMaps.set(objId, obj);
      else self.chapterMaps.put(obj);
    },

    addStandardSubjectMapping: (obj: IStandardSubjectMapping) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.standardSubjectMappingMaps.has(objId);
      if (isObj) self.standardSubjectMappingMaps.set(objId, obj);
      else self.standardSubjectMappingMaps.put(obj);
    },

    removeSubjectById: (subjectId: string) => {
      self.subjectMaps.delete(subjectId);
    },

    removeStandardById: (standardId: string) => {
      self.standardMaps.delete(standardId);
    },

    removeChapterById: (chapterId: string) => {
      self.chapterMaps.delete(chapterId);
    },

    removeStandardSubjectMapping: (_id: string) => {
      self.standardSubjectMappingMaps.delete(_id);
    },
  }))
  .actions((self) => ({
    addStandards: (objects: IStandard[]) => {
      objects.forEach((obj) => self.addStandard(obj));
    },

    addSubjects: (objects: ISubject[]) => {
      objects.forEach((obj) => self.addSubject(obj));
    },

    addChapters: (objects: IChapter[]) => {
      objects.forEach((obj) => self.addChapter(obj));
    },

    addStandardSubjectMappings: (objects: IStandardSubjectMapping[]) => {
      objects.forEach((obj) => self.addStandardSubjectMapping(obj));
    },

    removeStandardSubjectMappings: (mappings: IStandardSubjectMapping[]) => {
      mappings.forEach((mapping) => self.removeStandardSubjectMapping(mapping._id));
    },
  }))
  .actions((self) => ({
    loadSubjects: flow(function* () {
      self.isLoadingSubject = true;
      const result = yield SubjectService.getSubjects();
      if (result?.data) self.addSubjects(result.data);
      self.isLoadingSubject = false;
      self.isLoadedSubject = true;
    }),

    loadStandards: flow(function* () {
      self.isLoadingStandard = true;
      const result = yield StandardService.getStandards();
      if (result?.data) self.addStandards(result.data);
      self.isLoadingStandard = false;
      self.isLoadingStandard = true;
    }),

    loadStandardSubjectChapters: flow(function* ({ standard, subject }: IStandardSubjectQuery) {
      self.isLoadingChapter = true;
      const result = yield ChapterService.getStandardSubjectChapters({ standard, subject });
      if (result?.data) self.addChapters(result.data);
      self.isLoadingChapter = false;
      self.isLoadedChapter = true;
    }),

    loadOrgChapters: flow(function* () {
      self.isLoadingChapter = true;
      const result = yield ChapterService.getOrgChapters();
      if (result?.data) self.addChapters(result.data);
      self.isLoadingChapter = false;
      self.isLoadedChapter = true;
    }),

    loadStandardSubjectMappings: flow(function* () {
      self.isLoadingMapping = true;
      const result = yield StandardService.getStandardSubjectMappings();
      if (result?.data) self.addStandardSubjectMappings(result.data);
      self.isLoadingMapping = false;
      self.isLoadingMapping = true;
    }),

    createChapter: (standard: string, subject: string) => {
      const chaptersCount = self.getStandardSubjectChapters(standard, subject).length;
      const chapter = Chapter.create({
        _id: getObjectId(),
        name: '',
        isNew: true,
        standard,
        subject,
        order: chaptersCount,
        ...self.rootStore.selectorStore.selectedData,
      });
      self.addChapter(chapter);
      self.rootStore.selectorStore.setSelectedChapterId(chapter._id);
      return chapter;
    },
  }))
  .views((self) => ({
    getStandardsSubjectItems(standardIds: string[]): ISelectItem[] {
      const subjectIds: string[] = [];
      self.getStandardsByIds(standardIds).forEach((standard) => {
        subjectIds.push(...standard.subjects);
      });
      return self
        .getSubjectsByIds([...new Set(subjectIds)])
        .map((subject) => ({ label: subject.name, value: subject._id }));
    },
  }));

export type IStandardStore = Instance<typeof StandardStore>;
