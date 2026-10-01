import { useCallback, useState } from 'react';

/**
 * Which rows of a list are open, by id, with the "expand all" toggle on top. Everything starts
 * closed. `toggle`, `expand` and `setExpandedIds` are stable, so memoised rows can take them.
 */
export const useExpandedIds = (ids: string[]) => {
  const [expandedIds, setExpanded] = useState<Set<string>>(new Set());
  const isAllExpanded = ids.length > 0 && ids.every((id) => expandedIds.has(id));

  const toggle = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const expand = useCallback((id: string) => {
    setExpanded((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);
  const setExpandedIds = useCallback((next: string[]) => setExpanded(new Set(next)), []);
  const toggleAll = () => setExpanded(isAllExpanded ? new Set() : new Set(ids));

  return { isExpanded: (id: string) => expandedIds.has(id), isAllExpanded, toggle, expand, setExpandedIds, toggleAll };
};
