import type { CubeFace } from '@repo/shared/interfaces';
import { CUBE_NETS, netSketch, type SceneField, type SceneFieldValue, type SceneFieldValues } from '@repo/shared/utils';
import { useEffect, useState } from 'react';
import { Checkbox } from '../../core/Checkbox';
import { Label } from '../../core/Label';
import { Select } from '../../core/Select';
import { TextInput } from '../../core/TextInput';

export interface ISceneFormProps {
  fields: SceneField[];
  values: SceneFieldValues;
  onChange: (name: string, value: SceneFieldValue) => void;
}

const FACES: CubeFace[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];

const Hint = ({ text }: { text?: string }) =>
  text ? <p className="mt-1 text-xs text-muted-foreground">{text}</p> : null;

/**
 * A number, typed freely — it may be empty or half-written while the teacher types — and passed on
 * only when it is a number inside the template's range. Leaving the field puts back the last good one.
 */
const NumberField = ({
  field,
  value,
  onChange,
}: {
  field: Extract<SceneField, { kind: 'number' }>;
  value: number;
  onChange: (value: number) => void;
}) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const isInRange = (text: string) => {
    const next = Number(text);
    return text.trim() !== '' && Number.isFinite(next) && next >= field.min && next <= field.max;
  };
  return (
    <TextInput
      type="number"
      label={field.label}
      min={field.min}
      max={field.max}
      step={field.step}
      value={draft}
      error={!isInRange(draft)}
      helperText={isInRange(draft) ? undefined : `From ${field.min} to ${field.max}.`}
      onChange={(event) => {
        setDraft(event.target.value);
        if (isInRange(event.target.value)) onChange(Number(event.target.value));
      }}
      onBlur={() => setDraft(String(value))}
    />
  );
};

/** One field of a template's form, in the control its kind calls for. */
const FieldControl = ({
  field,
  value,
  onChange,
}: {
  field: SceneField;
  value: SceneFieldValue;
  onChange: (value: SceneFieldValue) => void;
}) => {
  switch (field.kind) {
    case 'number':
      return <NumberField field={field} value={typeof value === 'number' ? value : field.value} onChange={onChange} />;
    case 'toggle':
      return (
        <div>
          <Checkbox label={field.label} checked={value === true} onChange={(checked) => onChange(checked)} />
          <Hint text={field.hint} />
        </div>
      );
    case 'choice': {
      const chosen = typeof value === 'string' ? value : field.value;
      return (
        <div>
          <Select
            label={field.label}
            options={field.options}
            values={[chosen]}
            multiple={false}
            onChange={(items) => items[0] && onChange(String(items[0].value))}
            noSort
          />
          {field.name === 'net' ? (
            <pre className="mt-2 inline-block bg-muted px-3 py-2 font-mono text-sm leading-tight text-foreground">
              {netSketch(CUBE_NETS[Number(chosen)] ?? CUBE_NETS[0])}
            </pre>
          ) : null}
        </div>
      );
    }
    case 'text':
      return (
        <div>
          <TextInput
            label={field.label}
            value={typeof value === 'string' ? value : field.value}
            onChange={(event) => onChange(event.target.value)}
          />
          <Hint text={field.hint} />
        </div>
      );
    case 'texts': {
      const list = Array.isArray(value) ? value.map(String) : field.value;
      return (
        <div>
          <Label label={field.label} />
          <div className="grid grid-cols-6 gap-1">
            {list.map((item, index) => (
              <TextInput
                key={index}
                aria-label={`${field.label}: ${index + 1}`}
                value={item}
                inputClassName="px-1 text-center"
                onChange={(event) => onChange(list.map((old, at) => (at === index ? event.target.value : old)))}
              />
            ))}
          </div>
          <Hint text={field.hint} />
        </div>
      );
    }
    default: {
      const chosen = Array.isArray(value) ? value.map(String) : field.value;
      return (
        <div>
          <Label label={field.label} />
          <div className="grid grid-cols-3 gap-1">
            {FACES.map((face) => (
              <Checkbox
                key={face}
                label={face}
                checked={chosen.includes(face)}
                onChange={(checked) => onChange(checked ? [...chosen, face] : chosen.filter((item) => item !== face))}
              />
            ))}
          </div>
        </div>
      );
    }
  }
};

/** A template's form: one control per field, each change reported by name. */
export const SceneForm = ({ fields, values, onChange }: ISceneFormProps) => (
  <div className="flex flex-col gap-4">
    {fields.map((field) => (
      <FieldControl
        key={field.name}
        field={field}
        value={values[field.name] ?? field.value}
        onChange={(value) => onChange(field.name, value)}
      />
    ))}
  </div>
);
