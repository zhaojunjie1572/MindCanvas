export type NodeType = 'root' | 'idea' | 'action' | 'note';
export type ShapeType = 'rect' | 'circle' | 'diamond' | 'triangle' | 'text' | 'pentagon' | 'hexagon' | 'star5' | 'star6' | 'arrowUp' | 'arrowDown' | 'arrowLeft' | 'arrowRight' | 'line';
export type Tool = 'select' | 'hand' | 'rect' | 'circle' | 'diamond' | 'triangle' | 'pentagon' | 'hexagon' | 'star5' | 'star6' | 'arrowUp' | 'arrowDown' | 'arrowLeft' | 'arrowRight' | 'line' | 'textInput' | 'pen' | 'connect';
export type Theme = 'light' | 'dark' | 'warm';

export interface Point {
  x: number;
  y: number;
}

export interface MindNode {
  id: string;
  type: NodeType;
  shape: ShapeType;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  bg: string;
  border: string;
  fontSize?: number;
  textColor?: string;
  direction?: 'horizontal' | 'vertical';
  children?: string[];
  image?: string;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  anchorFrom?: 'top' | 'bottom' | 'left' | 'right';
  anchorTo?: 'top' | 'bottom' | 'left' | 'right';
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface PenPath {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export interface HistoryState {
  nodes: MindNode[];
  connections: Connection[];
  penPaths: PenPath[];
}