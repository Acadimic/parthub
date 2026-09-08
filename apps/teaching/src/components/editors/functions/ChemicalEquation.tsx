import React from 'react';

import { DirectionType } from '@enums';
import { type IFunctionProps, type IPosition, type ITarget, type IEditorCellMap } from '@interfaces';
import { HtmlEditor } from '..';
import { Toolbar } from '../Toolbar';
import { FunctionFooter } from './components';

const ChemicalEquation = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const [data, setData] = React.useState<IEditorCellMap>({
    [`${name}-${DirectionType.UP}`]: '',
    [`${name}-${DirectionType.DOWN}`]: '',
    [`${name}-${DirectionType.LEFT}`]: '',
    [`${name}-${DirectionType.RIGHT}`]: '',
  });

  const [focusedElement, setFocusedElement] = React.useState<string>(DirectionType.LEFT);
  const [position] = React.useState({ start: 0, end: 0 });

  const setPosition = (newPosition: IPosition) => {
    position.start = newPosition.start;
    position.end = newPosition.end;
  };

  const handleContentChange = (event: ITarget) => {
    const dataName = event.target.name;
    const value = event.target.value;
    setData((preData) => {
      const newData = { ...preData };
      newData[dataName] = value;
      return newData;
    });
  };

  const handleSubmit = () => {
    const value = `<table cellspacing="0" cellpadding="0"
    style="display:inline-table; border-collapse:collapse; vertical-align:middle;">
    <tbody>
    <tr>
      <td rowspan="2" style="">&nbsp;&nbsp;${data[DirectionType.LEFT]}&nbsp;</td>
      <td style="text-align: right; position: relative; padding:1px 10px;
        border-bottom: 2px solid; vertical-align: bottom;">
        <div style="text-align: center;">&nbsp;${data[DirectionType.UP]}&nbsp;&nbsp;</div>
        <div style="line-height: 0; text-align: right; position:absolute; right:-3px; bottom:-6px;">
          <svg xmlns="http://www.w3.org/2000/svg" style="color:inherit;"
            width="11" height="11" viewBox="0 0 24 24">
            <path d="M22 12l-20 12 5-12-5-12z"/>
          </svg>
        </div>
      </td>
      <td rowspan="2" style="">&nbsp;&nbsp;${data[DirectionType.RIGHT]}&nbsp;</td>
    </tr>
    <tr>
      <td style="text-align: center; line-height:1.3; vertical-align: top;">
        <span style="text-align: center; padding:0 10px">&nbsp;${data[DirectionType.DOWN]}&nbsp;&nbsp;</span>
      </td>
    </tr>
    </tbody>
    </table>&nbsp;`;
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

  const cellStyle = 'w-[33.33%] py-0';

  return (
    <>
      <Toolbar name={focusedElement} handleChange={getData} />
      <table className="w-full">
        <tbody>
          <tr>
            <td className={cellStyle} />
            <td className={cellStyle}>
              <HtmlEditor
                name={`${name}-${DirectionType.UP}`}
                html={data[`${name}-${DirectionType.UP}`]}
                handleChange={handleContentChange}
                setParentFocus={setFocus}
                hideToolbar
                // setPosition={setPosition}
                // showTopCommands
                placeholder={`Add ${DirectionType.UP}`}
              />
            </td>
            <td className={cellStyle} />
          </tr>
          <tr>
            <td className={cellStyle}>
              <HtmlEditor
                name={`${name}-${DirectionType.LEFT}`}
                html={data[`${name}-${DirectionType.LEFT}`]}
                handleChange={handleContentChange}
                setParentFocus={setFocus}
                hideToolbar
                // setPosition={setPosition}
                placeholder={`Add ${DirectionType.LEFT}`}
              />
            </td>
            <td className={`${cellStyle} h-8`}>
              <div className="relative">
                <hr className="border border-color-text" />
                <div className="absolute -top-1 -right-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24">
                    <path d="M22 12l-20 12 5-12-5-12z" />
                  </svg>
                </div>
              </div>
            </td>
            <td className={`${cellStyle} h-8`}>
              <HtmlEditor
                name={`${name}-${DirectionType.RIGHT}`}
                html={data[`${name}-${DirectionType.RIGHT}`]}
                handleChange={handleContentChange}
                setParentFocus={setFocus}
                hideToolbar
                // setPosition={setPosition}
                placeholder={`Add ${DirectionType.RIGHT}`}
              />
            </td>
          </tr>
          <tr>
            <td className={cellStyle} />
            <td className={cellStyle}>
              <HtmlEditor
                name={`${name}-${DirectionType.DOWN}`}
                html={data[`${name}-${DirectionType.DOWN}`]}
                handleChange={handleContentChange}
                setParentFocus={setFocus}
                hideToolbar
                // setPosition={setPosition}
                placeholder={`Add ${DirectionType.DOWN}`}
              />
            </td>
            <td className={cellStyle} />
          </tr>
        </tbody>
      </table>
      <FunctionFooter onSave={handleSubmit} onCancel={closeModal} />
    </>
  );
};

export default ChemicalEquation;
