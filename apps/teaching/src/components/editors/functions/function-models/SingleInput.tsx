import { HtmlEditor } from '@components/editors';
import { type ITarget } from '@interfaces';
import { useState } from 'react';
import { Toolbar } from '../../Toolbar';
import { FunctionFooter } from '../components';

interface IState {
  [key: string]: string;
}

interface IProps {
  handleChange: (target: ITarget) => void;
  name: string;
  closeModal: () => void;
  getHTML: (data: string) => string;
  contentName: string;
  content?: string;
  isAutoFocus?: boolean;
}

const SingleInput = (props: IProps) => {
  const { content, handleChange, name, closeModal, getHTML, contentName, isAutoFocus } = props;
  const NAME = `${name}-${contentName}`;
  const [data, setData] = useState<IState>({
    [NAME]: content || '',
  });

  const handleContentChange = (event: ITarget) => {
    const dataName = event.target.name;
    const value = event.target.value;
    setData({ ...data, [dataName]: value });
  };

  const handleSubmit = () => {
    const value = getHTML(data[NAME]);
    handleChange({ target: { name, value } });
    closeModal();
  };

  const getData = (event: ITarget) => {
    const elName = event.target.name;
    const value = event.target.value;
    setData({ ...data, [elName]: value });
  };

  return (
    <>
      <Toolbar name={NAME} handleChange={getData} />
      <HtmlEditor
        name={NAME}
        html={data[NAME]}
        handleChange={handleContentChange}
        hideToolbar
        // setPosition={setPosition}
        isAutoFocus={isAutoFocus}
        placeholder={`Add ${contentName}`}
      />
      <FunctionFooter onSave={handleSubmit} onCancel={closeModal} />
    </>
  );
};

export default SingleInput;
