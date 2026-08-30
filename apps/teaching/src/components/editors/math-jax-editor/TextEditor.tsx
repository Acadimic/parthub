import { debounce, getObjectId, replaceColor } from '@utils/helpers';
import { useEffect, useMemo, useRef, useState } from 'react';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';

interface IProps {
  content: string;
  handleChange: (index: number, content: string) => void;
  onFocus: (index: number) => void;
  index: number;
  isFocused: boolean;
  // canFocus: boolean;
  className?: string;
  isText?: boolean;
  renderFocus: boolean;
}

// function saveSelection() {
//   const sel = window.getSelection();
//   if (sel?.rangeCount && sel.rangeCount > 0) {
//     return sel.getRangeAt(0);
//   }
//   return null;
// }

// function restoreSelection(range: Range | null) {
//   const sel = window.getSelection();
//   if (range && sel) {
//     sel.removeAllRanges();
//     sel.addRange(range);
//   }
// }

export const TextEditor = ({
  content,
  handleChange,
  onFocus,
  index,
  isFocused,
  className,
  isText,
  // canFocus,
  renderFocus,
}: IProps) => {
  const htmlRef = useRef('');
  const ref = useRef<ContentEditable>(null);
  const id = useMemo(() => getObjectId(), [index]);
  const [refresh, setRefresh] = useState(false);

  const debouncedSave = useMemo(
    () => debounce((text: string) => handleChange(index, text), 500),
    [index, handleChange],
  );

  const handleTextChange = (event: ContentEditableEvent) => {
    // const range = saveSelection();
    htmlRef.current = event.target.value;
    const text = isText ? event.currentTarget.textContent || '' : event.currentTarget.innerHTML || '';
    debouncedSave(text);
    // requestAnimationFrame(() => restoreSelection(range));
  };

  const focusAtEnd = () => {
    console.log('####focusAtEnd: ');
    const el = document.getElementById(id);
    if (!el) return;

    console.log('####el: ', htmlRef.current, index, isFocused);
    el.focus();

    // Move caret to end
    // const range = document.createRange();
    // range.selectNodeContents(el);
    // range.collapse(false); // false = end, true = start

    // const selection = window.getSelection();
    // selection?.removeAllRanges();
    // selection?.addRange(range);
  };

  useEffect(() => {
    if (isFocused) focusAtEnd();
  }, [isFocused, renderFocus]);

  useEffect(() => {
    console.log('####useEffect: ', content, index);
    if (htmlRef.current !== content) {
      htmlRef.current = content;
      setRefresh(!refresh);
      console.log('####setContent: ', content, index);
    }
  }, [content]);

  // console.log('####divRef.current?.textContent: ', divRef.current?.textContent);
  // console.log('####htmlRef.current2: ', htmlRef.current, id, index, isFocused, content);

  return (
    <>
      {/* <span
        ref={divRef}
        id={`text-editor-${index}`}
        onInput={handleTextChange}
        onFocus={() => onFocus(index)}
        className={`bg-transparent outline-none px-1 py-[7px] h-full w-auto border border-transparent leading-8 hover:border-blue-primary focus:border-blue-primary ${className}`}
        contentEditable={true}
        suppressContentEditableWarning
        onBlur={() => onBlur(index)}
      /> */}
      <ContentEditable
        id={id}
        html={htmlRef.current}
        onChange={handleTextChange}
        // onFocus={() => {
        //   console.log('####onFocus: ', index);
        //   onFocus(index);
        // }}
        onClick={(event) => {
          event.stopPropagation();
          onFocus(index);
          console.log('####onClick: ', index);
        }}
        className={`pr-1.5 py-1 bg-transparent w-full leading-7 outline-none h-full border border-transparent hover:border-blue-primary focus:border-blue-primary ${className}`}
        suppressContentEditableWarning
        // autoFocus={isFocused}
        tagName="span"
        onPaste={(e) => {
          e.preventDefault();
          let text = e.clipboardData.getData('text/plain');
          text = replaceColor(text);
          document.execCommand('insertText', false, text);
        }}
      />
      {/* {divRef.current?.textContent || isFocused ? null : <span>{'Write here...'}</span>} */}
    </>
  );
};
