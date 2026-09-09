import { Modal, Tooltip } from '@repo/ui/app';
import { PositionType } from '@enums';
import { capitalize } from '@utils/helpers';
import { useEffect, useState, type JSX } from 'react';
import { AddCode, AddContent, AddEquation, AddHeading, AddImage, AddLink, AddList } from './toolbar-items';
import { type Block, EditorContentType } from './types';
import { EditorContentIconMap, getEditorInitialContent } from './util';

interface IToolbarItemComponentProps {
  block: Block;
  handleChange: (block: Block) => void;
  closeModal: () => void;
}

interface IEditorToolbarGroup {
  group: string;
  items: {
    name: EditorContentType;
    icon: React.ReactNode;
    component: (props: IToolbarItemComponentProps) => JSX.Element;
    tooltip: string;
  }[];
}

interface IProps {
  block?: Block;
  handleChange: (block: Block) => void;
  onClose: () => void;
  isVertical?: boolean;
}

const groupedEditorToolbarItems: IEditorToolbarGroup[] = [
  // {
  //   group: 'history',
  //   items: [
  //     {
  //       name: EditorContentType.UNDO,
  //       icon: EditorContentIconMap[EditorContentType.UNDO],
  //       component: () => <></>,
  //       tooltip: 'Undo',
  //     },
  //     {
  //       name: EditorContentType.REDO,
  //       icon: EditorContentIconMap[EditorContentType.REDO],
  //       component: () => <></>,
  //       tooltip: 'Redo',
  //     },
  //   ],
  // },
  {
    group: 'text',
    items: [
      // {
      //   name: EditorContentType.TEXT,
      //   icon: EditorContentIconMap[EditorContentType.TEXT],
      //   component: () => <></>,
      //   tooltip: 'Text',
      // },
      {
        name: EditorContentType.BOLD,
        icon: EditorContentIconMap[EditorContentType.BOLD],
        component: () => <></>,
        tooltip: 'Bold',
      },
      {
        name: EditorContentType.ITALIC,
        icon: EditorContentIconMap[EditorContentType.ITALIC],
        component: () => <></>,
        tooltip: 'Italic',
      },
      {
        name: EditorContentType.UNDERLINE,
        icon: EditorContentIconMap[EditorContentType.UNDERLINE],
        component: () => <></>,
        tooltip: 'Underline',
      },
    ],
  },
  {
    group: 'write',
    items: [
      {
        name: EditorContentType.CONTENT,
        icon: EditorContentIconMap[EditorContentType.CONTENT],
        component: ({ block, handleChange, closeModal }) =>
          block.type === EditorContentType.CONTENT ? (
            <AddContent block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
        tooltip: 'Text',
      },
      {
        name: EditorContentType.HEADING,
        icon: EditorContentIconMap[EditorContentType.HEADING],
        component: ({ block, handleChange, closeModal }) =>
          block.type === EditorContentType.HEADING ? (
            <AddHeading block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
        tooltip: 'Heading',
      },
      {
        name: EditorContentType.CODE,
        icon: EditorContentIconMap[EditorContentType.CODE],
        component: ({ block, handleChange, closeModal }) =>
          block.type === EditorContentType.CODE ? (
            <AddCode block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
        tooltip: 'Code',
      },
    ],
  },
  {
    group: 'lists',
    items: [
      {
        name: EditorContentType.LIST,
        icon: EditorContentIconMap[EditorContentType.LIST],
        component: ({ block, handleChange, closeModal }) =>
          block.type === EditorContentType.LIST ? (
            <AddList isOrdered={false} block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
        tooltip: 'Bullet List',
      },
      {
        name: EditorContentType.ORDERED_LIST,
        icon: EditorContentIconMap[EditorContentType.ORDERED_LIST],
        component: ({ block, handleChange, closeModal }) =>
          block.type === EditorContentType.ORDERED_LIST ? (
            <AddList isOrdered={true} block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
        tooltip: 'Numbered List',
      },
    ],
  },
  // {
  //   group: 'align',
  //   items: [
  //     {
  //       name: EditorContentType.TEXT,
  //       icon: EditorContentIconMap[EditorContentType.ALIGN_LEFT],
  //       component: () => <></>,
  //       tooltip: 'Align Left',
  //     },
  //     {
  //       name: EditorContentType.TEXT,
  //       icon: EditorContentIconMap[EditorContentType.ALIGN_CENTER],
  //       component: () => <></>,
  //       tooltip: 'Align Center',
  //     },
  //     {
  //       name: EditorContentType.TEXT,
  //       icon: EditorContentIconMap[EditorContentType.ALIGN_RIGHT],
  //       component: () => <></>,
  //       tooltip: 'Align Right',
  //     },
  //   ],
  // },
  {
    group: 'insert',
    items: [
      {
        name: EditorContentType.IMAGE,
        icon: EditorContentIconMap[EditorContentType.IMAGE],
        component: ({ block, handleChange, closeModal }) =>
          block.type === EditorContentType.IMAGE ? (
            <AddImage block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
        tooltip: 'Insert Image',
      },
      {
        name: EditorContentType.LINK,
        icon: EditorContentIconMap[EditorContentType.LINK],
        component: ({ block, handleChange, closeModal }) =>
          block.type === EditorContentType.LINK ? (
            <AddLink block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
        tooltip: 'Insert Link',
      },
    ],
  },
  {
    group: 'equation',
    items: [
      {
        name: EditorContentType.EQUATION,
        icon: EditorContentIconMap[EditorContentType.EQUATION],
        component: ({ block, handleChange, closeModal }) =>
          block.type === EditorContentType.EQUATION ? (
            <AddEquation block={block} handleChange={handleChange} closeModal={closeModal} />
          ) : (
            <></>
          ),
        tooltip: 'Add Equation',
      },
    ],
  },
];

export const EditorToolbar = ({ handleChange, block, onClose, isVertical }: IProps) => {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSelect = (name: EditorContentType) => {
    if (name === EditorContentType.TEXT) return;
    if (name === EditorContentType.BOLD) {
      if (block?.type === EditorContentType.TEXT) {
        handleChange({ ...block, bold: !block.bold });
      }
      return;
    }
    if (name === EditorContentType.ITALIC) {
      if (block?.type === EditorContentType.TEXT) {
        handleChange({ ...block, italic: !block.italic });
      }
      return;
    }
    if (name === EditorContentType.UNDERLINE) {
      if (block?.type === EditorContentType.TEXT) {
        handleChange({ ...block, underline: !block.underline });
      }
      return;
    }
    setSelectedBlock(getEditorInitialContent(name));
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    onClose();
  };

  useEffect(() => {
    if (block && block.type !== EditorContentType.TEXT) {
      setSelectedBlock({ ...block });
      setIsOpen(true);
    }
  }, [block]);

  // console.log('####selectedBlock: ', selectedBlock);

  return (
    <div
      className={`opacity-90 flex items-center gap-2 bg-background-paper border border-color-border flex-wrap ${isVertical ? 'flex-col' : ''}`}
    >
      <div className={`flex items-center overflow-auto ${isVertical ? 'flex-col' : ''}`}>
        {groupedEditorToolbarItems.map((groupedItem, groupIndex) => {
          return (
            <div key={groupedItem.group} className={`flex items-center ${isVertical ? 'flex-col' : ''}`}>
              {groupedItem.items.map((item, index) => {
                return (
                  <Tooltip key={index} title={item.tooltip}>
                    <div
                      className="hover:text-blue-primary text-sm cursor-pointer px-2 py-1"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        // event.stopPropagation();
                        handleSelect(item.name);
                      }}
                    >
                      {item.icon}
                    </div>
                  </Tooltip>
                );
              })}
              {groupIndex < groupedEditorToolbarItems.length - 1 && (
                <div className={`bg-color-border mx-1 ${isVertical ? 'w-full h-px' : 'h-6 w-px'}`} />
              )}
            </div>
          );
        })}
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          title={(selectedBlock && capitalize(selectedBlock?.type)) || ''}
          position={PositionType.TOP}
          component={
            (selectedBlock &&
              groupedEditorToolbarItems
                .flatMap((g) => g.items)
                .find((item) => item.name === selectedBlock.type)
                ?.component({ block: selectedBlock, handleChange, closeModal })) ?? <div />
          }
        />
      </div>
    </div>
  );
};
