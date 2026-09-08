import React, { useEffect } from 'react';
import ContentEditable from 'react-contenteditable';

import { Label } from '@parthhub/ui/app';
import { ITarget } from '@interfaces';
import { replaceColor } from '@utils/helpers';
import { Toolbar } from './Toolbar';

interface IProps {
  html: string;
  name: string;
  handleChange: (data: ITarget) => void;
  // setPosition: (data: IPosition) => void;
  placeholder?: string;
  hideToolbar?: boolean;
  setParentFocus?: (name: string) => void;
  minHeight?: number;
  width?: number;
  isAutoFocus?: boolean;
  isDisabled?: boolean;
  label?: string;
  required?: boolean;
}

export function HtmlEditor(props: IProps) {
  const {
    name,
    handleChange,
    hideToolbar,
    setParentFocus,
    minHeight,
    width,
    // setPosition,
    isAutoFocus,
    isDisabled,
    label,
    required,
  } = props;
  const propsHTML = props.html;
  const placeholder = props.placeholder || `Add ${name}`;
  const html = React.useRef('');
  // const ref = React.createRef();
  const [isFocused, setIsFocused] = React.useState(false);
  const [refresh, setRefresh] = React.useState(false);

  const restoreSelection = (containerEl: any, savedSel: any) => {
    let charIndex = 0;
    const range = document.createRange();
    range.setStart(containerEl, 0);
    range.collapse(true);
    const nodeStack = [containerEl];
    let node;
    let foundStart = false;
    let stop = false;
    while (!stop && (node = nodeStack.pop())) {
      if (node.nodeType === 3) {
        const nextCharIndex = charIndex + node.length;
        if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
          range.setStart(node, savedSel.start - charIndex);
          foundStart = true;
        }
        if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
          range.setEnd(node, savedSel.end - charIndex);
          stop = true;
        }
        charIndex = nextCharIndex;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }

    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const saveSelection = (containerEl: HTMLElement | null) => {
    if (!containerEl) return { start: 0, end: 0 };
    const range = window.getSelection()?.getRangeAt(0);
    const preSelectionRange = range?.cloneRange();
    range && preSelectionRange?.selectNodeContents(containerEl);
    range && preSelectionRange?.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange?.toString().length || 0;
    return {
      start,
      end: start + (range?.toString().length || 0),
    };
  };

  let savedSelection: any;

  function doSave() {
    savedSelection = saveSelection(document.getElementById(name));
    console.log('####savedSelection: ', savedSelection);
  }

  function doRestore() {
    if (savedSelection) {
      restoreSelection(document.getElementById(name), savedSelection);
    }
  }

  const setData = (data: string) => {
    html.current = data;
    setRefresh(!refresh);
  };

  const handleContentChange = (evt: any) => {
    html.current = evt.target.value;
    doSave();
    handleChange({ target: { name, value: html.current } });
    // setPosition(savedSelection);
  };

  const handleFocus = () => {
    if (setParentFocus) setParentFocus(name);
    setIsFocused(true);
    if (html.current === placeholder) setData('');
    doRestore();
  };

  const handleBlur = () => {
    if (setParentFocus) setParentFocus(name);
    setIsFocused(false);
    // if (!html.current) setData(placeholder);
  };

  const handleKeyUp = () => {
    doSave();
    // setPosition(savedSelection);
  };

  const handleClick = () => {
    doSave();
    // setPosition(savedSelection);
  };

  useEffect(() => {
    if (propsHTML && propsHTML !== html.current) {
      setData(propsHTML);
    }
  }, [propsHTML]);

  useEffect(() => {
    // if (name && !html.current) setData(placeholder);
    if (isAutoFocus) {
      handleFocus();
      document.getElementById(name)?.focus();
    }
  }, []);

  return (
    <>
      <div className="relative">
        {label && <Label label={label} required={required} />}
        {!hideToolbar && <Toolbar name={name} handleChange={handleChange} />}
        <div className="relative">
          <ContentEditable
            id={name}
            html={html.current}
            // innerRef={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleContentChange}
            onPaste={(e) => {
              e.preventDefault();
              let text = e.clipboardData.getData('text/plain');
              text = replaceColor(text);
              document.execCommand('insertText', false, text);
            }}
            className={`text-color-primary !overflow-x-none w-full select-none border outline-0 outline-color-border text-sm border-color-border px-3 py-2 font-medium rounded-none bg-background-primary focus:border-blue-primary focus:bg-background-secondary hover:bg-background-secondary ${
              !html.current && !isFocused ? 'empty-content' : ''
            }`}
            onKeyUp={handleKeyUp}
            onClick={handleClick}
            tagName="div"
            style={{ minHeight: minHeight }}
            disabled={isDisabled || false}
          />
          {!html.current && !isFocused && (
            <div className="absolute top-0 left-0 px-3 py-2 text-sm text-color-secondary pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>
        {/* Debug view */}
        {/* <div className="mt-4 p-2 bg-gray-100">
          <pre className="text-xs">{html.current}</pre>
        </div> */}
      </div>
    </>
  );
}
