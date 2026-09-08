import { Tooltip } from '@parthhub/ui/app';
import { Html } from '@components/others';
import { IFunctionProps } from '@interfaces';
import {
  LeftBracket,
  LeftCurlyBracket,
  LeftSquareBracket,
  RightBracket,
  RightCurlyBracket,
  RightSquareBracket,
  VerticalLine,
} from './DymaicBrackets';

const BRACKETS = [
  {
    name: 'Vertical Line 2 Rows',
    code: VerticalLine(2),
  },
  {
    name: 'Vertical Line 3 Rows',
    code: VerticalLine(3),
  },
  {
    name: 'Left Bracket 2 Rows',
    code: LeftBracket(2),
  },
  {
    name: 'Right Bracket 2 Rows',
    code: RightBracket(2),
  },
  {
    name: 'Left Bracket 3 Rows',
    code: LeftBracket(3),
  },
  {
    name: 'Right Bracket 3 Rows',
    code: RightBracket(3),
  },
  {
    name: 'Left Curly Bracket 2 Rows',
    code: LeftCurlyBracket(2),
  },
  {
    name: 'Right Curly Bracket 2 Rows',
    code: RightCurlyBracket(2),
  },
  {
    name: 'Left Curly Bracket 3 Rows',
    code: LeftCurlyBracket(3),
  },
  {
    name: 'Right Curly Bracket 3 Rows',
    code: RightCurlyBracket(3),
  },
  {
    name: 'Left Square Bracket 2 Rows',
    code: LeftSquareBracket(2),
  },
  {
    name: 'Right Square Bracket 2 Rows',
    code: RightSquareBracket(2),
  },
  {
    name: 'Left Square Bracket 3 Rows',
    code: LeftSquareBracket(3),
  },
  {
    name: 'Right Square Bracket 3 Rows',
    code: RightSquareBracket(3),
  },
];

const Brackets = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;

  const handleSubmit = (value: string) => {
    handleChange({ target: { name, value } });
    closeModal();
  };

  return (
    <div className="flex items-center flex-wrap">
      {BRACKETS.map((item) => {
        return (
          <Tooltip title={item.name} key={item.name}>
            <button
              type="button"
              onClick={() => handleSubmit(item.code)}
              className="p-1 rounded hover:bg-background-secondary"
            >
              <Html html={item.code} />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default Brackets;
