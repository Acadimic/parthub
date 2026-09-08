import { type IFunctionProps } from '@interfaces';
import SingleInput from './function-models/SingleInput';

const Vector = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const NAME = 'vector';

  const getHTML = (data: string) => {
    const html = `
    <table cellspacing="0" cellpadding="0" style="display:inline-table; vertical-align: middle;">
    <tbody>
    <tr>
    <td style="text-align:right; vertical-align: top;">
      <div style="line-height: 0.5; vertical-align: top; border-bottom: 2px black solid;">
      <svg xmlns="http://www.w3.org/2000/svg" style="margin-bottom: -6px; margin-right: -6px;"
      width="10" height="10" viewBox="0 0 24 24">
        <path d="M22 12l-20 12 5-12-5-12z"/>
      </svg>
      </div>
    </td>
    </tr>
    <tr>
    <td style="line-height: 2; text-align: center; padding: 0;">
      <span style="line-height: 1.3; vertical-align: top;">&nbsp;${data}&nbsp;</span>
    </td>
    </tr>
    </tbody>
    </table>&nbsp;`;
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

export default Vector;
