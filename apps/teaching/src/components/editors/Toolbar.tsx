import { Tooltip } from '@repo/ui/app';
import { ITarget } from '@interfaces';
import {
  ArrowUDownLeftIcon,
  ArrowUUpRightIcon,
  ImageIcon,
  LinkIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBolderIcon,
  TextHIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from '@phosphor-icons/react';
import ShowFunction from './functions/display/ShowFunction';

interface IProps {
  name: string;
  handleChange: (data: ITarget) => void;
}

const TOOLBAR_ITEMS = [
  {
    group: 'history',
    items: [
      { command: 'undo', icon: <ArrowUDownLeftIcon />, tooltip: 'Undo (Ctrl+Z)' },
      { command: 'redo', icon: <ArrowUUpRightIcon />, tooltip: 'Redo (Ctrl+Y)' },
    ],
  },
  {
    group: 'text',
    items: [
      { command: 'bold', icon: <TextBolderIcon />, tooltip: 'Bold (Ctrl+B)' },
      { command: 'italic', icon: <TextItalicIcon />, tooltip: 'Italic (Ctrl+I)' },
      { command: 'underline', icon: <TextUnderlineIcon />, tooltip: 'Underline (Ctrl+U)' },
      // { command: 'subscript', icon: <TextSubscript />, tooltip: 'Subscript' },
      // { command: 'superscript', icon: <TextSuperscript />, tooltip: 'Superscript' },
    ],
  },
  {
    group: 'lists',
    items: [
      { command: 'insertUnorderedList', icon: <ListBulletsIcon />, tooltip: 'Bullet List' },
      { command: 'insertOrderedList', icon: <ListNumbersIcon />, tooltip: 'Numbered List' },
    ],
  },
  {
    group: 'align',
    items: [
      { command: 'justifyLeft', icon: <TextAlignLeftIcon />, tooltip: 'Align Left' },
      { command: 'justifyCenter', icon: <TextAlignCenterIcon />, tooltip: 'Align Center' },
      { command: 'justifyRight', icon: <TextAlignRightIcon />, tooltip: 'Align Right' },
    ],
  },
  {
    group: 'insert',
    items: [
      { command: 'heading', icon: <TextHIcon />, tooltip: 'Heading' },
      { command: 'createLink', icon: <LinkIcon />, tooltip: 'Insert Link' },
      { command: 'insertImage', icon: <ImageIcon />, tooltip: 'Insert Image' },
    ],
  },
];

export const Toolbar = ({ name, handleChange }: IProps) => {
  const onCommand = (command: string, value?: string) => {
    const element = document.getElementById(name);
    if (element) {
      element.focus();
      // Save current selection
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);

      // Execute the command
      document.execCommand(command, false, value);

      // Update the html value
      const current = element.innerHTML;
      handleChange({ target: { name, value: current } });

      // Restore selection and focus
      if (selection && range) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const handleCommand = (command: string) => {
    switch (command) {
      case 'createLink':
        const url = prompt('Enter URL:');
        if (url) onCommand(command, url);
        break;
      case 'insertImage':
        const imgUrl = prompt('Enter image URL:');
        if (imgUrl) onCommand(command, imgUrl);
        break;
      case 'heading':
        onCommand('formatBlock', '<h2>');
        break;
      default:
        onCommand(command);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 p-0.5 bg-background-paper border border-color-border flex-wrap mb-2">
        {TOOLBAR_ITEMS.map((group, groupIndex) => (
          <div key={group.group} className="flex items-center">
            {group.items.map((item) => (
              <Tooltip key={item.command} title={item.tooltip}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCommand(item.command);
                  }}
                  className="p-1 rounded hover:bg-background-secondary text-color-secondary"
                >
                  {item.icon}
                </button>
              </Tooltip>
            ))}
            {groupIndex < TOOLBAR_ITEMS.length && <div className="w-px h-6 bg-color-border mx-1" />}
          </div>
        ))}

        <div className="">
          <ShowFunction
            name={name}
            handleChange={({ target }: ITarget) => {
              onCommand('insertHTML', target.value);
            }}
          />
        </div>
      </div>
    </>
  );
};
