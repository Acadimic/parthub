import { type IRichText } from '@repo/shared/interfaces';
import { type AttachmentDto } from '@repo/shared/contracts';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { CourseItemType, QuestionType, StorageKey } from '../enums';

/**
 * What the learner currently has selected. **Ids and plain values only.**
 *
 * Under MST this store also held sixteen views reaching into other stores
 * (`selectedCourse = courseStore.getCourseById(selectedCourseId)`), which made it the most
 * connected store in the app. Those views now live as composed hooks in the store that owns the
 * entity — `useSelectedCourse` in `course.store`, `useSelectedUser` in `user.store`, and so on —
 * each subscribing to both stores properly.
 *
 * Because of that this module imports no other store's state, so there is no cycle to be careful
 * about. `AttachmentDto` is a type-only import.
 */
export interface ISelectorState {
  selectedOrgId: string;
  selectedUserId: string;
  selectedTestPaperId: string;
  selectedTestPaperSectionId: string;
  selectedQuestionId: string;
  selectedStandardId: string;
  selectedSubjectId: string;
  selectedChapterId: string;
  selectedMaterialId: string;
  selectedCourseId: string;
  selectedCourseModuleId: string;
  selectedStudentId: string;
  selectedCollaboratorId: string;
  selectedBatchId: string;
  selectedQuestionType: QuestionType;
  selectedCourseItem: CourseItemType;
  selectedUpsertQuestionStep: number;
  isCourseMenuOpen: boolean;
  selectedContent: IRichText | null;
  /** The attachment the learner is viewing. Held whole, not by id — it is a subdocument. */
  selectedAttachment: AttachmentDto | null;
  setSelectedOrgId: (value: string) => void;
  setSelectedUserId: (value: string) => void;
  setSelectedTestPaperId: (value: string) => void;
  setSelectedTestPaperSectionId: (value: string) => void;
  setSelectedQuestionId: (value: string) => void;
  setSelectedStandardId: (value: string) => void;
  setSelectedSubjectId: (value: string) => void;
  setSelectedChapterId: (value: string) => void;
  setSelectedMaterialId: (value: string) => void;
  setSelectedCourseId: (value: string) => void;
  setSelectedCourseModuleId: (value: string) => void;
  setSelectedStudentId: (value: string) => void;
  setSelectedCollaboratorId: (value: string) => void;
  setSelectedBatchId: (value: string) => void;
  setSelectedQuestionType: (value: QuestionType) => void;
  setSelectedCourseItem: (value: CourseItemType) => void;
  setSelectedUpsertQuestionStep: (value: number) => void;
  setIsCourseMenuOpen: (value: boolean) => void;
  setSelectedContent: (value: IRichText | null) => void;
  setSelectedAttachment: (value: AttachmentDto | null) => void;
  removeSelectedTestPaperId: () => void;
  removeSelectedTestPaperSectionId: () => void;
  removeSelectedQuestionId: () => void;
  removeSelectedStandardId: () => void;
  removeSelectedSubjectId: () => void;
  removeSelectedChapterId: () => void;
  removeSelectedMaterialId: () => void;
  removeSelectedCourseId: () => void;
  removeSelectedCourseModuleId: () => void;
  removeSelectedStudentId: () => void;
  removeSelectedCollaboratorId: () => void;
  removeSelectedBatchId: () => void;
  removeSelectedContent: () => void;
  removeSelectedAttachment: () => void;
  /** Selects a user and the org they belong to. Takes fields, not a user, so this store stays dependency-free. */
  selectUserAndOrg: (userId: string, org: string) => void;
  reset: () => void;
}

const INITIAL = {
  selectedOrgId: '',
  selectedUserId: '',
  selectedTestPaperId: '',
  selectedTestPaperSectionId: '',
  selectedQuestionId: '',
  selectedStandardId: '',
  selectedSubjectId: '',
  selectedChapterId: '',
  selectedMaterialId: '',
  selectedCourseId: '',
  selectedCourseModuleId: '',
  selectedStudentId: '',
  selectedCollaboratorId: '',
  selectedBatchId: '',
  selectedQuestionType: QuestionType.SINGLE_CHOICE,
  selectedCourseItem: CourseItemType.COURSE_MATERIALS,
  selectedUpsertQuestionStep: 0,
  isCourseMenuOpen: true,
  selectedContent: null,
  selectedAttachment: null,
};

