import { IFunctionProps } from '@interfaces';
import SingleInput from './function-models/SingleInput';

const UnitVector = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const NAME = 'unit-vector';

  const getHTML = (data: string) => {
    const html = `<table cellspacing="0" cellpadding="0"
    style="display: inline-table; vertical-align: middle;" >
        <tbody>
          <tr>
            <td style="line-height: 1; text-align: center; font-weight: bold;">
              &#8743;
            </td>
          </tr>
          <tr>
            <td style="line-height: 2; text-align: center; vertical-align: top;">
              <span style="line-height: 1; vertical-align: top;">&nbsp;${data}&nbsp;</span>
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

export default UnitVector;
