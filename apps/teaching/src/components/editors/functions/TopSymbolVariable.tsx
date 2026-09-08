import { type IFunctionProps } from '@interfaces';
import SingleInput from './function-models/SingleInput';

const UnitVector = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const NAME = 'unitvector';

  const getHTML = (data: string) => {
    const html = `
      <table style="display:inline-table; vertical-align: bottom;" >
        <tbody>
          <tr>
            <td style="line-height: 0.5; text-align: center; font-weight: bold;">
              &#8743;
            </td>
          </tr>
          <tr>
            <td style="line-height: 1; text-align: center;">
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

export default UnitVector;