export const useSelectorStore = create<ISelectorState>()((set) => ({
  ...INITIAL,

  setSelectedOrgId: (value) => {
    set({ selectedOrgId: value });
  },
  setSelectedUserId: (value) => {
    set({ selectedUserId: value });
  },
  setSelectedTestPaperId: (value) => {
    set({ selectedTestPaperId: value });
  },
  setSelectedTestPaperSectionId: (value) => {
    set({ selectedTestPaperSectionId: value });
  },
  setSelectedQuestionId: (value) => {
    set({ selectedQuestionId: value });
  },
  setSelectedStandardId: (value) => {
    set({ selectedStandardId: value });
  },
  setSelectedSubjectId: (value) => {
    set({ selectedSubjectId: value });
  },
  setSelectedChapterId: (value) => {
    set({ selectedChapterId: value });
  },
  setSelectedMaterialId: (value) => {
    set({ selectedMaterialId: value });
  },
  setSelectedCourseId: (value) => {
    set({ selectedCourseId: value });
  },
  setSelectedCourseModuleId: (value) => {
    set({ selectedCourseModuleId: value });
  },
  setSelectedStudentId: (value) => {
    set({ selectedStudentId: value });
  },
  setSelectedCollaboratorId: (value) => {
    set({ selectedCollaboratorId: value });
  },
  setSelectedBatchId: (value) => {
    set({ selectedBatchId: value });
  },
  setSelectedQuestionType: (value) => {
    set({ selectedQuestionType: value });
  },
  setSelectedCourseItem: (value) => {
    set({ selectedCourseItem: value });
  },
  setSelectedUpsertQuestionStep: (value) => {
    set({ selectedUpsertQuestionStep: value });
  },
  setIsCourseMenuOpen: (value) => {
    set({ isCourseMenuOpen: value });
  },
  setSelectedContent: (value) => {
    set({ selectedContent: value });
  },
  setSelectedAttachment: (value) => {
    set({ selectedAttachment: value });
  },
  removeSelectedTestPaperId: () => {
    set({ selectedTestPaperId: '' });
  },
  removeSelectedTestPaperSectionId: () => {
    set({ selectedTestPaperSectionId: '' });
  },
  removeSelectedQuestionId: () => {
    set({ selectedQuestionId: '' });
  },
  removeSelectedStandardId: () => {
    set({ selectedStandardId: '' });
  },
  removeSelectedSubjectId: () => {
    set({ selectedSubjectId: '' });
  },
  removeSelectedChapterId: () => {
    set({ selectedChapterId: '' });
  },
  removeSelectedMaterialId: () => {
    set({ selectedMaterialId: '' });
  },
  removeSelectedCourseId: () => {
    set({ selectedCourseId: '' });
  },
  removeSelectedCourseModuleId: () => {
    set({ selectedCourseModuleId: '' });
  },
  removeSelectedStudentId: () => {
    set({ selectedStudentId: '' });
  },
  removeSelectedCollaboratorId: () => {
    set({ selectedCollaboratorId: '' });
  },
  removeSelectedBatchId: () => {
    set({ selectedBatchId: '' });
  },
  removeSelectedContent: () => {
    set({ selectedContent: null });
  },
  removeSelectedAttachment: () => {
    set({ selectedAttachment: null });
  },
  selectUserAndOrg: (userId, org) => {
    set({ selectedUserId: userId, selectedOrgId: org });
    // Only the org is persisted. The permission used to be stored so http.service could send it
    // as a header, which the server never read — a client-declared role would be escalation.
    localStorage.setItem(StorageKey.ORGANIZATION, org);
  },

  reset: () => {
    set(INITIAL);
  },
}));

/**
 * The whole selection, subscribed. Ids are small and change together, so a single shallow-compared
 * subscription is simpler than one hook per id — and this store holds nothing derived.
 */
export const useSelectorLookups = (): ISelectorState => useSelectorStore(useShallow((state) => state));
