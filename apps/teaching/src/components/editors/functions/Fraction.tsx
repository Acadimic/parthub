import { useState } from 'react';

import { IPosition, ITarget } from '@interfaces';
import { HtmlEditor } from '..';
import { Toolbar } from '../Toolbar';
import { FunctionFooter } from './components';

enum FRACTION {
  NUMERATOR = 'numerator',
  DENOMINATOR = 'denominator',
}

interface IProps {
  handleChange: (target: ITarget) => void;
  name: string;
  closeModal: () => void;
  numerator?: string;
  denominator?: string;
  isAutoFocus?: boolean;
}

interface IState {
  [key: string]: string;
}

const Fraction = (props: IProps) => {
  const { numerator, denominator, handleChange, name, closeModal } = props;
  const [data, setData] = useState<IState>({
    [`${name}-${FRACTION.NUMERATOR}`]: numerator || '',
    [`${name}-${FRACTION.DENOMINATOR}`]: denominator || '',
  });

  const [focusedElement, setFocusedElement] = useState<string>(FRACTION.NUMERATOR);
  const [position] = useState({ start: 0, end: 0 });

  const setPosition = (newPosition: IPosition) => {
    position.start = newPosition.start;
    position.end = newPosition.end;
  };

  const handleContentChange = (event: ITarget) => {
    const dataName = event.target.name;
    const value = event.target.value;
    setData({ ...data, [dataName]: value });
  };

  const getHTML = (): string => {
    return `<table style="display:inline-table; border-collapse:collapse; vertical-align:middle">
    <tr>
      <td style="border-bottom: solid 1px; text-align:center; line-height: 1.3;">
        ${data[`${name}-${FRACTION.NUMERATOR}`]}
      </td>
    </tr>
    <tr>
      <td style="text-align:center; line-height: 1.3;">
        ${data[`${name}-${FRACTION.DENOMINATOR}`]}
      </td>
    </tr>
    </table>&nbsp;`;
  };

  const handleSubmit = () => {
    const value = getHTML();
    handleChange({ target: { name, value } });
    closeModal();
  };

  const setFocus = (elementName: string) => {
    setFocusedElement(elementName);
  };

  const getData = (event: ITarget) => {
    const elName = event.target.name;
    const value = event.target.value;
    setData({ ...data, [elName]: value });
  };

  return (
    <>
      <Toolbar name={focusedElement} handleChange={getData} />
      <div className="mt-6">
        <HtmlEditor
          name={`${name}-${FRACTION.NUMERATOR}`}
          html={data[`${name}-${FRACTION.NUMERATOR}`]}
          handleChange={handleContentChange}
          setParentFocus={setFocus}
          hideToolbar
          // setPosition={setPosition}
          placeholder={`Add ${FRACTION.NUMERATOR}`}
        />
        <div className="py-4">
          <hr className="border border-color-border" />
        </div>
        <HtmlEditor
          name={`${name}-${FRACTION.DENOMINATOR}`}
          html={data[`${name}-${FRACTION.DENOMINATOR}`]}
          handleChange={handleContentChange}
          setParentFocus={setFocus}
          hideToolbar
          // setPosition={setPosition}
          placeholder={`Add ${FRACTION.DENOMINATOR}`}
        />
      </div>
      <FunctionFooter onSave={handleSubmit} onCancel={closeModal} />
    </>
  );
};

export default Fraction;
