import { Html } from '@components/others';
import { useTestPaperLookups } from '@stores';

export const Instruction = () => {
  const testPaperStore = useTestPaperLookups();
  const { exam } = testPaperStore;
  if (!exam) return null;
  const { maxMarks, durationMins, numberOfQuestions, sections, title } = exam;

  const getInstructions = () => {
    return [
      `There are <b>${numberOfQuestions} questions</b> in the test paper.`,
      `Total duration of the test is <b>${durationMins} minutes</b>.`,
      `Maximum marks is <b>${maxMarks}</b>.`,
      `Number of section(s) <b>${sections.length}</b>.`,
    ];
  };

  return (
    <>
      <div className="w-full">
        <div className="w-full py-4 px-8 md:px-16">
          <div className="flex font-semibold text-sm md:text-base justify-center py-4">{title}</div>
          <div className="py-2">
            <ul className="list-disc">
              {getInstructions().map((instruction: string, index: number) => {
                return (
                  <li key={index}>
                    <Html html={instruction} />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};
