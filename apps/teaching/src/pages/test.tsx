import { Button, Select, SplitButton, TextInput } from '@components/app';
import { Modal } from '@components/app/modals';
import { Block, HtmlEditor, MathEditor } from '@components/editors';
import { RightSquareBracket } from '@components/editors/functions/DymaicBrackets';
import { serializeBlocks } from '@components/editors/math-jax-editor/util';
import { PencilIcon, PlusIcon, SquaresFourIcon, TrashIcon } from '@phosphor-icons/react';
import { Layout } from '@enums';
import { IPosition, ITarget } from '@interfaces';
import { getCombineValue } from '@utils/helpers';
import { useState } from 'react';

const TestPage = () => {
  const [html, setHtml] = useState(``);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<Record<string, string>>({
    y: ``,
  });

  const [questionBlocks, setQuestionBlocks] = useState<string>('[]');

  const handleChangeQuestion = (blocks: Block[]) => {
    setQuestionBlocks(JSON.stringify(blocks));
  };

  const onClick = () => {
    setIsOpen(!isOpen);
  };

  console.log('####questionBlocks: ', questionBlocks);

  const [position] = useState({ start: 0, end: 0 });

  const setPosition = (newPosition: IPosition) => {
    position.start = newPosition.start;
    position.end = newPosition.end;
  };

  const handleChange = (event: ITarget) => {
    const elName = event.target.name;
    const value = event.target.value;
    console.log('####value: ', value, elName);
    setData({ ...data, [elName]: getCombineValue(data[elName], value, position) });
    setHtml(`<div>${html} ${value}</div>`);
  };

  const handleChange2 = (event: ITarget) => {
    const elName = event.target.name;
    const value = event.target.value;
    console.log('####value2: ', value, elName);
    setData({ ...data, [elName]: value });
  };

  return (
    <div className="sd">
      {/* <ShowFunction name="y" handleChange={handleChange} /> */}
      {/* <HtmlEditor name="y" handleChange={handleChange2} html={data.y} isAutoFocus /> */}
      <div className="flex space-x-3">
        <Button text="Secondary" isSecondary isLoading={isLoading} onClick={onClick} />
        <Button text="Primary" isLoading={isLoading} onClick={onClick} />
      </div>
      <div>
        <TextInput
          label="Hello Input"
          placeholder="Search Google Maps"
          leftsection={<SquaresFourIcon className="w-5 h-5" />}
        />
      </div>
      <div>
        <Modal
          title="Title"
          isOpen={isOpen}
          onClose={onClick}
          component={
            <div className="h-screen">
              <HtmlEditor name="z" handleChange={handleChange2} html={data.y} isAutoFocus />
            </div>
          }
        />
      </div>
      <div>
        <Select
          items={[
            { label: 'A', value: 'A' },
            { label: 'B', value: 'B' },
          ]}
          values={['A']}
          onChange={() => {}}
        />
      </div>
      <SplitButton
        text="Split Button"
        menuItems={[
          {
            label: 'Add Questions',
            onClick: () => {},
            icon: <PlusIcon weight="bold" className="w-4 h-4" />,
          },
          {
            label: 'Edit Details',
            onClick: () => {},
            icon: <PencilIcon weight="bold" className="w-4 h-4" />,
          },
          {
            label: 'Delete',
            onClick: () => {},
            icon: <TrashIcon weight="bold" className="w-4 h-4" />,
          },
        ]}
        onClick={() => {}}
      />
      {/* <HtmlEditor2
        initialContent={html}
        onChange={(html: string) => {
          setHtml(html);
        }}
      /> */}
      <textarea value={data.y} readOnly className="text-sm text-gray-500" />

      {/* <HtmlEditor3
        content={html}
        onChange={(html: string) => {
          setHtml(html);
        }}
      /> */}
      <div className="text-color-primary font-medium text-sm">
        <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="currentColor">
          <circle cx="25" cy="25" r="20" />
        </svg>
        <div dangerouslySetInnerHTML={{ __html: RightSquareBracket(3) }} />
      </div>
      <MathEditor blocks={JSON.parse(questionBlocks)} handleChange={handleChangeQuestion} label="Question" autoFocus />
      <div>{serializeBlocks(JSON.parse(questionBlocks))}</div>

      {/* <MathEditor2 /> */}
    </div>
  );
};

TestPage.layout = Layout.SIDEBAR;

export default TestPage;
