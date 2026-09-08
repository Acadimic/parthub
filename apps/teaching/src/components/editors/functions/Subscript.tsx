import { type IFunctionProps } from '@interfaces';
import SingleInput from './function-models/SingleInput';

const Subscript = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const NAME = 'subscript';

  const getHTML = (data: string) => {
    const bottom = data && data.startsWith('<') ? 'bottom: -0.7em;' : '';
    const align = data && data.startsWith('<') ? 'vertical-align: bottom;' : '';
    const html = `<sub style="${align} position: relative; ${bottom}">${data}</sub>&nbsp;`;
    return html;
  };

  return (
    <>
      <SingleInput
        contentName={NAME}
        name={name}
        getHTML={getHTML}
        handleChange={handleChange}
        closeModal={closeModal}
        isAutoFocus
      />
    </>
  );
};

export default Subscript;
