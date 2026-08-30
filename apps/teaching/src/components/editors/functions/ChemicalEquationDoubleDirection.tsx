import React from 'react';

import { Button } from '@components/app';
import { DirectionType } from '@enums';
import { IFunctionProps, IPosition, ITarget } from '@interfaces';
import { HtmlEditor } from '..';
import { Toolbar } from '../Toolbar';

const ChemicalEquationDoubleDirection = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const [data, setData] = React.useState<any>({
    [`${name}-${DirectionType.UP}`]: '',
    [`${name}-${DirectionType.DOWN}`]: '',
    [`${name}-${DirectionType.LEFT}`]: '',
    [`${name}-${DirectionType.RIGHT}`]: '',
  });
  const [position] = React.useState({ start: 0, end: 0 });

  const setPosition = (newPosition: IPosition) => {
    position.start = newPosition.start;
    position.end = newPosition.end;
  };

  const [focusedElement, setFocusedElement] = React.useState<string>(DirectionType.LEFT);

  const handleContentChange = (event: ITarget) => {
    const dataName = event.target.name;
    const value = event.target.value;
    setData((preData: any) => {
      const newData = { ...preData };
      newData[dataName] = value;
      return newData;
    });
  };

  const handleSubmit = () => {
    const value = `<table cellspacing="0" cellpadding="0"
    style="display:inline-table; border-collapse:collapse; vertical-align:middle;">
    <tbody>
    <tr >
    <td rowspan="2" style="padding-right: 5px; padding-top: 5px;">${data[DirectionType.LEFT]}</td>
          <td style="padding: 5px;text-align: right; border-bottom: 2px solid;">
          <div style="text-align: center;">${data[DirectionType.UP]}</div>
          <div style="line-height: 0;">
<svg xmlns="http://www.w3.org/2000/svg" style="margin-bottom: -12px; margin-right: -12px;"
width="12" height="12" viewBox="0 0 24 24">
  <path d="M22 12l-20 12 5-12-5-12z"/>
</svg>
</div>
          </td>
          <td rowspan="2" style="padding-left: 5px; padding-top: 5px;">
          &nbsp;${data[DirectionType.RIGHT]}
        </td>
          </tr>

<tr>
<td style="padding: 5px; text-align: center;">
<span style="text-align: center; vertical-align: bottom;">${data[DirectionType.DOWN]}</span></td>
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

  return (
    <>
      <Toolbar name={focusedElement} handleChange={getData} />
      <div>
        <table className="m-0 p-0">
          <tbody>
            <tr>
              <td
                rowSpan={2}
                className="border-none p-0 m-0 align-bottom"
                style={{ paddingRight: 5, paddingBottom: 56 }}
              >
                <div className="flex">
                  <div>
                    <HtmlEditor
                      name={`${name}-${DirectionType.LEFT}`}
                      html={data[`${name}-${DirectionType.LEFT}`]}
                      handleChange={handleContentChange}
                      setParentFocus={setFocus}
                      hideToolbar
                      // setPosition={setPosition}
                      placeholder={`Add ${DirectionType.LEFT}`}
                    />
                  </div>
                </div>
              </td>
              <td className="border-none p-0 m-0 align-bottom text-right">
                <div style={{ padding: '5px', borderBottom: '2px solid' }}>
                  <div className="text-center">
                    <HtmlEditor
                      name={`${name}-${DirectionType.UP}`}
                      html={data[`${name}-${DirectionType.UP}`]}
                      handleChange={handleContentChange}
                      setParentFocus={setFocus}
                      hideToolbar
                      // setPosition={setPosition}
                      placeholder={`Add ${DirectionType.UP}`}
                    />
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginBottom: -16, marginRight: -12 }}
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12l-20 12 5-12-5-12z" />
                  </svg>
                </div>
              </td>
              <td
                rowSpan={2}
                className="border-none p-0 m-0 align-bottom"
                style={{ paddingLeft: 10, paddingBottom: 56 }}
              >
                <div className="flex">
                  <div>
                    <HtmlEditor
                      name={`${name}-${DirectionType.RIGHT}`}
                      html={data[`${name}-${DirectionType.RIGHT}`]}
                      handleChange={handleContentChange}
                      setParentFocus={setFocus}
                      hideToolbar
                      // setPosition={setPosition}
                      placeholder={`Add ${DirectionType.RIGHT}`}
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border-none p-0 m-0 align-bottom text-center" style={{ padding: '5px', paddingTop: 24 }}>
                <div className="flex justify-end">
                  <div>
                    <HtmlEditor
                      name={`${name}-${DirectionType.DOWN}`}
                      html={data[`${name}-${DirectionType.DOWN}`]}
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
        <Button onClick={handleSubmit}>Add</Button>
      </div>
    </>
  );
};

export default ChemicalEquationDoubleDirection;
