import { Select } from '@components/app/selects';
import { Button, SplitButton, TextInput, Modal } from '@repo/ui/app';
import { PencilIcon, PlusIcon, SquaresFourIcon, TrashIcon } from '@phosphor-icons/react';
import { Layout } from '@enums';
import { type ITarget } from '@interfaces';
import { useState } from 'react';
import { type Block, HtmlEditor, MathEditor } from '@components/editors';
import { RightSquareBracket } from '@components/editors/functions/DymaicBrackets';
import { serializeBlocks } from '@components/editors/math-jax-editor/util';

const TestPage = () => {
  const [isLoading] = useState(false);
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

  const handleChange2 = (event: ITarget) => {
    const elName = event.target.name;
    const value = event.target.value;
    setData({ ...data, [elName]: value });
  };

  return (
    <div className="sd">
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
      <div className="text-foreground font-medium text-sm">
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
