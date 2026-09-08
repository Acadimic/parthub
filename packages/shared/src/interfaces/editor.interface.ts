export interface ITarget {
  target: {
    name: string;
    value: string;
  };
}

export interface IFunctionProps {
  handleChange: (target: ITarget) => void;
  name: string;
  closeModal: () => void;
}

export interface IPosition {
  start: number;
  end: number;
}

/**
 * The cells of a grid-shaped editor function (matrix, determinant, table, chemical equation),
 * keyed by `<name>-<row>-<column>` and holding each cell's HTML.
 */
export interface IEditorCellMap {
  [cellKey: string]: string;
}
