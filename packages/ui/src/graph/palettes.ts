/**
 * Colour ramps for a graph's height (a surface) or its length (a curve).
 *
 * These are data colours drawn by WebGL, not interface colours, so they are not theme tokens: each
 * ramp runs from a deep shade to a light one and reads on both the light and the dark canvas.
 */
export interface IGraphPalette {
  id: string;
  name: string;
  /** Evenly spaced stops, low to high. */
  stops: string[];
}

export const GRAPH_PALETTES: IGraphPalette[] = [
  { id: 'aurora', name: 'Aurora', stops: ['#312e81', '#6d28d9', '#c026d3', '#f43f5e', '#fb923c', '#fde047'] },
  { id: 'ocean', name: 'Ocean', stops: ['#0b1d51', '#1d4ed8', '#0891b2', '#14b8a6', '#5eead4', '#ecfccb'] },
  { id: 'prism', name: 'Prism', stops: ['#5e4fa2', '#3288bd', '#66c2a5', '#e6f598', '#fdae61', '#d53e4f'] },
  { id: 'viridis', name: 'Viridis', stops: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'] },
];

export const DEFAULT_GRAPH_PALETTE = GRAPH_PALETTES[0];

/** The ramp as a CSS gradient, for the swatch that picks it. */
export const paletteGradient = (palette: IGraphPalette): string =>
  `linear-gradient(90deg, ${palette.stops.join(', ')})`;
