import { HtmlEditor } from '@components/editors';
import { Toolbar } from '@components/editors/Toolbar';
import { IPosition, ITarget } from '@interfaces';
import { useEffect, useState } from 'react';
import { FunctionFooter } from '../components';

interface IState {
  [key: string]: string;
}

interface IProps {
  handleChange: (target: ITarget) => void;
  name: string;
  closeModal: () => void;
  row: number;
  column: number;
  getHTML: (data: object) => string;
}

const RowColEntry = (props: IProps) => {
  const { handleChange, name, closeModal, row, column, getHTML } = props;
  const [data, setData] = useState<IState>({});
  const [focusedElement, setFocusedElement] = useState('');
  const [position] = useState({ start: 0, end: 0 });

  const setPosition = (newPosition: IPosition) => {
    position.start = newPosition.start;
    position.end = newPosition.end;
  };

  const initialize = () => {
    const newData: any = {};
    for (let i = 1; i <= row; i += 1) {
      for (let j = 1; j <= column; j += 1) {
        const key = `${name}-${i}-${j}`;
        newData[key] = data[key] || '';
      }
    }
    setData(newData);
    if (!focusedElement) setFocusedElement('11');
  };

  const handleContentChange = (event: ITarget) => {
    const dataName = event.target.name;
    const value = event.target.value;
    setData((preData) => {
      const newData = { ...preData };
      newData[dataName] = value || '';
      return newData;
    });
  };

  const handleSubmit = () => {
    const value = getHTML(data);
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

  useEffect(() => {
    if (row && column) initialize();
  }, [row, column]);

  return (
    <>
      {row && column ? (
        <>
          <Toolbar name={focusedElement} handleChange={getData} />
          <table className="w-full">
            <tbody>
              {new Array(row).fill(null).map((rnv, rIndex) => {
                return (
                  <tr key={rIndex}>
                    {new Array(column).fill(null).map((cnv, cIndex) => {
                      const key = `${name}-${rIndex + 1}-${cIndex + 1}`;
                      return (
                        <td style={{ width: `${100 / column}%` }} key={key}>
                          <HtmlEditor
                            name={key}
                            html={data[key]}
                            handleChange={handleContentChange}
                            setParentFocus={setFocus}
                            hideToolbar
                            // setPosition={setPosition}
                            placeholder={`Add ${rIndex + 1},${cIndex + 1}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <FunctionFooter onSave={handleSubmit} onCancel={closeModal} />
        </>
      ) : null}
    </>
  );
};

export default RowColEntry;
