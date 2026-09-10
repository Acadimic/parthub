import { Modal, Popover } from '@repo/ui/app';
import {
  ArrowLineRightIcon,
  ArrowRightIcon,
  ArrowsOutLineVerticalIcon,
  BracketsSquareIcon,
  CaretDownIcon,
  CaretLineUpIcon,
  CubeIcon,
  DivideIcon,
  DotsNineIcon,
  FadersHorizontalIcon,
  FunctionIcon,
  PencilLineIcon,
  PiIcon,
  RadicalIcon,
  RowsIcon,
  RulerIcon,
  SigmaIcon,
  SquaresFourIcon,
  TableIcon,
  TextSubscriptIcon,
  TextSuperscriptIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import { FunctionType } from '@enums';
import { type ISelectItem, type ITarget } from '@interfaces';
import { useMemo, useState, type JSX } from 'react';
import Brackets from '../Brackets';
import ChemicalEquation from '../ChemicalEquation';
import CubeRoot from '../CubeRoot';
import Determinant from '../Determinant';
import SVG from '../Draw';
import Fraction from '../Fraction';
import Integration from '../Integration';
import Limit from '../Limit';
import Metrics from '../Metrics';
import Overline from '../Overline';
import SpecialSymbols from '../SpecialSymbols';
import SquareRoot from '../SquareRoot';
import Subscript from '../Subscript';
import Sum from '../Sum';
import Superscript from '../Superscript';
import Table from '../Table';
import TransparentTable from '../TransparentTable';
import UnitVector from '../UnitVector';
import UploadImage from '../UploadImage';
import Vector from '../Vector';

interface IFunctionGroup {
  group: string;
  items: {
    icon: React.ReactNode;
    label: FunctionType;
    component: () => JSX.Element;
  }[];
}

const ShowFunction = (props: { name: string; handleChange: (target: ITarget) => void }) => {
  const { name, handleChange } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<FunctionType | null>(null);

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
    // document.getElementById(name)?.click();
    // document.getElementById(name)?.focus();
  };

  const FUNCTIONS: IFunctionGroup[] = useMemo(
    () => [
      {
        group: 'Text Formatting',
        items: [
          {
            icon: <TextSuperscriptIcon className="w-4 h-4" />,
            label: FunctionType.SUPERSCRIPT,
            component: () => <Superscript name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <TextSubscriptIcon className="w-4 h-4" />,
            label: FunctionType.SUBSCRIPT,
            component: () => <Subscript name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <CaretLineUpIcon className="w-4 h-4" />,
            label: FunctionType.OVERLINE,
            component: () => <Overline name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
        ],
      },
      {
        group: 'Basic Math',
        items: [
          {
            icon: <DivideIcon className="w-4 h-4" />,
            label: FunctionType.FRACTION,
            component: () => <Fraction name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <RadicalIcon className="w-4 h-4" />,
            label: FunctionType.SQUARE_ROOT,
            component: () => <SquareRoot name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <CubeIcon className="w-4 h-4" />,
            label: FunctionType.CUBE_ROOT,
            component: () => <CubeRoot name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
        ],
      },
      {
        group: 'Advanced Math',
        items: [
          {
            icon: <ArrowRightIcon className="w-4 h-4" />,
            label: FunctionType.LIMIT,
            component: () => <Limit name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <FunctionIcon className="w-4 h-4" />,
            label: FunctionType.INTEGRATION,
            component: () => <Integration name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <SigmaIcon className="w-4 h-4" />,
            label: FunctionType.SUM,
            component: () => <Sum name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <SquaresFourIcon className="w-4 h-4" />,
            label: FunctionType.DETERMINANT,
            component: () => <Determinant name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <RulerIcon className="w-4 h-4" />,
            label: FunctionType.METRICS,
            component: () => <Metrics name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <ArrowsOutLineVerticalIcon className="w-4 h-4" />,
            label: FunctionType.UNIT_VECTOR,
            component: () => <UnitVector name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <ArrowLineRightIcon className="w-4 h-4" />,
            label: FunctionType.VECTOR,
            component: () => <Vector name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
        ],
      },
      {
        group: 'Special',
        items: [
          {
            icon: <PiIcon className="w-4 h-4" />,
            label: FunctionType.SYMBOLS,
            component: () => <SpecialSymbols name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <BracketsSquareIcon className="w-4 h-4" />,
            label: FunctionType.BRACKETS,
            component: () => <Brackets name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <PencilLineIcon className="w-4 h-4" />,
            label: FunctionType.DRAW_IMAGE,
            component: () => <SVG name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <UploadSimpleIcon className="w-4 h-4" />,
            label: FunctionType.UPLOAD_IMAGE,
            component: () => <UploadImage name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
        ],
      },
      {
        group: 'Tables & Layout',
        items: [
          {
            icon: <TableIcon className="w-4 h-4" />,
            label: FunctionType.TABLE,
            component: () => <Table name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
          {
            icon: <RowsIcon className="w-4 h-4" />,
            label: FunctionType.TRANSPARENT_TABLE,
            component: () => <TransparentTable name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
        ],
      },
      {
        group: 'Chemistry',
        items: [
          {
            icon: <FadersHorizontalIcon className="w-4 h-4" />,
            label: FunctionType.CHEMICAL_EQUATION,
            component: () => <ChemicalEquation name={name} closeModal={closeModal} handleChange={handleChange} />,
          },
        ],
      },
    ],
    [name, handleChange],
  );

  const handleSelect = (items: ISelectItem[]) => {
    if (items[0]) {
      setSelected(items[0].value as FunctionType);
      setOpen(true);
    }
  };

  // Convert grouped functions to Select items format with icons
  const groupedItems = FUNCTIONS.map((group) => ({
    group: group.group,
    items: group.items.map((item) => ({
      label: item.label,
      value: item.label,
      icon: item.icon,
    })),
  }));

  return (
    <div className="flex justify-center mb-0">
      <div className="">
        <Popover
          component={({ handleClose }) => (
            <div className="bg-background">
              <div className="max-w-[460px] max-h-[500px] overflow-y-auto p-4">
                {groupedItems.map((groupedItem) => (
                  <div key={groupedItem.group} className="mb-8">
                    <div className="font-medium text-base mb-4 pb-2 border-b border-border flex items-center gap-2">
                      <DotsNineIcon weight="bold" className="w-4 h-4 text-info" /> {groupedItem.group}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {groupedItem.items.map((item) => (
                        <div
                          key={item.value}
                          onMouseDown={() => {
                            handleSelect([item]);
                            handleClose?.();
                          }}
                          className="flex w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] flex-col items-center p-4 hover:bg-card cursor-pointer rounded-lg border border-border transition-colors duration-200"
                        >
                          <div className="w-12 h-12 flex items-center justify-center mb-2 rounded-full bg-card">
                            {item.icon}
                          </div>
                          <span className="text-center font-medium">{item.label}</span>
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
            <FunctionIcon weight="bold" className="w-5 h-5" />
            <CaretDownIcon className="w-4 h-4" />
          </div>
        </Popover>
        {selected && (
          <Modal
            isOpen={open}
            onClose={closeModal}
            title={selected}
            component={
              FUNCTIONS.flatMap((g) => g.items)
                .find((item) => item.label === selected)
                ?.component() ?? <div />
            }
          />
        )}
      </div>
    </div>
  );
};

export default ShowFunction;
