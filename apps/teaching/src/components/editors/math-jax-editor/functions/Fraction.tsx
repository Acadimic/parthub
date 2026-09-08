import { useEffect, useState } from 'react';
import { Actions } from '../';
import { EquationEditor } from '../EquationEditor';
import { type EquationBlock, type FractionNode } from '../types';

interface IProps {
  block: FractionNode;
  handleChange: (block: FractionNode) => void;
  closeModal: () => void;
}

export const Fraction = ({ block, handleChange, closeModal }: IProps) => {
  const [numerator, setNumerator] = useState<EquationBlock[]>(block.numerator);
  const [denominator, setDenominator] = useState<EquationBlock[]>(block.denominator);

  const handleNumeratorChange = (blocks: EquationBlock[]) => {
    setNumerator(blocks);
  };

  const handleDenominatorChange = (blocks: EquationBlock[]) => {
    setDenominator(blocks);
  };

  const handleSubmit = () => {
    handleChange({ ...block, numerator, denominator });
  };

  useEffect(() => {
    if (!block) return;
    setNumerator([...block.numerator]);
    setDenominator([...block.denominator]);
  }, [block]);

  console.log('####numerator: ', numerator);
  console.log('####denominator: ', denominator);
  console.log('####FractionBlock: ', block);

  return (
    <div>
      <div className="flex flex-col gap-2 divide-y-2 divide-color-border py-8">
        <div>
          <EquationEditor blocks={numerator} handleChange={handleNumeratorChange} label="Numerator" autoFocus />
        </div>
        <div>
          <EquationEditor blocks={denominator} handleChange={handleDenominatorChange} label="Denominator" />
        </div>
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
