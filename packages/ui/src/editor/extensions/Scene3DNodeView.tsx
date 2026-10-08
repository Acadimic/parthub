import { PencilSimpleIcon } from '@phosphor-icons/react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useState } from 'react';
import { SceneCard } from '../../content/SceneCard';
import { Button } from '../../core/Button';
import { cn } from '../../lib/cn';
import { originFromAttr, originToAttr, SceneDialog } from '../scene/SceneDialog';

/**
 * A scene as the author sees it: the reader's card, outlined while selected, with Edit. Edit opens
 * the scene's template form when it came from one, and its JSON otherwise.
 */
export const Scene3DNodeView = ({ node, selected, editor, updateAttributes }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const spec = String(node.attrs.spec ?? '');
  const template = String(node.attrs.template ?? '');
  return (
    <NodeViewWrapper data-scene3d="" contentEditable={false}>
      <SceneCard
        spec={spec}
        className={cn(selected && 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background')}
        actions={
          editor.isEditable ? (
            <Button
              isSecondary
              onClick={() => setIsEditing(true)}
              className="shrink-0 px-3 py-1.5 text-sm"
              leftSection={<PencilSimpleIcon weight="bold" className="h-4 w-4" />}
              text="Edit"
            />
          ) : null
        }
      />
      {isEditing ? (
        <SceneDialog
          isOpen
          start={{ kind: 'edit', spec, origin: originFromAttr(template) }}
          onClose={() => setIsEditing(false)}
          onSave={(next, origin) => {
            updateAttributes({ spec: next, template: originToAttr(origin) });
            setIsEditing(false);
          }}
        />
      ) : null}
    </NodeViewWrapper>
  );
};
