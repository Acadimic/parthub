import { IFunctionProps } from '@interfaces';
import SingleInput from './function-models/SingleInput';

const Overline = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const NAME = 'overline';

  const getHTML = (data: string) => {
    const html = `
      <table style="display:inline-table; vertical-align: middle; padding:0px;" >
        <tbody>
          <tr>
            <td style="text-align: center; border-top: 1px solid currentColor; padding-bottom: 4px;">
              ${data}
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
      />
    </>
  );
};

export default Overline;
