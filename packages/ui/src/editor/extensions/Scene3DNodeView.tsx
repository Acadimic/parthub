import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { SceneCard } from '../../content/SceneCard';
import { cn } from '../../lib/cn';

/** A scene as the author sees it: the reader's card, outlined while selected. */
export const Scene3DNodeView = ({ node, selected }: NodeViewProps) => (
  <NodeViewWrapper data-scene3d="" contentEditable={false}>
    <SceneCard
      spec={String(node.attrs.spec ?? '')}
      className={cn(selected && 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background')}
    />
  </NodeViewWrapper>
);
