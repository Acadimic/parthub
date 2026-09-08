import { Select } from '@components/app/selects';
import { Button, TextInput } from '@repo/ui/app';
import { Layout } from '@enums';
import { type ISelectItem } from '@interfaces';
import { HouseIcon } from '@phosphor-icons/react';
import { useState } from 'react';

const HomePage = () => {
  const [isOpen, setIsOpen] = useState(false);

  const onClick = () => {
    setIsOpen(!isOpen);
  };

  const [values, setValues] = useState<string[]>([]);

  const onSelect = (newValues: ISelectItem[]) => {
    console.log('####selected: ', newValues);
    setValues(newValues.map((item) => item.value));
  };

  return (
    <div className="sd">
      <div className="flex space-x-3">
        <Button text="Secondary" isSecondary onClick={onClick} />
        <Button text="Primary" onClick={onClick} />
      </div>
      <div>
        <TextInput label="Hello Input" placeholder="Search Google Maps" leftsection={<HouseIcon />} />
      </div>
      <div>
        <Select
          items={[
            { label: 'A', value: 'A', group: 'Group A' },
            { label: 'B', value: 'B', group: 'Group A' },
            { label: 'C', value: 'C', group: 'Group B' },
            { label: 'D', value: 'D' },
          ]}
          label="Hello Select"
          onChange={onSelect}
          values={values}
          isGrouped
        />
      </div>
    </div>
  );
};

HomePage.layout = Layout.SIDEBAR;

export default HomePage;
