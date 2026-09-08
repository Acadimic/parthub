import { type IFunctionProps } from '@interfaces';
import SingleInput from './function-models/SingleInput';

const Superscript = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const NAME = 'superscript';

  const getHTML = (data: string) => {
    const top = data && data.startsWith('<') ? 'top: -0.8em;' : '';
    const align = data && data.startsWith('<') ? 'vertical-align: top;' : '';
    const html = `<sup style="${align} position: relative; ${top}">${data}</sup>&nbsp;`;
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

export default Superscript;
