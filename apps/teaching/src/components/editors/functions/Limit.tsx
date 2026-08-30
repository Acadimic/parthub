import React, { useState } from 'react';

import { Button } from '@components/app';
import { IFunctionProps, IPosition, ITarget } from '@interfaces';
import { HtmlEditor } from '..';
import { Toolbar } from '../Toolbar';

enum DirectionType {
  LEFT = 'left',
  RIGHT = 'right',
  DATA = 'data',
}

interface IState {
  [key: string]: string;
}

const Limit = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const [data, setData] = useState<IState>({
    [`${name}-${DirectionType.LEFT}`]: '',
    [`${name}-${DirectionType.RIGHT}`]: '',
    [`${name}-${DirectionType.DATA}`]: '',
  });
  const [focusedElement, setFocusedElement] = React.useState<string>(DirectionType.DATA);
  const [position] = React.useState({ start: 0, end: 0 });

  const setPosition = (newPosition: IPosition) => {
    position.start = newPosition.start;
    position.end = newPosition.end;
  };

  const handleContentChange = (event: ITarget) => {
    const dataName = event.target.name;
    const value = event.target.value;
    setData({ ...data, [dataName]: value });
  };

  const getHTML = () => {
    return `<table style="display: inline-table; border-collapse: collapse; vertical-align: middle;">
    <tr>
          <td>&nbsp;</td>
        </tr>
    <tr>
          <td style="line-height: 1.0;"><i>lim</i> &nbsp;&nbsp; ${data[`${name}-${DirectionType.DATA}`]}</td>
        </tr>
    <tr>
      <td style="vertical-align: top;">
     <i>${data[`${name}-${DirectionType.LEFT}`] || 'x'}</i><span>&nbsp;&#8594;&nbsp;</span><i>${data[`${name}-${DirectionType.RIGHT}`] || '0'}</i>
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
      <div>
        <table className="m-0 p-0">
          <tbody>
            <tr>
              <td className="border-none p-0 m-0 align-top text-center w-1/4">
                <div className="mt-2.5">
                  <h5 className="text-xl font-semibold">
                    <i>lim</i>
                  </h5>
                </div>
              </td>
              <td className="border-none p-0 m-0">
                <div className="flex justify-end">
                  <div className="flex-1">
                    <HtmlEditor
                      name={`${name}-${DirectionType.DATA}`}
                      html={data[`${name}-${DirectionType.DATA}`]}
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
                <div className="flex justify-center">
                  <div className="w-5/12">
                    <HtmlEditor
                      name={`${name}-${DirectionType.LEFT}`}
                      html={data[`${name}-${DirectionType.LEFT}`]}
                      handleChange={handleContentChange}
                      setParentFocus={setFocus}
                      hideToolbar
                      // setPosition={setPosition}
                      placeholder="x"
                    />
                  </div>
                  <div className="w-2/12 flex justify-center items-center text-xl h-[50px]">&nbsp; &#8594; &nbsp;</div>
                  <div className="w-5/12">
                    <HtmlEditor
                      name={`${name}-${DirectionType.RIGHT}`}
                      html={data[`${name}-${DirectionType.RIGHT}`]}
                      handleChange={handleContentChange}
                      setParentFocus={setFocus}
                      hideToolbar
                      // setPosition={setPosition}
                      placeholder="0"
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

export default Limit;
