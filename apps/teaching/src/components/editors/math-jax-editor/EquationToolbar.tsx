import { Modal, Popover } from '@repo/ui/app';
import {
  CaretDownIcon,
  DotsNineIcon,
  FunctionIcon,
  NumberCircleOneIcon,
  PiIcon,
  PlusMinusIcon,
  TextSubscriptIcon,
  TextSuperscriptIcon,
  TextTIcon,
  VectorTwoIcon,
} from '@phosphor-icons/react';
import { RenderEquation } from '@components/others';
import { PositionType } from '@enums';
import { capitalize } from '@utils/helpers';
import { useEffect, useState, type JSX } from 'react';
import {
  Determinant,
  Fraction,
  Integral,
  Limit,
  Matrix,
  Root,
  Subscript,
  Superscript,
  Symbol,
  Table,
} from './functions';
import { type EquationBlock, EquationType } from './types';
import { getEquationInitialContent } from './util';

const EquationIconMap: Record<EquationType, React.ReactNode> = {
  [EquationType.TEXT]: <TextTIcon weight="bold" className="w-4 h-4" />,
  [EquationType.FRACTION]: <div className="font-medium">A / B</div>,
  [EquationType.SUPERSCRIPT]: <TextSuperscriptIcon weight="bold" className="w-4 h-4" />,
  [EquationType.SUBSCRIPT]: <TextSubscriptIcon weight="bold" className="w-4 h-4" />,
  [EquationType.MATRIX]: (
    <div className="text-xs">
      <RenderEquation equation="\begin{bmatrix} a & b \\ c & d \end{bmatrix}" />
    </div>
  ),
  [EquationType.DETERMINANT]: (
    <div className="text-xs">
      <RenderEquation equation="\begin{vmatrix} a & b \\ c & d \end{vmatrix}" />
    </div>
  ),
  [EquationType.TABLE]: (
    <div className="text-xs">
      <RenderEquation equation="\begin{array}{|c|c|} \hline a & b \\ \hline c & d \\ \hline \end{array}" />
    </div>
  ),
  [EquationType.ROOT]: (
    <div className="">
      <RenderEquation equation="\sqrt[]{x}" />
    </div>
  ),
  [EquationType.CUBE_ROOT]: (
    <div className="">
      <RenderEquation equation="\sqrt[3]{x}" />
    </div>
  ),
  [EquationType.SUM]: <PlusMinusIcon weight="bold" className="w-4 h-4" />,
  [EquationType.PRODUCT]: <NumberCircleOneIcon weight="bold" className="w-4 h-4" />,
  [EquationType.INTEGRAL]: <FunctionIcon weight="bold" className="w-4 h-4" />,
  [EquationType.LIMIT]: (
    <div className="text-xs">
      <RenderEquation equation="\lim_{x \to \infty} f(x)" />
    </div>
  ),
  [EquationType.LOG]: <FunctionIcon weight="bold" className="w-4 h-4" />,
  [EquationType.EXP]: <FunctionIcon weight="bold" className="w-4 h-4" />,
  [EquationType.SIN]: <FunctionIcon weight="bold" className="w-4 h-4" />,
  [EquationType.COS]: <FunctionIcon weight="bold" className="w-4 h-4" />,
  [EquationType.TAN]: <FunctionIcon weight="bold" className="w-4 h-4" />,
  [EquationType.COT]: <FunctionIcon weight="bold" className="w-4 h-4" />,
  [EquationType.SEC]: <FunctionIcon weight="bold" className="w-4 h-4" />,
  [EquationType.CSC]: <FunctionIcon weight="bold" className="w-4 h-4" />,
  [EquationType.VECTOR]: <VectorTwoIcon weight="bold" className="w-4 h-4" />,
  [EquationType.UNIT_VECTOR]: <VectorTwoIcon weight="bold" className="w-4 h-4 scale-75" />,
  [EquationType.SYMBOL]: <PiIcon weight="bold" className="w-4 h-4" />,
};

interface IToolbarItemComponentProps {
  block: EquationBlock;
  handleChange: (block: EquationBlock) => void;
  closeModal: () => void;
}

interface IEquationToolbarGroup {
  group: string;
  items: {
    name: EquationType;
    icon: React.ReactNode;
    component: (data: IToolbarItemComponentProps) => JSX.Element;
  }[];
}

interface IProps {
  block?: EquationBlock;
  handleChange: (block: EquationBlock) => void;
  onClose: () => void;
}

