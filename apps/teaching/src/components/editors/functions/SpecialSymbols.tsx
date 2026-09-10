import { Tooltip } from '@repo/ui/app';
import { type IFunctionProps } from '@interfaces';
import { SYMBOLS } from '@utils/constants';

const Symbols = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;

  const handleSubmit = (value: string) => {
    handleChange({ target: { name, value } });
    closeModal();
  };

  return (
    <>
      {SYMBOLS.map((item) => {
        return (
          <Tooltip title={item.name} key={item.code}>
            <button
              type="button"
              onClick={() => {
                handleSubmit(item.code);
              }}
              className="p-1 rounded hover:bg-accent"
              style={{ fontFamily: '"Times New Roman", Courier, Garamond, serif' }}
            >
              <span dangerouslySetInnerHTML={{ __html: item.code }} />
            </button>
          </Tooltip>
        );
      })}
    </>
  );
};

export default Symbols;
