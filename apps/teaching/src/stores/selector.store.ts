import { IFullCalendarEvent } from '@interfaces';
import { Instance, getRoot, types as t } from 'mobx-state-tree';
import { CalenderType, Permission, QuestionType, StorageKey } from '../enums';
import {
  IBaseOrgOwnerModel,
  IBaseTimestampModel,
  IBatch,
  IChapter,
  ICourse,
  ICourseModule,
  IMaterial,
  IMeet,
  IOrg,
  IPlan,
  IQuestion,
  ISolution,
  IStandard,
  ISubject,
  ITestPaper,
  ITestPaperSection,
  IUser,
} from './models';
import { IStore } from './root.store';

export const SelectorStore = t
  .model({
    selectedOrgId: t.optional(t.string, ''),
    selectedUserId: t.optional(t.string, ''),
    selectedPermission: t.optional(t.enumeration('Permission', Object.values(Permission)), Permission.ADMIN),
    selectedTestPaperId: t.optional(t.string, ''),
    selectedTestPaperSectionId: t.optional(t.string, ''),
    selectedQuestionId: t.optional(t.string, ''),
    selectedQuestionType: t.optional(
      t.enumeration('QuestionType', Object.values(QuestionType)),
      QuestionType.SINGLE_CHOICE,
    ),
    selectedUpsertQuestionStep: t.optional(t.number, 0),
    selectedStandardId: t.optional(t.string, ''),
    selectedSubjectId: t.optional(t.string, ''),
    selectedChapterId: t.optional(t.string, ''),
    selectedMaterialId: t.optional(t.string, ''),
    selectedCourseId: t.optional(t.string, ''),
    selectedCourseModuleId: t.optional(t.string, ''),
    selectedStudentId: t.optional(t.string, ''),
    selectedCollaboratorId: t.optional(t.string, ''),
    selectedBatchId: t.optional(t.string, ''),
    selectedMeetId: t.optional(t.string, ''),
    selectedCalenderDate: t.optional(t.number, Date.now()),
    selectedCalenderType: t.optional(t.enumeration('CalenderType', Object.values(CalenderType)), CalenderType.DAY),
    selectedCalenderEvent: t.maybeNull(t.frozen<IFullCalendarEvent>()),
    selectedSolutionId: t.optional(t.string, ''),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
  .actions((self) => ({
    selectUserAndOrgLeader: (user: IUser) => {
      if (!user) return;
      self.selectedUserId = user._id;
      self.selectedOrgId = user.org;
      self.selectedPermission = user.permission;
      localStorage.setItem(StorageKey.PERMISSION, user.permission);
      localStorage.setItem(StorageKey.ORGANIZATION, user.org);
    },

    setSelectedTestPaperId: (testPaperId: string) => {
      self.selectedTestPaperId = testPaperId;
    },

    setSelectedTestPaperSectionId: (testPaperSectionId: string) => {
      self.selectedTestPaperSectionId = testPaperSectionId;
    },

    setSelectedQuestionId: (questionId: string) => {
      self.selectedQuestionId = questionId;
    },

    setSelectedQuestionType: (questionType: QuestionType) => {
      self.selectedQuestionType = questionType;
    },

    setSelectedUpsertQuestionStep: (step: number) => {
      self.selectedUpsertQuestionStep = step;
    },

    setSelectedStandardId: (standardId: string) => {
      self.selectedStandardId = standardId;
    },

    setSelectedSubjectId: (subjectId: string) => {
      self.selectedSubjectId = subjectId;
    },

    setSelectedChapterId: (chapterId: string) => {
      self.selectedChapterId = chapterId;
    },

    setSelectedMaterialId: (materialId: string) => {
      self.selectedMaterialId = materialId;
    },

    setSelectedCourseId: (courseId: string) => {
      self.selectedCourseId = courseId;
    },

    setSelectedCourseModuleId: (courseModuleId: string) => {
      self.selectedCourseModuleId = courseModuleId;
    },

    setSelectedStudentId: (studentId: string) => {
      self.selectedStudentId = studentId;
    },

    setSelectedCollaboratorId: (teacherId: string) => {
      self.selectedCollaboratorId = teacherId;
    },

    setSelectedBatchId: (batchId: string) => {
      self.selectedBatchId = batchId;
    },

    setSelectedMeetId: (meetId: string) => {
      self.selectedMeetId = meetId;
    },

    setSelectedCalenderDate: (date: number) => {
      self.selectedCalenderDate = date;
    },

    setSelectedCalenderType: (calenderType: CalenderType) => {
      self.selectedCalenderType = calenderType;
    },

    setSelectedCalenderEvent: (event: IFullCalendarEvent) => {
      self.selectedCalenderEvent = event;
    },

    setSelectedSolutionId: (solutionId: string) => {
      self.selectedSolutionId = solutionId;
    },

    removeSelectedTestPaperId: () => {
      self.selectedTestPaperId = '';
    },

    removeSelectedTestPaperSectionId: () => {
      self.selectedTestPaperSectionId = '';
    },

    removeSelectedQuestionId: () => {
      self.selectedQuestionId = '';
    },

    removeSelectedStandardId: () => {
      self.selectedStandardId = '';
    },

    removeSelectedSubjectId: () => {
      self.selectedSubjectId = '';
    },

    removeSelectedChapterId: () => {
      self.selectedChapterId = '';
    },

    removeSelectedMaterialId: () => {
      self.selectedMaterialId = '';
    },

    removeSelectedCourseId: () => {
      self.selectedCourseId = '';
    },

    removeSelectedCourseModuleId: () => {
      self.selectedCourseModuleId = '';
    },

    removeSelectedStudentId: () => {
      self.selectedStudentId = '';
    },

    removeSelectedCollaboratorId: () => {
      self.selectedCollaboratorId = '';
    },

    removeSelectedBatchId: () => {
      self.selectedBatchId = '';
    },

    removeSelectedMeetId: () => {
      self.selectedMeetId = '';
    },

    removeSelectedCalenderDate: () => {
      self.selectedCalenderDate = Date.now();
    },

    removeSelectedCalenderType: () => {
      self.selectedCalenderType = CalenderType.DAY;
    },

    removeSelectedCalenderEvent: () => {
      self.selectedCalenderEvent = null;
    },

    removeSelectedSolutionId: () => {
      self.selectedSolutionId = '';
    },
  }))
  .views((self) => ({
    get selectedData(): IBaseOrgOwnerModel & IBaseTimestampModel {
      return {
        org: self.rootStore.selectorStore.selectedOrgId,
        createdBy: self.rootStore.selectorStore.selectedUserId,
        updatedBy: self.rootStore.selectorStore.selectedUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      };
    },

    get selectedOrg(): IOrg | undefined {
      return self.rootStore.userStore.getOrgById(self.selectedOrgId);
    },

    get selectedUser(): IUser | undefined {
      return self.rootStore.userStore.getUserById(self.selectedUserId);
    },

    get selectedTestPaper(): ITestPaper | undefined {
      return self.rootStore.testPaperStore.getTestPaperById(self.selectedTestPaperId);
    },

    get selectedTestPaperSection(): ITestPaperSection | undefined {
      return self.rootStore.testPaperStore.getTestPaperSectionById(self.selectedTestPaperSectionId);
    },

    get selectedQuestion(): IQuestion | undefined {
      return self.rootStore.questionStore.getQuestionById(self.selectedQuestionId);
    },

    get selectedStandard(): IStandard | undefined {
      return self.rootStore.standardStore.getStandardById(self.selectedStandardId);
    },

    get selectedSubject(): ISubject | undefined {
      return self.rootStore.standardStore.getSubjectById(self.selectedSubjectId);
    },

    get selectedChapter(): IChapter | undefined {
      return self.rootStore.standardStore.getChapterById(self.selectedChapterId);
    },

    get selectedMaterial(): IMaterial | undefined {
      return self.rootStore.materialStore.getMaterialById(self.selectedMaterialId);
    },

    get selectedCourse(): ICourse | undefined {
      return self.rootStore.courseStore.getCourseById(self.selectedCourseId);
    },

    get selectedCoursePlans(): IPlan[] {
      return self.rootStore.courseStore.plansByCourseId(self.selectedCourseId);
    },

    get selectedCourseModule(): ICourseModule | undefined {
      return self.rootStore.courseStore.getCourseModuleById(self.selectedCourseModuleId);
    },

    get selectedStudent(): IUser | undefined {
      return self.rootStore.userStore.getUserById(self.selectedStudentId);
    },

    get selectedCollaborator(): IUser | undefined {
      return self.rootStore.userStore.getUserById(self.selectedCollaboratorId);
    },

    get selectedBatch(): IBatch | undefined {
      return self.rootStore.batchStore.getBatchById(self.selectedBatchId);
    },

    get selectedMeet(): IMeet | undefined {
      return self.rootStore.meetStore.getMeetById(self.selectedMeetId);
    },

    get selectedSolution(): ISolution | undefined {
      return self.rootStore.questionStore.getSolutionById(self.selectedSolutionId);
    },
  }));

export type ISelectorStore = Instance<typeof SelectorStore>;
