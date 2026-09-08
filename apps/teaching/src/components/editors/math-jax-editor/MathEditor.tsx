import { Label } from '@repo/ui/app';
import { useEffect, useRef, useState } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { EquationActions } from './EquationActions';
import { TextEditor } from './TextEditor';
import { type Block, EditorContentType, type TextNode } from './types';
import { getEditorInitialContent, serializeBlock } from './util';

interface IProps {
  blocks?: Block[];
  handleChange: (blocks: Block[]) => void;
  label?: string;
  autoFocus?: boolean;
}

export const MathEditor = ({ blocks, handleChange, label, autoFocus }: IProps) => {
  const [editorBlocks, setEditorBlocks] = useState<Block[]>([getEditorInitialContent(EditorContentType.TEXT)]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(0);
  // const [refresh, setRefresh] = useState<boolean>(false);
  // const [canFocus, setCanFocus] = useState<boolean>(true);
  const [hasFocus, setHasFocus] = useState<boolean>(false);
  const [renderFocus, setRenderFocus] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [sideMenuX, setSideMenuX] = useState<number>(0);
  const [sideMenuY, setSideMenuY] = useState<number>(0);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleBlockChange = (block: Block) => {
    console.log('####clicked block: ', block);
    const newBlocks = [...editorBlocks];
    const selectedBlock = editorBlocks[selectedBlockIndex];
    if (selectedBlock?.type === block.type) {
      newBlocks[selectedBlockIndex] = block;
    } else {
      newBlocks.push(block);
      newBlocks.push(getEditorInitialContent(EditorContentType.TEXT));
      setSelectedBlockIndex(newBlocks.length - 1);
    }
    setEditorBlocks(newBlocks);
    handleChange(newBlocks);
    setRenderFocus(!renderFocus);
  };

  const handleBlockEdit = (index: number) => {
    console.log('####handleBlockEdit: ', index);
    setSelectedBlockIndex(index);
  };

  const handleBlockDelete = (index: number) => {
    const newBlocks = [...editorBlocks];
    newBlocks.splice(index, 1);
    setEditorBlocks(newBlocks);
    handleChange(newBlocks);
  };

  const handleTextBlockChange = (index: number, value: string) => {
    const block = { ...editorBlocks[index], content: value } as TextNode;
    const newBlocks = [...editorBlocks];
    newBlocks[selectedBlockIndex] = block;
    console.log('####handleTextBlockChange: ', newBlocks);
    setEditorBlocks(newBlocks);
    handleChange(newBlocks);
    setHasFocus(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent default browser context menu
    setSideMenuX(e.clientX);
    setSideMenuY(e.clientY);
    setIsSideMenuOpen(true);
  };

  const handleBlockBlur = (event: MouseEvent) => {
    console.log('####handleBlockBlur: ');
    if (editorContainerRef.current && !editorContainerRef.current.contains(event.target as Node)) {
      console.log('Clicked outside');
      // setHasFocus(false);
    }
  };

  const onCloseModal = () => {
    for (let i = selectedBlockIndex + 1; i < editorBlocks.length; i++) {
      if (editorBlocks[i].type === EditorContentType.TEXT) {
        setSelectedBlockIndex(i);
        setHasFocus(true);
        setRenderFocus(!renderFocus);
        break;
      }
    }
  };

  const onClickEditor = () => {
    // setCanFocus(!canFocus);
    setIsSideMenuOpen(false);
    setSelectedBlockIndex(editorBlocks.length - 1);
    setHasFocus(true);
    setRenderFocus(!renderFocus);
  };

  useEffect(() => {
    if (
      blocks?.length &&
      editorBlocks.length === 1 &&
      editorBlocks[0].type === EditorContentType.TEXT &&
      !editorBlocks[0].content
    ) {
      setEditorBlocks([...blocks]);
      setSelectedBlockIndex(blocks.length - 1);
    }
  }, [blocks]);

  useEffect(() => {
    document.addEventListener('click', handleBlockBlur);
    return () => {
      document.removeEventListener('click', handleBlockBlur);
    };
  }, []);

  useEffect(() => {
    setHasFocus(autoFocus || false);
  }, []);

  console.log('####selectedEditorBlockIndex: ', selectedBlockIndex, hasFocus, editorBlocks);

  return (
    <div>
      {label && <Label label={label} required />}
      <EditorToolbar block={editorBlocks[selectedBlockIndex]} handleChange={handleBlockChange} onClose={onCloseModal} />
      <div className="relative border border-color-border px-2 text-sm" onContextMenu={handleContextMenu}>
        <div className="py-2" onClick={onClickEditor} ref={editorContainerRef}>
          {editorBlocks.map((block, index) => {
            const isText = block.type === EditorContentType.TEXT;
            // if (isText && !block.content.trim() && index !== editorBlocks.length - 1) return null;
            // console.log('####block: ', block, serializeBlock(block, true));
            return (
              <span key={index}>
                {isText ? (
                  <TextEditor
                    key={index}
                    index={index}
                    handleChange={handleTextBlockChange}
                    onFocus={handleBlockEdit}
                    content={block.content}
                    isFocused={selectedBlockIndex === index && hasFocus}
                    // canFocus={canFocus}
                    renderFocus={renderFocus}
                    className={`${block.className ? block.className : ''} ${block.bold ? '!font-bold' : ''} ${block.italic ? '!italic' : ''} ${block.underline ? '!underline' : ''}`}
                  />
                ) : (
                  <div
                    className={`relative group h-full border border-transparent hover:border-blue-primary ${[EditorContentType.LIST, EditorContentType.ORDERED_LIST, EditorContentType.IMAGE, EditorContentType.HEADING, EditorContentType.CODE].includes(block.type) ? '' : 'inline-table'}`}
                    contentEditable={false}
                  >
                    <span
                      className="w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleBlockEdit(index);
                      }}
                    >
                      {serializeBlock(block, true)}
                    </span>
                    <EquationActions onEdit={() => handleBlockEdit(index)} onDelete={() => handleBlockDelete(index)} />
                  </div>
                )}
              </span>
            );
          })}
          {/* {editorBlocks.length === 1 &&
            hasFocus === false &&
            editorBlocks[0].type === EditorContentType.TEXT &&
            !editorBlocks[0].content && (
              <div className="inline-table text-color-secondary">{`Write ${label?.toLowerCase() || 'here'}...`}</div>
            )} */}
        </div>

        {isSideMenuOpen && (
          <div
            className={`z-10 absolute right-0 bottom-0 h-full max-h-[500px] overflow-auto ${isSideMenuOpen ? 'flex justify-end' : 'hidden'}`}
            // style={{ top: sideMenuY, left: sideMenuX }}
          >
            <EditorToolbar
              block={editorBlocks[selectedBlockIndex]}
              handleChange={handleBlockChange}
              onClose={onCloseModal}
              isVertical
            />
          </div>
        )}
      </div>
    </div>
  );
};
