import { type IFullCalendarEvent } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { CalendarType, QuestionType, StorageKey } from '../enums';

/**
 * What the user currently has selected. **Ids and plain values only.**
 *
 * Under MST this store also held seventeen views that reached into other stores
 * (`selectedBatch = batchStore.getBatchById(selectedBatchId)`), which is what made it the most
 * connected store in the app and what forced the migration ordering. Those views now live as
 * composed hooks in the store that owns the entity — `useSelectedBatch` in `batch.store`,
 * `useSelectedUser` in `user.store`, and so on — each subscribing to both stores properly.
 *
 * Because of that this module imports no other store, so there is no cycle to be careful about.
 */
export interface ISelectorState {
  selectedOrgId: string;
  selectedUserId: string;
  selectedTestPaperId: string;
  selectedTestPaperSectionId: string;
  selectedQuestionId: string;
  selectedUpsertQuestionStep: number;
  selectedStandardId: string;
  selectedSubjectId: string;
  selectedChapterId: string;
  selectedMaterialId: string;
  selectedCourseId: string;
  selectedCourseModuleId: string;
  selectedStudentId: string;
  selectedCollaboratorId: string;
  selectedBatchId: string;
  selectedMeetId: string;
  selectedCalenderDate: number;
  selectedQuestionType: QuestionType;
  selectedCalenderType: CalendarType;
  selectedCalenderEvent: IFullCalendarEvent | null;
  setSelectedOrgId: (value: string) => void;
  setSelectedUserId: (value: string) => void;
  setSelectedTestPaperId: (value: string) => void;
  setSelectedTestPaperSectionId: (value: string) => void;
  setSelectedQuestionId: (value: string) => void;
  setSelectedUpsertQuestionStep: (value: number) => void;
  setSelectedStandardId: (value: string) => void;
  setSelectedSubjectId: (value: string) => void;
  setSelectedChapterId: (value: string) => void;
  setSelectedMaterialId: (value: string) => void;
  setSelectedCourseId: (value: string) => void;
  setSelectedCourseModuleId: (value: string) => void;
  setSelectedStudentId: (value: string) => void;
  setSelectedCollaboratorId: (value: string) => void;
  setSelectedBatchId: (value: string) => void;
  setSelectedMeetId: (value: string) => void;
  setSelectedCalenderDate: (value: number) => void;
  setSelectedQuestionType: (value: QuestionType) => void;
  setSelectedCalenderType: (value: CalendarType) => void;
  setSelectedCalenderEvent: (value: IFullCalendarEvent) => void;
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
  removeSelectedMeetId: () => void;
  removeSelectedCalenderDate: () => void;
  removeSelectedCalenderType: () => void;
  removeSelectedCalenderEvent: () => void;
  /** Selects a user and the org they lead. Takes fields, not a user, so this store stays dependency-free. */
  selectUserAndOrg: (userId: string, org: string) => void;
  reset: () => void;
}

const INITIAL = {
  selectedOrgId: '',
  selectedUserId: '',
  selectedTestPaperId: '',
  selectedTestPaperSectionId: '',
  selectedQuestionId: '',
  selectedUpsertQuestionStep: 0,
  selectedStandardId: '',
  selectedSubjectId: '',
  selectedChapterId: '',
  selectedMaterialId: '',
  selectedCourseId: '',
  selectedCourseModuleId: '',
  selectedStudentId: '',
  selectedCollaboratorId: '',
  selectedBatchId: '',
  selectedMeetId: '',
  selectedCalenderDate: Date.now(),
  selectedQuestionType: QuestionType.SINGLE_CHOICE,
  selectedCalenderType: CalendarType.DAY,
  selectedCalenderEvent: null,
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
  setSelectedUpsertQuestionStep: (value) => {
    set({ selectedUpsertQuestionStep: value });
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
  setSelectedMeetId: (value) => {
    set({ selectedMeetId: value });
  },
  setSelectedCalenderDate: (value) => {
    set({ selectedCalenderDate: value });
  },
  setSelectedQuestionType: (value) => {
    set({ selectedQuestionType: value });
  },
  setSelectedCalenderType: (value) => {
    set({ selectedCalenderType: value });
  },
  setSelectedCalenderEvent: (value) => {
    set({ selectedCalenderEvent: value });
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
  removeSelectedMeetId: () => {
    set({ selectedMeetId: '' });
  },
  removeSelectedCalenderDate: () => {
    set({ selectedCalenderDate: Date.now() });
  },
  removeSelectedCalenderType: () => {
    set({ selectedCalenderType: CalendarType.DAY });
  },
  removeSelectedCalenderEvent: () => {
    set({ selectedCalenderEvent: null });
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
