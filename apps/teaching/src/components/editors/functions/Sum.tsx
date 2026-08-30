import { useState } from 'react';

import { Button } from '@components/app';
import { IFunctionProps, IPosition, ITarget } from '@interfaces';
import { HtmlEditor } from '..';
import { Toolbar } from '../Toolbar';

enum DirectionType {
  UP = 'upper',
  DOWN = 'lower',
  DATA = 'data',
}

interface IState {
  [key: string]: string;
}

const Sum = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const [data, setData] = useState<IState>({
    [DirectionType.UP]: '',
    [DirectionType.DOWN]: '',
    [DirectionType.DATA]: '',
  });
  const [position] = useState({ start: 0, end: 0 });

  const setPosition = (newPosition: IPosition) => {
    position.start = newPosition.start;
    position.end = newPosition.end;
  };

  const [focusedElement, setFocusedElement] = useState<string>(DirectionType.DATA);

  const handleContentChange = (event: ITarget) => {
    const dataName = event.target.name;
    const value = event.target.value;
    setData({ ...data, [dataName]: value });
  };

  const getHTML = () => {
    return `<table cellspacing="0" cellpadding="0" border="0"
    style="display:inline-table; border-collapse: collapse; vertical-align: middle;">
    <tbody>
    <tr>
      <td style="vertical-align: bottom;">
        ${data[DirectionType.UP]}
      </td>
      <td rowSpan="3">${data[DirectionType.DATA]}</td>
    </tr>
    <tr>
      <td><span style="font-size: 30px;">&Sigma;</span>&nbsp;</td>
    </tr>
    <tr>
      <td style="vertical-align: top;">
      ${data[DirectionType.DOWN]}
      </td>
    </tr>
    </tbody>
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
      <div>
        <table className="m-0 p-0">
          <tbody>
            <tr>
              <td colSpan={2} className="border-none p-0 m-0">
                <div className="flex">
                  <div className="w-7/12">
                    <HtmlEditor
                      name={DirectionType.UP}
                      html={data[DirectionType.UP]}
                      handleChange={handleContentChange}
                      setParentFocus={setFocus}
                      hideToolbar
                      // setPosition={setPosition}
                      placeholder={`Add ${DirectionType.UP}`}
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border-none p-0 m-0 align-top text-center w-1/4">
                <div className="-mt-2">
                  <h2 className="text-4xl">&Sigma;</h2>
                </div>
              </td>
              <td className="border-none p-0 m-0">
                <div className="flex justify-end">
                  <div className="flex-1">
                    <HtmlEditor
                      name={DirectionType.DATA}
                      html={data[DirectionType.DATA]}
                      handleChange={handleContentChange}
                      setParentFocus={setFocus}
                      hideToolbar
                      // setPosition={setPosition}
                      isAutoFocus
                      placeholder={`Add ${DirectionType.DATA}`}
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border-none p-0 m-0">
                <div className="flex">
                  <div className="w-7/12">
                    <HtmlEditor
                      name={DirectionType.DOWN}
                      html={data[DirectionType.DOWN]}
                      handleChange={handleContentChange}
                      setParentFocus={setFocus}
                      hideToolbar
                      // setPosition={setPosition}
                      placeholder={`Add ${DirectionType.DOWN}`}
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex justify-center">
        <Button text="Add" onClick={handleSubmit} />
      </div>
    </>
  );
};

export default Sum;
