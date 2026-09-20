import { type QuestionDto } from '@repo/shared/contracts';
import { PaperType, QuestionType, SectionCategoryType, SectionType } from '@enums';
import { QuestionService, TestPaperService } from '@services';
import { useQuestionStore, useTestPaperStore } from '@stores';
import { type IImportedQuestion } from '@utils/ai/test-paper-generator';
import { defaultMarkings as APP_DEFAULT_MARKINGS } from '@utils/constants';

export interface ICreatePaperOptions {
  /** The id the prompt carried, so the paper is the one the reply names. */
  testPaperId: string;
  name: string;
  standards: string[];
  subjects: string[];
  durationMins: number;
  imported: IImportedQuestion[];
}

/**
 * Creates a paper, its sections and its questions from an import, in that order, and undoes the
 * drafts if any step fails. Shared by the course generator's quizzes; the whole-paper drawer does
 * the same steps inline with its own setup.
 */
export const createPaperFromImport = async ({
  testPaperId,
  name,
  standards,
  subjects,
  durationMins,
  imported,
}: ICreatePaperOptions): Promise<void> => {
  const testPaperStore = useTestPaperStore.getState();
  const questionStore = useQuestionStore.getState();
  const created = { sectionIds: [] as string[], questionIds: [] as string[] };
  const paper = testPaperStore.createTestPaper();
  // The draft gets the prompt's id so the store row and the saved row are one and the same.
  testPaperStore.removeTestPaper(paper._id);
  const withId = { ...paper, _id: testPaperId };
  testPaperStore.addTestPapers([withId]);
  try {
    testPaperStore.patchTestPaper(testPaperId, {
      name,
      standards,
      subjects,
      paperType: PaperType.QUIZ,
      durationMins,
      year: new Date().getFullYear(),
      isNew: false,
    });
    const sectionIdByRef = new Map<string, string>();
    for (const item of imported) {
      if (sectionIdByRef.has(item.section.ref)) continue;
      const section = testPaperStore.createTestPaperSection(
        SectionType.SECTION,
        SectionCategoryType.CUSTOM,
        structuredClone(APP_DEFAULT_MARKINGS),
        item.section.name,
      );
      created.sectionIds.push(section._id);
      sectionIdByRef.set(item.section.ref, section._id);
    }
    testPaperStore.patchTestPaper(testPaperId, { sections: [...sectionIdByRef.values()] });
    const toSave = useTestPaperStore.getState().getTestPaperById(testPaperId) ?? withId;
    await TestPaperService.upsertTestPaper(toSave);
    for (const sectionId of created.sectionIds) {
      const section = useTestPaperStore.getState().getTestPaperSectionById(sectionId);
      if (section) await TestPaperService.upsertTestPaperSection(section);
      testPaperStore.patchTestPaperSection(sectionId, { isNew: false });
    }
    const dtos: QuestionDto[] = imported.map((item) => {
      const sectionId = sectionIdByRef.get(item.section.ref) ?? '';
      const questionType = item.dto.questionType ?? QuestionType.SINGLE_CHOICE;
      const draft = questionStore.createQuestion({
        section: sectionId,
        standard: item.dto.standard ?? standards[0] ?? '',
        subject: item.dto.subject,
        questionType,
        markings: item.dto.markings ?? APP_DEFAULT_MARKINGS[questionType],
      });
      created.questionIds.push(draft._id);
      const { standard: _s, subject: _j, questionType: _t, markings: _m, ...rest } = item.dto;
      return { ...draft, ...rest, section: sectionId };
    });
    const result = await QuestionService.bulkUpsertQuestions(dtos);
    if (result?.data) questionStore.addQuestions(result.data.map((question) => ({ ...question, isNew: false })));
    created.questionIds.forEach((id) => questionStore.patchQuestion(id, { isNew: false }));
    await testPaperStore.reloadTestPaper(testPaperId);
  } catch (error) {
    created.questionIds.forEach((id) => questionStore.removeQuestionById(id));
    created.sectionIds.forEach((id) => testPaperStore.removeTestPaperSection(id));
    testPaperStore.removeTestPaper(testPaperId);
    throw error;
  }
};
