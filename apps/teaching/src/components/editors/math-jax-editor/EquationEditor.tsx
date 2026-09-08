import { Label } from '@parthhub/ui/app';
import { RenderEquation } from '@components/others';
import { useEffect, useRef, useState } from 'react';
import { EquationActions } from './EquationActions';
import { EquationToolbar } from './EquationToolbar';
import { TextEditor } from './TextEditor';
import { EquationBlock, EquationType, TextEquationNode } from './types';
import { getEquationInitialContent, serializeEquation } from './util';

interface IProps {
  label?: string;
  blocks: EquationBlock[];
  handleChange: (blocks: EquationBlock[]) => void;
  autoFocus?: boolean;
}

export const EquationEditor = ({ blocks, handleChange, label, autoFocus }: IProps) => {
  const [equationBlocks, setEquationBlocks] = useState<EquationBlock[]>([getEquationInitialContent(EquationType.TEXT)]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(0);
  // const [refresh, setRefresh] = useState<boolean>(false);
  // const [canFocus, setCanFocus] = useState<boolean>(false);
  const [hasFocus, setHasFocus] = useState<boolean>(false);
  const [renderFocus, setRenderFocus] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleBlockChange = (block: EquationBlock) => {
    const newBlocks = [...equationBlocks];
    const selectedBlock = equationBlocks[selectedBlockIndex];
    if (selectedBlock && selectedBlock.type === block.type) {
      newBlocks[selectedBlockIndex] = block;
    } else {
      // const lastBlock = newBlocks[newBlocks.length - 1];
      // if (newBlocks.length && lastBlock?.type === EquationType.TEXT && !lastBlock?.content?.trim()) {
      //   newBlocks[newBlocks.length - 1] = block;
      // } else {
      //   newBlocks.push(block);
      // }
      newBlocks.push(block);
      newBlocks.push(getEquationInitialContent(EquationType.TEXT));
      setSelectedBlockIndex(newBlocks.length - 1);
    }
    setEquationBlocks(newBlocks);
    handleChange(newBlocks);
    setRenderFocus(!renderFocus);
  };

  const handleBlockEdit = (index: number) => {
    setSelectedBlockIndex(index);
  };

  const handleBlockBlur = (event: MouseEvent) => {
    console.log('####handleBlockBlur: ');
    if (editorContainerRef.current && !editorContainerRef.current.contains(event.target as Node)) {
      console.log('Clicked outside');
      // setHasFocus(false);
    }
  };

  const handleBlockDelete = (index: number) => {
    const newBlocks = [...equationBlocks];
    newBlocks.splice(index, 1);
    setEquationBlocks(newBlocks);
    handleChange(newBlocks);
  };

  const handleTextBlockChange = (index: number, value: string) => {
    const block = { ...equationBlocks[index], content: value } as TextEquationNode;
    const newBlocks = [...equationBlocks];
    newBlocks[index] = block;
    setEquationBlocks(newBlocks);
    handleChange(newBlocks);
    setHasFocus(true);
  };

  const onCloseModal = () => {
    for (let i = selectedBlockIndex + 1; i < equationBlocks.length; i++) {
      if (equationBlocks[i].type === EquationType.TEXT) {
        console.log('####onCloseModal: ', i);
        setSelectedBlockIndex(i);
        setHasFocus(true);
        setRenderFocus(!renderFocus);
        break;
      }
    }
  };

  const onClickEditor = () => {
    // setCanFocus(!canFocus);
    setSelectedBlockIndex(equationBlocks.length - 1);
    setHasFocus(true);
    setRenderFocus(!renderFocus);
  };

  useEffect(() => {
    if (
      blocks?.length &&
      equationBlocks.length === 1 &&
      equationBlocks[0].type === EquationType.TEXT &&
      !equationBlocks[0].content
    ) {
      setEquationBlocks([...blocks]);
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

  console.log('####equationBlocks: ', equationBlocks, selectedBlockIndex);
  // console.log('####blocks: ', blocks);
  // console.log('####selectedEquationBlockIndex: ', selectedBlockIndex, equationBlocks[selectedBlockIndex]);

  // console.log('####canFocus: ', canFocus);
  // console.log('####hasFocus: ', hasFocus, selectedBlockIndex);

  return (
    <div>
      {label && <Label label={label} required />}
      <EquationToolbar
        block={equationBlocks[selectedBlockIndex]}
        handleChange={handleBlockChange}
        onClose={onCloseModal}
      />
      <div className="border border-color-border py-2 px-2 text-sm" onClick={onClickEditor} ref={editorContainerRef}>
        {equationBlocks.map((block, index) => {
          const isText = block.type === EquationType.TEXT;
          // if (isText && !block.content.trim() && index !== equationBlocks.length - 1) return null;
          // if (isText) console.log('####equationBlock2: ', selectedBlockIndex, index, block.content);
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
                  isText={true}
                  renderFocus={renderFocus}
                />
              ) : (
                <div
                  className="relative group border border-transparent h-full inline-table mx-0.5 hover:border-blue-primary"
                  key={index}
                  contentEditable={false}
                  onClick={(event) => {
                    handleBlockEdit(index);
                    event.stopPropagation();
                  }}
                >
                  <RenderEquation equation={serializeEquation({ ...block })} />
                  <EquationActions onEdit={() => handleBlockEdit(index)} onDelete={() => handleBlockDelete(index)} />
                </div>
              )}
            </span>
          );
        })}
        {/* {equationBlocks.length === 1 &&
          hasFocus === false &&
          equationBlocks[0].type === EquationType.TEXT &&
          !equationBlocks[0].content && (
            <div className="inline-table text-color-secondary">{`Write ${label?.toLowerCase() || 'here'}...`}</div>
          )} */}
      </div>
    </div>
  );
};
