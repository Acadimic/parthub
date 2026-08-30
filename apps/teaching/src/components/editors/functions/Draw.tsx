import React from 'react';
import { useSvgDrawing } from 'react-hooks-svgdrawing';

import { Button } from '@components/app';
import { Checkbox } from '@components/core';
import { IFunctionProps } from '@interfaces';

import { MAX_HEIGHTS, OPTIONS } from '@utils/constants';

export const Resize = (props: { setMaxHeight: (height: number) => void }) => {
  const { setMaxHeight } = props;
  const [checked, setChecked] = React.useState<boolean[]>([]);

  const handleCheckbox = (index: number) => {
    const newChecked: boolean[] = [];
    newChecked[index] = true;
    setMaxHeight(MAX_HEIGHTS[index]);
    setChecked(newChecked);
  };

  React.useEffect(() => {
    setChecked([false, true, false]);
    setMaxHeight(MAX_HEIGHTS[1]);
  }, []);

  return (
    <div className="flex justify-between my-4">
      {OPTIONS.map((option, index) => {
        return (
          <Checkbox
            key={option}
            checked={checked[index] || false}
            onChange={() => handleCheckbox(index)}
            label={option}
          />
        );
      })}
    </div>
  );
};

function Draw(props: IFunctionProps) {
  const { name, handleChange, closeModal } = props;
  const [maxHeight, setMaxHeight] = React.useState(250);
  const [renderRef, draw] = useSvgDrawing({
    penWidth: 2, // pen width
    penColor: 'currentColor', // pen color
    close: false, // Use close command for path. Default is false.
    curve: true, // Use curve command for path. Default is true.
    delay: 10, // Set how many ms to draw points every.
    // fill: '#fff', // Set fill attribute for path. default is `none`
  });

  const print = () => {
    const svgHtml = draw.getSvgXML();
    const value = `&nbsp;<table cellspacing="0" cellpadding="0" border="0"
        style="display: inline-table; border-collapse: collapse; vertical-align: middle;">
          <tbody>
            <tr>
              <td>${svgHtml}</td>
            </tr>
          </tbody>
        </table>&nbsp;`;
    handleChange({ target: { name, value } });
    closeModal();
  };

  const undo = () => {
    draw.undo();
  };

  // Drawing area will be resized to fit the rendering area
  return (
    <>
      <div className="flex justify-center">
        <div
          className="border border-color-border mb-4 sm:w-[310px]"
          ref={renderRef}
          style={{ height: maxHeight, width: maxHeight }}
        />
      </div>
      <Resize setMaxHeight={setMaxHeight} />
      <div className="flex justify-evenly">
        <Button onClick={undo} text="Undo" />
        <Button onClick={print} text="Add" />
      </div>
    </>
  );
}

export default Draw;
