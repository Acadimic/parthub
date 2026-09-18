import { type DefaultMarkingType } from '@repo/shared/interfaces';
import { Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { Marking, type QuestionType } from '@enums';

import { splitCamelCase } from '@utils/helpers';
import { useEffect, useState } from 'react';

interface IProps {
  isOpen: boolean;
  defaultMarkings: DefaultMarkingType;
  onSave: (markings: DefaultMarkingType) => void;
  isLoading: boolean;
  onClose: () => void;
  isDisabled?: boolean;
}

/** The key an input carries in its `name`, and the key its text is held under. */
const markingKey = (questionType: QuestionType, marking: Marking) => `${questionType}-${marking}`;

/**
 * What the table's inputs hold: text, not numbers.
 *
 * A negative mark passes through "-" on its way to "-1", and a cleared field through "", neither of
 * which is a number. The previous version deleted the key for an unparseable field and refilled it
 * with 0 on close, which made a negative default impossible to type.
 */
type IMarkingInputs = Record<string, string>;

const toMarkingInputs = (markings: DefaultMarkingType): IMarkingInputs => {
  const inputs: IMarkingInputs = {};
  (Object.keys(markings) as QuestionType[]).forEach((questionType) => {
    Object.values(Marking).forEach((marking) => {
      const value = markings[questionType]?.[marking];
      inputs[markingKey(questionType, marking)] = value === undefined ? '' : String(value);
    });
  });
  return inputs;
};

/** The table to save. Every key is written, an unparseable field as 0; none is ever dropped. */
const toDefaultMarkings = (inputs: IMarkingInputs, source: DefaultMarkingType): DefaultMarkingType => {
  const markings = structuredClone(source);
  (Object.keys(markings) as QuestionType[]).forEach((questionType) => {
    Object.values(Marking).forEach((marking) => {
      const parsed = parseFloat(inputs[markingKey(questionType, marking)] ?? '');
      markings[questionType][marking] = Number.isFinite(parsed) ? parsed : 0;
    });
  });
  return markings;
};

const MARKING_COLUMNS = [
  { marking: Marking.CORRECT, label: 'Correct' },
  { marking: Marking.INCORRECT, label: 'Incorrect' },
  { marking: Marking.UNATTEMPTED, label: 'Unattempted' },
];

/** Matches the header row `DataTable` draws, so the two tables read as one component. */
const HEADER_CELL = 'text-left py-2.5 px-4 text-xxs font-semibold uppercase tracking-caps text-muted-foreground';

export const DefaultMarkingsModal = ({ defaultMarkings, onSave, isOpen, isLoading, onClose, isDisabled }: IProps) => {
  const [inputs, setInputs] = useState<IMarkingInputs>(() => toMarkingInputs(defaultMarkings));

  const handleChangeMarkings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((current) => ({ ...current, [name]: value }));
  };

  const closeMarkingsModal = () => {
    onSave(toDefaultMarkings(inputs, defaultMarkings));
    onClose();
  };

  // The modal stays mounted between opens, so it re-seeds whenever the caller hands over a
  // different table rather than only on first mount.
  useEffect(() => {
    setInputs(toMarkingInputs(defaultMarkings));
  }, [defaultMarkings]);

  return (
    <Modal
      title="Modify Default Markings"
      description="Marks a question of each type is worth unless it overrides them."
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={closeMarkingsModal}
      component={
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className={HEADER_CELL}>Type</th>
                {MARKING_COLUMNS.map(({ marking, label }) => (
                  <th key={marking} className={HEADER_CELL}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(defaultMarkings) as QuestionType[]).map((questionType) => (
                <tr key={questionType} className="border-b border-border">
                  <td className="py-2.5 px-4 text-sm capitalize font-medium">{splitCamelCase(questionType)}</td>
                  {MARKING_COLUMNS.map(({ marking, label }) => (
                    <td key={marking} className="py-2.5 px-4">
                      <div className="w-20">
                        <TextInput
                          name={markingKey(questionType, marking)}
                          value={inputs[markingKey(questionType, marking)] ?? ''}
                          type="number"
                          className="text-right font-mono"
                          onChange={handleChangeMarkings}
                          placeholder={label}
                          disabled={isDisabled}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
      footer={
        isDisabled ? null : (
          <ModalFooter
            saveText="Done"
            cancelText="Close"
            onSave={closeMarkingsModal}
            onCancel={closeMarkingsModal}
            isLoading={isLoading}
          />
        )
      }
    />
  );
};
