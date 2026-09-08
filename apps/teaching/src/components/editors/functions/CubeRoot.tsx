import { type IFunctionProps } from '@interfaces';
import SingleInput from './function-models/SingleInput';

const CubeRoot = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const NAME = 'cuberoot';

  const getHTML = (data: string) => {
    const html = `&nbsp;&nbsp;<table cellspacing="0" cellpadding="0"
    style="display:inline-table; margin-left:-3px; vertical-align:middle;">
    <tbody>
        <tr>
            <td style="vertical-align:bottom;">
            <table cellspacing="0" cellpadding="0" style="display:inline-table; vertical-align:middle;">
                <tr>
                    <td style="line-height: 0.5em; padding-bottom: 4px;">
                        <sub>3</sub>
                    </td>
                </tr>
                <tr>
                    <td>
                        <svg width="11" height="16"
                        style="vertical-align: bottom; margin-right: 1px; margin-bottom: -2px; transform: rotate(-15deg);"
                        xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="currentColor">
                            <g>
                            <rect x="-1" y="-1" width="13" height="18" id="canvas_background" fill="none"/>
                            <g id="canvasGrid" display="none">
                            <rect id="svg_4" width="800" height="600" x="1" y="1" stroke-width="0" />
                            </g>
                            </g>
                            <g>
                            <line stroke="currentColor" transform="rotate(60 7.048029899597168,8.118589401245119)"
                            fill="none" stroke-width="1.5" 
                            x1="-1.35349" y1="8.1186" x2="15.44955" y2="8.1186" id="svg_2" stroke-linejoin="undefined" 
                            stroke-linecap="undefined"/>
                            <line stroke="currentColor" transform="rotate(135 2.138079881668091,2.5020008087158208)"
                            fill="none" 
                            stroke-width="1.5" x1="-0.01703" y1="2.50201" x2="4.29319" y2="2.50201" id="svg_3"
                            stroke-linejoin="undefined" 
                            stroke-linecap="undefined"/>
                            </g>
                        </svg>
                    </td>
                </tr>
            </table>
            </td>
            <td style="border-top:2px solid currentColor; border-left:2px solid currentColor; padding-top: 0px;">
                &nbsp;${data}&nbsp;
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

export default CubeRoot;
