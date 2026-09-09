import { type DefaultMarkingType } from '@repo/shared/interfaces';
import { Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { Marking, QuestionType } from '@enums';

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

export const DefaultMarkingsModal = ({ defaultMarkings, onSave, isOpen, isLoading, onClose, isDisabled }: IProps) => {
  const [markings, setMarkings] = useState<DefaultMarkingType>(structuredClone(defaultMarkings));

  const handleChangeMarkings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const keys = name.split('-');
    const questionType = keys[0] as QuestionType;
    const marking = keys[1] as Marking;
    const newMarkings = structuredClone(markings);
    const numberValue = parseFloat(value);
    if (Number.isNaN(numberValue)) delete newMarkings[questionType][marking];
    else newMarkings[questionType][marking] = numberValue;
    setMarkings(newMarkings);
  };

  const closeMarkingsModal = () => {
    const newMarkings = structuredClone(defaultMarkings);
    Object.values(QuestionType).forEach((qType: QuestionType) => {
      Object.values(Marking).forEach((markingType: Marking) => {
        const value = markings[qType][markingType];
        if (!value) newMarkings[qType][markingType] = 0;
        else newMarkings[qType][markingType] = value;
      });
    });
    setMarkings(newMarkings);
    onSave({ ...newMarkings });
    onClose();
  };

  useEffect(() => {
    if (defaultMarkings) setMarkings(structuredClone(defaultMarkings));
  }, []);

  return (
    <>
      <Modal
        title="Modify Default Markings"
        isOpen={isOpen}
        isLoading={isLoading}
        onClose={closeMarkingsModal}
        component={
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-color-border">
                  <th className="text-left py-3 px-4 font-medium text-color-secondary">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-color-secondary">Correct</th>
                  <th className="text-left py-3 px-4 font-medium text-color-secondary">Incorrect</th>
                  <th className="text-left py-3 px-4 font-medium text-color-secondary">Unattempted</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(markings) as QuestionType[]).map((queType: QuestionType) => {
                  const marks = markings[queType];
                  return (
                    <tr key={queType} className="border-b border-color-border">
                      <td className="py-3 px-4 text-sm capitalize font-medium">{splitCamelCase(queType)}</td>
                      <td className="py-3 px-4">
                        <div className="w-28">
                          <TextInput
                            name={`${queType}-${Marking.CORRECT}`}
                            value={marks.correct ?? ''}
                            type="number"
                            onChange={handleChangeMarkings}
                            placeholder={Marking.CORRECT}
                            disabled={isDisabled}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-28">
                          <TextInput
                            name={`${queType}-${Marking.INCORRECT}`}
                            value={marks.incorrect ?? ''}
                            type="number"
                            onChange={handleChangeMarkings}
                            placeholder={Marking.INCORRECT}
                            disabled={isDisabled}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-28">
                          <TextInput
                            name={`${queType}-${Marking.UNATTEMPTED}`}
                            value={marks.unattempted ?? ''}
                            type="number"
                            onChange={handleChangeMarkings}
                            placeholder={Marking.UNATTEMPTED}
                            disabled={isDisabled}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
    </>
  );
};