const groupedEquationToolbarItems: IEquationToolbarGroup[] = [
  {
    group: 'Basic',
    items: [
      {
        name: EquationType.FRACTION,
        icon: EquationIconMap[EquationType.FRACTION],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.FRACTION ? (
            <Fraction block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
      },
      {
        name: EquationType.SUPERSCRIPT,
        icon: EquationIconMap[EquationType.SUPERSCRIPT],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.SUPERSCRIPT ? (
            <Superscript block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
      },
      {
        name: EquationType.SUBSCRIPT,
        icon: EquationIconMap[EquationType.SUBSCRIPT],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.SUBSCRIPT ? (
            <Subscript block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
      },
      {
        name: EquationType.ROOT,
        icon: EquationIconMap[EquationType.ROOT],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.ROOT ? (
            <Root block={block} handleChange={handleChange} closeModal={closeModal} initialIndex="2" />
          ) : (
            <></>
          ),
      },
      {
        name: EquationType.CUBE_ROOT,
        icon: EquationIconMap[EquationType.CUBE_ROOT],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.ROOT ? (
            <Root block={block} handleChange={handleChange} closeModal={closeModal} initialIndex="3" />
          ) : (
            <></>
          ),
      },
      {
        name: EquationType.SYMBOL,
        icon: EquationIconMap[EquationType.SYMBOL],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.SYMBOL ? (
            <Symbol block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
      },
    ],
  },
  {
    group: 'Advanced',
    items: [
      {
        name: EquationType.MATRIX,
        icon: EquationIconMap[EquationType.MATRIX],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.MATRIX ? (
            <Matrix block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
      },
      {
        name: EquationType.DETERMINANT,
        icon: EquationIconMap[EquationType.DETERMINANT],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.DETERMINANT ? (
            <Determinant block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
      },
      // {
      //   name: EquationType.SUM,
      //   icon: EquationIconMap[EquationType.SUM],
      // },
      // {
      //   name: EquationType.INTEGRAL,
      //   icon: EquationIconMap[EquationType.INTEGRAL],
      // },
      {
        name: EquationType.LIMIT,
        icon: EquationIconMap[EquationType.LIMIT],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.LIMIT ? (
            <Limit block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
      },
      {
        name: EquationType.INTEGRAL,
        icon: EquationIconMap[EquationType.INTEGRAL],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.INTEGRAL ? (
            <Integral block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
      },
      {
        name: EquationType.TABLE,
        icon: EquationIconMap[EquationType.TABLE],
        component: ({ block, handleChange, closeModal }: IToolbarItemComponentProps) =>
          block.type === EquationType.TABLE ? (
            <Table block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
      },
      // {
      //   name: EquationType.LOG,
      //   icon: EquationIconMap[EquationType.LOG],
      // },
    ],
  },
  // {
  //   group: 'Trigonometric',
  //   items: [
  //     {
  //       name: EquationType.SIN,
  //       icon: EquationIconMap[EquationType.SIN],
  //     },
  //     {
  //       name: EquationType.COS,
  //       icon: EquationIconMap[EquationType.COS],
  //     },
  //     {
  //       name: EquationType.TAN,
  //       icon: EquationIconMap[EquationType.TAN],
  //     },
  //     {
  //       name: EquationType.COT,
  //       icon: EquationIconMap[EquationType.COT],
  //     },
  //     {
  //       name: EquationType.SEC,
  //       icon: EquationIconMap[EquationType.SEC],
  //     },
  //     {
  //       name: EquationType.CSC,
  //       icon: EquationIconMap[EquationType.CSC],
  //     },
  //   ],
  // },
  // {
  //   group: 'Vector',
  //   items: [
  //     {
  //       name: EquationType.VECTOR,
  //       icon: EquationIconMap[EquationType.VECTOR],
  //     },
  //     {
  //       name: EquationType.UNIT_VECTOR,
  //       icon: EquationIconMap[EquationType.UNIT_VECTOR],
  //     },
  //   ],
  // },
];

export const EquationToolbar = ({ handleChange, block, onClose }: IProps) => {
  const [selectedBlock, setSelectedBlock] = useState<EquationBlock | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSelect = (name: EquationType) => {
    if (name === EquationType.TEXT) return;
    setSelectedBlock(getEquationInitialContent(name));
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    onClose();
  };

  useEffect(() => {
    if (block && block.type !== EquationType.TEXT) {
      setSelectedBlock({ ...block });
      setIsOpen(true);
    }
  }, [block]);

  return (
    <div className="text-sm opacity-90">
      <div className="flex gap-2 items-center bg-background-paper w-full border border-color-border">
        <div className="flex items-center truncate divide-x divide-color-border h-6 py-0.5">
          {[
            EquationType.FRACTION,
            EquationType.SUPERSCRIPT,
            EquationType.SUBSCRIPT,
            EquationType.SYMBOL,
            EquationType.ROOT,
          ].map((item) => (
            <div
              className="text-sm cursor-pointer px-3 py-1 hover:text-blue-primary h-full flex items-center"
              onClick={() => {
                // event.stopPropagation();
                handleSelect(item);
              }}
              key={item}
            >
              {EquationIconMap[item]}
            </div>
          ))}
        </div>
        <Popover
          component={({ handleClose }) => (
            <div className="bg-background-primary">
              <div className="min-w-[460px] max-h-[500px] overflow-y-auto p-4">
                {groupedEquationToolbarItems.map((groupedItem) => (
                  <div key={groupedItem.group} className="mb-8">
                    <div className="font-medium text-base mb-4 pb-2 border-b border-color-border flex items-center gap-2">
                      <DotsNineIcon weight="bold" className="w-4 h-4 text-blue-primary" /> {groupedItem.group}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {groupedItem.items.map((item) => (
                        <div
                          key={item.name}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            // event.stopPropagation();
                            handleSelect(item.name);
                            handleClose?.();
                          }}
                          className="hover:text-blue-primary flex w-[calc(33.33%-8px)] md:w-[calc(25%-12px)] flex-col items-center p-4 hover:bg-background-paper cursor-pointer rounded border border-color-border transition-colors duration-200"
                        >
                          <div className="text-sm border border-dotted border-color-border p-2 h-16 w-16 flex items-center justify-center mb-2 rounded bg-background-paper">
                            {item.icon}
                          </div>
                          <span className="text-center text-sm font-medium capitalize text-inherit hover:text-inherit">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        >
          <div className="flex items-center gap-2 px-0 py-1.5 rounded hover:bg-background-hover cursor-pointer">
            <FunctionIcon weight="bold" className="w-4 h-4" />
            <CaretDownIcon className="w-4 h-4" />
          </div>
        </Popover>
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={(selectedBlock && capitalize(selectedBlock?.type)) || ''}
        position={PositionType.TOP}
        component={
          (selectedBlock &&
            groupedEquationToolbarItems
              .flatMap((g) => g.items)
              .find((item) => item.name === selectedBlock.type)
              ?.component({ block: selectedBlock, handleChange, closeModal })) ?? <div />
        }
      />
    </div>
  );
};
