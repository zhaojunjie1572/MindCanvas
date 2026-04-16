import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { MindNode, Connection, Tool, Theme, CanvasState, PenPath, HistoryState } from '../types';

interface Store {
  nodes: MindNode[];
  connections: Connection[];
  penPaths: PenPath[];
  selectedId: string | null;
  tool: Tool;
  theme: Theme;
  canvas: CanvasState;
  penColor: string;

  isDrawing: boolean;
  drawStart: { x: number; y: number } | null;
  penPath: { x: number; y: number }[];

  history: HistoryState[];
  historyIndex: number;

  showSidebar: string | null;
  editingNodeId: string | null;

  setTool: (tool: Tool) => void;
  setTheme: (theme: Theme) => void;
  setSelected: (id: string | null) => void;
  setShowSidebar: (sidebar: string | null) => void;
  setEditingNode: (id: string | null) => void;
  setPenColor: (color: string) => void;

  addNode: (node: Omit<MindNode, 'id'>) => string;
  updateNode: (id: string, updates: Partial<MindNode>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;

  addConnection: (from: string, to: string) => void;
  deleteConnection: (id: string) => void;

  addPenPath: (path: Omit<PenPath, 'id'>) => void;
  updatePenPath: (id: string, updates: Partial<PenPath>) => void;
  deletePenPath: (id: string) => void;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;

  startDrawing: (x: number, y: number) => void;
  continueDrawing: (x: number, y: number) => void;
  endDrawing: () => void;

  saveHistory: () => void;
  undo: () => void;
  redo: () => void;

  loadData: (nodes: MindNode[], connections: Connection[], penPaths?: PenPath[]) => void;
  clearCanvas: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      nodes: [],
      connections: [],
      penPaths: [],
      selectedId: null,
      tool: 'select',
      theme: 'light',
      canvas: { zoom: 1, panX: 0, panY: 0 },
      penColor: '#1a1a2e',
      isDrawing: false,
      drawStart: null,
      penPath: [],
      history: [],
      historyIndex: -1,
      showSidebar: null,
      editingNodeId: null,

      setTool: (tool) => set({ tool }),
      setTheme: (theme) => set({ theme }),
      setSelected: (id) => set({ selectedId: id }),
      setShowSidebar: (sidebar) => set({ showSidebar: sidebar }),
      setEditingNode: (id) => set({ editingNodeId: id }),
      setPenColor: (color) => set({ penColor: color }),

      addNode: (node) => {
        const id = uuid();
        const newNode = { ...node, id };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
        get().saveHistory();
        return id;
      },

      updateNode: (id, updates) => {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        }));
      },

      deleteNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          connections: state.connections.filter((c) => c.from !== id && c.to !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }));
        get().saveHistory();
      },

      duplicateNode: (id) => {
        const node = get().nodes.find((n) => n.id === id);
        if (!node) return;
        const newId = uuid();
        const newNode = { ...node, id: newId, x: node.x + 30, y: node.y + 30 };
        set((state) => ({ nodes: [...state.nodes, newNode], selectedId: newId }));
        get().saveHistory();
      },

      addConnection: (from, to) => {
        const id = uuid();
        set((state) => ({
          connections: [...state.connections, { id, from, to }],
        }));
        get().saveHistory();
      },

      deleteConnection: (id) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
        }));
        get().saveHistory();
      },

      addPenPath: (path) => {
        const id = uuid();
        set((state) => ({
          penPaths: [...state.penPaths, { ...path, id }],
        }));
        get().saveHistory();
      },

      updatePenPath: (id, updates) => {
        set((state) => ({
          penPaths: state.penPaths.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      deletePenPath: (id) => {
        set((state) => ({
          penPaths: state.penPaths.filter((p) => p.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }));
        get().saveHistory();
      },

      setZoom: (zoom) => {
        set((state) => ({
          canvas: { ...state.canvas, zoom: Math.max(0.1, Math.min(3, zoom)) },
        }));
      },

      setPan: (x, y) => {
        set((state) => ({
          canvas: { ...state.canvas, panX: x, panY: y },
        }));
      },

      zoomIn: () => {
        set((state) => ({
          canvas: { ...state.canvas, zoom: Math.min(3, state.canvas.zoom + 0.1) },
        }));
      },

      zoomOut: () => {
        set((state) => ({
          canvas: { ...state.canvas, zoom: Math.max(0.1, state.canvas.zoom - 0.1) },
        }));
      },

      zoomFit: () => {
        const { nodes } = get();
        if (nodes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach((n) => {
          minX = Math.min(minX, n.x);
          minY = Math.min(minY, n.y);
          maxX = Math.max(maxX, n.x + n.w);
          maxY = Math.max(maxY, n.y + n.h);
        });

        const pad = 100;
        const width = maxX - minX + pad * 2;
        const height = maxY - minY + pad * 2;
        const zoom = Math.min(1, Math.min(window.innerWidth / width, window.innerHeight / height));

        set({
          canvas: {
            zoom,
            panX: pad - minX * zoom,
            panY: pad - minY * zoom,
          },
        });
      },

      startDrawing: (x, y) => {
        set({ isDrawing: true, drawStart: { x, y }, penPath: [{ x, y }] });
      },

      continueDrawing: (x, y) => {
        const { tool, penPath: currentPath } = get();
        if (tool === 'pen' || tool === 'rect' || tool === 'circle' || tool === 'diamond' || tool === 'triangle' || tool === 'pentagon' || tool === 'hexagon' || tool === 'star5' || tool === 'star6' || tool === 'arrowUp' || tool === 'arrowDown' || tool === 'arrowLeft' || tool === 'arrowRight' || tool === 'line') {
          set({ penPath: [...currentPath, { x, y }] });
        }
      },

      endDrawing: () => {
        set({ isDrawing: false, drawStart: null, penPath: [] });
      },

      saveHistory: () => {
        const { nodes, connections, penPaths, history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ nodes: [...nodes], connections: [...connections], penPaths: [...penPaths] });
        if (newHistory.length > 50) newHistory.shift();
        set({ history: newHistory, historyIndex: newHistory.length - 1 });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const prev = history[historyIndex - 1];
          set({
            nodes: prev.nodes,
            connections: prev.connections,
            penPaths: prev.penPaths,
            historyIndex: historyIndex - 1,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const next = history[historyIndex + 1];
          set({
            nodes: next.nodes,
            connections: next.connections,
            penPaths: next.penPaths,
            historyIndex: historyIndex + 1,
          });
        }
      },

      loadData: (nodes, connections, penPaths = []) => {
        set({ nodes, connections, penPaths, selectedId: null });
        get().saveHistory();
        get().zoomFit();
      },

      clearCanvas: () => {
        set({ nodes: [], connections: [], penPaths: [], selectedId: null });
        get().saveHistory();
      },
    }),
    {
      name: 'mindcanvas-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        connections: state.connections,
        penPaths: state.penPaths,
        canvas: state.canvas,
        theme: state.theme,
      }),
    }
  )
);