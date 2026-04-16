import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { MindNode, Point, PenPath } from '../../types';
import { v4 as uuid } from 'uuid';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onShowTextInput?: (e: MouseEvent) => void;
}

export function Canvas({ canvasRef, onShowTextInput }: CanvasProps) {
  const {
    nodes,
    connections,
    penPaths,
    selectedId,
    tool,
    canvas,
    penColor,
    isDrawing,
    penPath,
    setSelected,
    setPan,
    startDrawing,
    continueDrawing,
    endDrawing,
    addNode,
    addPenPath,
    updateNode,
    updatePenPath,
    setEditingNode,
  } = useStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; nodeX: number; nodeY: number } | null>(null);
  const penPathDragStartRef = useRef<{ x: number; y: number; path: Point[] } | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<{ nodeId: string; anchor: 'top' | 'bottom' | 'left' | 'right'; x: number; y: number } | null>(null);
  const [selectedPenPathId, setSelectedPenPathId] = useState<string | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      setCtx(context);
    }
  }, [canvasRef]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.offsetWidth;
        canvasRef.current.height = containerRef.current.offsetHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  const getCanvasPoint = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - canvas.panX) / canvas.zoom,
      y: (e.clientY - rect.top - canvas.panY) / canvas.zoom,
    };
  }, [canvas, canvasRef]);

  const hitTest = useCallback((x: number, y: number): MindNode | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.shape === 'circle') {
        const cx = n.x + n.w / 2;
        const cy = n.y + n.h / 2;
        const r = Math.max(n.w, n.h) / 2;
        if (Math.hypot(x - cx, y - cy) <= r) return n;
      } else if (n.shape === 'triangle') {
        if (pointInTriangle(x, y, n)) return n;
      } else if (n.shape === 'diamond') {
        const cx = n.x + n.w / 2;
        const cy = n.y + n.h / 2;
        const dx = Math.abs(x - cx) / (n.w / 2);
        const dy = Math.abs(y - cy) / (n.h / 2);
        if (dx + dy <= 1) return n;
      } else if (n.shape === 'line') {
        const dist = pointToLineDistance(x, y, n.x, n.y, n.x + n.w, n.y + n.h);
        if (dist <= 10) return n;
      } else if (n.shape === 'pentagon' || n.shape === 'hexagon' || n.shape === 'star5' || n.shape === 'star6' ||
                 n.shape === 'arrowUp' || n.shape === 'arrowDown' || n.shape === 'arrowLeft' || n.shape === 'arrowRight') {
        if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) return n;
      } else {
        if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) return n;
      }
    }
    return null;
  }, [nodes]);

  const hitTestPenPath = useCallback((x: number, y: number, threshold = 10): PenPath | null => {
    for (let i = penPaths.length - 1; i >= 0; i--) {
      const path = penPaths[i];
      for (let j = 0; j < path.points.length - 1; j++) {
        const p1 = path.points[j];
        const p2 = path.points[j + 1];
        const dist = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
        if (dist <= threshold) return path;
      }
    }
    return null;
  }, [penPaths]);

  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    return Math.hypot(px - xx, py - yy);
  };

  const drawPolygon = (context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sides: number) => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = w / 2;
    const ry = h / 2;
    const angle = Math.PI / 2;

    context.moveTo(cx + rx * Math.cos(angle), cy - ry * Math.sin(angle));
    for (let i = 1; i <= sides; i++) {
      const a = angle + (i * 2 * Math.PI) / sides;
      context.lineTo(cx + rx * Math.cos(a), cy - ry * Math.sin(a));
    }
    context.closePath();
  };

  const drawStar = (context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, points: number) => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const outerR = Math.min(w, h) / 2;
    const innerR = outerR * 0.382;
    const angle = -Math.PI / 2;

    context.moveTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
    for (let i = 1; i <= points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = angle + (i * Math.PI) / points;
      context.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    context.closePath();
  };

  const drawArrow = (context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, direction: 'up' | 'down' | 'left' | 'right') => {
    const cx = x + w / 2;
    const cy = y + h / 2;

    if (direction === 'up') {
      context.moveTo(cx, y);
      context.lineTo(x + w, y + h);
      context.lineTo(cx, y + h * 0.6);
      context.lineTo(x, y + h);
      context.closePath();
    } else if (direction === 'down') {
      context.moveTo(cx, y + h);
      context.lineTo(x + w, y);
      context.lineTo(cx, y + h * 0.4);
      context.lineTo(x, y);
      context.closePath();
    } else if (direction === 'left') {
      context.moveTo(x, cy);
      context.lineTo(x + w, y);
      context.lineTo(x + w * 0.6, cy);
      context.lineTo(x + w, y + h);
      context.closePath();
    } else {
      context.moveTo(x + w, cy);
      context.lineTo(x, y);
      context.lineTo(x + w * 0.4, cy);
      context.lineTo(x, y + h);
      context.closePath();
    }
  };

  const findNearestAnchor = (x: number, y: number, node: MindNode): 'top' | 'bottom' | 'left' | 'right' => {
    const anchors = [
      { anchor: 'top' as const, x: node.x + node.w / 2, y: node.y },
      { anchor: 'bottom' as const, x: node.x + node.w / 2, y: node.y + node.h },
      { anchor: 'left' as const, x: node.x, y: node.y + node.h / 2 },
      { anchor: 'right' as const, x: node.x + node.w, y: node.y + node.h / 2 },
    ];
    let nearest = anchors[0];
    let minDist = Infinity;
    for (const a of anchors) {
      const dist = Math.hypot(x - a.x, y - a.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = a;
      }
    }
    return nearest.anchor;
  };

  const pointInTriangle = (px: number, py: number, n: MindNode): boolean => {
    const x1 = n.x + n.w / 2, y1 = n.y;
    const x2 = n.x + n.w, y2 = n.y + n.h;
    const x3 = n.x, y3 = n.y + n.h;

    const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
    const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
    const c = 1 - a - b;

    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
  };

  const drawGrid = useCallback((context: CanvasRenderingContext2D) => {
    const size = 10;
    context.strokeStyle = '#f0f0f5';
    context.lineWidth = 1;
    const startX = Math.floor(-canvas.panX / canvas.zoom / size) * size;
    const startY = Math.floor(-canvas.panY / canvas.zoom / size) * size;

    context.beginPath();
    for (let x = startX; x < startX + (canvasRef.current?.width || 0) / canvas.zoom + size; x += size) {
      context.moveTo(x, startY);
      context.lineTo(x, startY + (canvasRef.current?.height || 0) / canvas.zoom + size);
    }
    for (let y = startY; y < startY + (canvasRef.current?.height || 0) / canvas.zoom + size; y += size) {
      context.moveTo(startX, y);
      context.lineTo(startX + (canvasRef.current?.width || 0) / canvas.zoom + size, y);
    }
    context.stroke();
  }, [canvas, canvasRef]);

  const getAnchorPoint = (node: MindNode, anchor: 'top' | 'bottom' | 'left' | 'right') => {
    switch (anchor) {
      case 'top': return { x: node.x + node.w / 2, y: node.y };
      case 'bottom': return { x: node.x + node.w / 2, y: node.y + node.h };
      case 'left': return { x: node.x, y: node.y + node.h / 2 };
      case 'right': return { x: node.x + node.w, y: node.y + node.h / 2 };
    }
  };

  const drawConnections = useCallback((context: CanvasRenderingContext2D) => {
    connections.forEach((c) => {
      const from = nodes.find((n: MindNode) => n.id === c.from);
      const to = nodes.find((n: MindNode) => n.id === c.to);
      if (!from || !to) return;

      const anchorFrom = (c as any).anchorFrom || 'bottom';
      const anchorTo = (c as any).anchorTo || 'top';

      const start = getAnchorPoint(from, anchorFrom);
      const end = getAnchorPoint(to, anchorTo);

      context.strokeStyle = '#9ca3af';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.bezierCurveTo(start.x, (start.y + end.y) / 2, end.x, (start.y + end.y) / 2, end.x, end.y);
      context.stroke();

      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      context.fillStyle = '#9ca3af';
      context.beginPath();
      context.moveTo(end.x, end.y);
      context.lineTo(end.x - 8 * Math.cos(angle - Math.PI / 6), end.y - 8 * Math.sin(angle - Math.PI / 6));
      context.lineTo(end.x - 8 * Math.cos(angle + Math.PI / 6), end.y - 8 * Math.sin(angle + Math.PI / 6));
      context.closePath();
      context.fill();
    });

    if (connectFrom) {
      const from = nodes.find((n: MindNode) => n.id === connectFrom.nodeId);
      if (from) {
        context.strokeStyle = '#6366f1';
        context.lineWidth = 2;
        context.setLineDash([5, 5]);
        context.beginPath();
        context.moveTo(connectFrom.x, connectFrom.y);
        context.stroke();
        context.setLineDash([]);

        context.fillStyle = '#6366f1';
        context.beginPath();
        context.arc(connectFrom.x, connectFrom.y, 5, 0, Math.PI * 2);
        context.fill();
      }
    }
  }, [connections, nodes, connectFrom]);

  const drawPenPaths = useCallback((context: CanvasRenderingContext2D) => {
    penPaths.forEach((path) => {
      if (path.points.length < 2) return;
      const isSelected = path.id === selectedPenPathId;
      context.strokeStyle = isSelected ? '#6366f1' : path.color;
      context.lineWidth = isSelected ? path.width + 2 : path.width;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      if (isSelected) {
        context.shadowColor = '#6366f1';
        context.shadowBlur = 10;
      }
      context.beginPath();
      context.moveTo(path.points[0].x, path.points[0].y);

      if (path.points.length === 2) {
        context.lineTo(path.points[1].x, path.points[1].y);
      } else if (path.points.length === 3) {
        const p0 = path.points[0];
        const p1 = path.points[1];
        const p2 = path.points[2];
        const cp1x = p0.x + (p1.x - p0.x) * 0.5;
        const cp1y = p0.y + (p1.y - p0.y) * 0.5;
        const cp2x = p2.x - (p2.x - p1.x) * 0.5;
        const cp2y = p2.y - (p2.y - p1.y) * 0.5;
        context.quadraticCurveTo(cp1x, cp1y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        context.quadraticCurveTo(cp2x, cp2y, p2.x, p2.y);
      } else {
        for (let i = 1; i < path.points.length - 1; i++) {
          const xc = (path.points[i].x + path.points[i + 1].x) / 2;
          const yc = (path.points[i].y + path.points[i + 1].y) / 2;
          context.quadraticCurveTo(path.points[i].x, path.points[i].y, xc, yc);
        }
        context.lineTo(path.points[path.points.length - 1].x, path.points[path.points.length - 1].y);
      }
      context.stroke();
      context.shadowBlur = 0;
    });
  }, [penPaths, selectedPenPathId]);

  const drawSmartPath = useCallback((context: CanvasRenderingContext2D) => {
    if (!isDrawing || penPath.length === 0 || tool !== 'pen') return;

    context.strokeStyle = penColor;
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(penPath[0].x, penPath[0].y);

    if (penPath.length === 2) {
      context.lineTo(penPath[1].x, penPath[1].y);
    } else if (penPath.length === 3) {
      context.quadraticCurveTo(penPath[1].x, penPath[1].y, penPath[2].x, penPath[2].y);
    } else {
      for (let i = 1; i < penPath.length - 1; i++) {
        const xc = (penPath[i].x + penPath[i + 1].x) / 2;
        const yc = (penPath[i].y + penPath[i + 1].y) / 2;
        context.quadraticCurveTo(penPath[i].x, penPath[i].y, xc, yc);
      }
      context.lineTo(penPath[penPath.length - 1].x, penPath[penPath.length - 1].y);
    }
    context.stroke();
    context.setLineDash([]);
  }, [isDrawing, penPath, tool, penColor]);

  const drawNodes = useCallback((context: CanvasRenderingContext2D) => {
    nodes.forEach((n: MindNode) => {
      const isSelected = n.id === selectedId;

      if (n.shape === 'text') {
        if (isSelected) {
          context.strokeStyle = '#6366f1';
          context.lineWidth = 1;
          context.setLineDash([3, 3]);
          context.strokeRect(n.x - 4, n.y - 4, n.w + 8, n.h + 8);
          context.setLineDash([]);
        }
        context.fillStyle = n.textColor || '#1a1a2e';
        context.font = `${n.fontSize || 16}px -apple-system, sans-serif`;
        context.textAlign = 'left';
        context.textBaseline = 'top';

        if (n.direction === 'vertical') {
          const chars = n.text.split('');
          const charHeight = (n.fontSize || 16) * 1.2;
          chars.forEach((char, i) => {
            context.save();
            context.translate(n.x + (n.fontSize || 16), n.y + i * charHeight);
            context.fillText(char, 0, 0);
            context.restore();
          });
        } else {
          context.fillText(n.text, n.x, n.y);
        }
        return;
      }

      context.shadowColor = 'rgba(0,0,0,0.1)';
      context.shadowBlur = isSelected ? 20 : 8;
      context.shadowOffsetY = isSelected ? 4 : 2;

      context.strokeStyle = isSelected ? '#6366f1' : n.border;
      context.lineWidth = isSelected ? 3 : 2;
      context.lineCap = 'round';
      context.lineJoin = 'round';

      context.beginPath();
      if (n.shape === 'circle') {
        const r = Math.max(n.w, n.h) / 2;
        context.arc(n.x + n.w / 2, n.y + n.h / 2, r, 0, Math.PI * 2);
      } else if (n.shape === 'diamond') {
        context.moveTo(n.x + n.w / 2, n.y);
        context.lineTo(n.x + n.w, n.y + n.h / 2);
        context.lineTo(n.x + n.w / 2, n.y + n.h);
        context.lineTo(n.x, n.y + n.h / 2);
        context.closePath();
      } else if (n.shape === 'triangle') {
        context.moveTo(n.x + n.w / 2, n.y);
        context.lineTo(n.x + n.w, n.y + n.h);
        context.lineTo(n.x, n.y + n.h);
        context.closePath();
      } else if (n.shape === 'rect') {
        context.moveTo(n.x + 12, n.y);
        context.lineTo(n.x + n.w - 12, n.y);
        context.quadraticCurveTo(n.x + n.w, n.y, n.x + n.w, n.y + 12);
        context.lineTo(n.x + n.w, n.y + n.h - 12);
        context.quadraticCurveTo(n.x + n.w, n.y + n.h, n.x + n.w - 12, n.y + n.h);
        context.lineTo(n.x + 12, n.y + n.h);
        context.quadraticCurveTo(n.x, n.y + n.h, n.x, n.y + n.h - 12);
        context.lineTo(n.x, n.y + 12);
        context.quadraticCurveTo(n.x, n.y, n.x + 12, n.y);
        context.closePath();
      } else if (n.shape === 'pentagon') {
        drawPolygon(context, n.x, n.y, n.w, n.h, 5);
      } else if (n.shape === 'hexagon') {
        drawPolygon(context, n.x, n.y, n.w, n.h, 6);
      } else if (n.shape === 'star5') {
        drawStar(context, n.x, n.y, n.w, n.h, 5);
      } else if (n.shape === 'star6') {
        drawStar(context, n.x, n.y, n.w, n.h, 6);
      } else if (n.shape === 'arrowUp') {
        drawArrow(context, n.x, n.y, n.w, n.h, 'up');
      } else if (n.shape === 'arrowDown') {
        drawArrow(context, n.x, n.y, n.w, n.h, 'down');
      } else if (n.shape === 'arrowLeft') {
        drawArrow(context, n.x, n.y, n.w, n.h, 'left');
      } else if (n.shape === 'arrowRight') {
        drawArrow(context, n.x, n.y, n.w, n.h, 'right');
      } else if (n.shape === 'line') {
        context.moveTo(n.x, n.y);
        context.lineTo(n.x + n.w, n.y + n.h);
      }

      context.stroke();
      context.shadowBlur = 0;
      context.shadowOffsetY = 0;

      if (n.image) {
        const img = new Image();
        img.src = n.image;
        if (img.complete) {
          const imgSize = Math.min(n.w, n.h) * 0.6;
          const imgX = n.x + (n.w - imgSize) / 2;
          const imgY = n.y + (n.h - imgSize) / 2 - (n.text ? 10 : 0);
          context.drawImage(img, imgX, imgY, imgSize, imgSize);
        }
      }

      if (n.text) {
        context.fillStyle = n.type === 'root' ? '#fff' : '#1a1a2e';
        context.font = `${n.fontSize || 14}px -apple-system, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const textY = n.image ? n.y + n.h - 15 : n.y + n.h / 2;
        wrapText(context, n.text, n.x + n.w / 2, textY, n.w - 20, 20);
      }

      if (isSelected) {
        context.strokeStyle = '#6366f1';
        context.lineWidth = 2;
        context.setLineDash([5, 5]);
        context.strokeRect(n.x - 4, n.y - 4, n.w + 8, n.h + 8);
        context.setLineDash([]);
      }
    });
  }, [nodes, selectedId]);

  const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) => {
    const chars = text.split('');
    let line = '', test = '';
    const yOff = -(chars.length * lh) / 2;
    chars.forEach((c) => {
      test += c;
      if (context.measureText(test).width > maxW) {
        context.fillText(line, x, y + yOff + (chars.indexOf(c) - line.length) * lh);
        line = c;
        test = c;
      } else {
        line = test;
      }
    });
    context.fillText(line, x, y + yOff);
  };

  const drawPreview = useCallback((context: CanvasRenderingContext2D) => {
    if (!isDrawing || tool === 'pen') return;

    const start = useStore.getState().drawStart;
    if (!start) return;

    const end = penPath[penPath.length - 1];
    if (!end) return;

    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    if (w < 5 && h < 5) return;

    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);

    context.strokeStyle = '#6366f1';
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (tool === 'rect') {
      const rw = Math.max(w, 60), rh = Math.max(h, 40);
      context.beginPath();
      context.moveTo(x + 8, y);
      context.lineTo(x + rw - 8, y);
      context.quadraticCurveTo(x + rw, y, x + rw, y + 8);
      context.lineTo(x + rw, y + rh - 8);
      context.quadraticCurveTo(x + rw, y + rh, x + rw - 8, y + rh);
      context.lineTo(x + 8, y + rh);
      context.quadraticCurveTo(x, y + rh, x, y + rh - 8);
      context.lineTo(x, y + 8);
      context.quadraticCurveTo(x, y, x + 8, y);
      context.closePath();
      context.stroke();
    } else if (tool === 'circle') {
      const r = Math.max(w, h) / 2;
      context.beginPath();
      context.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
      context.stroke();
    } else if (tool === 'diamond') {
      context.beginPath();
      context.moveTo(x + w / 2, y);
      context.lineTo(x + w, y + h / 2);
      context.lineTo(x + w / 2, y + h);
      context.lineTo(x, y + h / 2);
      context.closePath();
      context.stroke();
    } else if (tool === 'triangle') {
      context.beginPath();
      context.moveTo(x + w / 2, y);
      context.lineTo(x + w, y + h);
      context.lineTo(x, y + h);
      context.closePath();
      context.stroke();
    } else if (tool === 'pentagon') {
      context.beginPath();
      drawPolygon(context, x, y, Math.max(w, 60), Math.max(h, 60), 5);
      context.stroke();
    } else if (tool === 'hexagon') {
      context.beginPath();
      drawPolygon(context, x, y, Math.max(w, 60), Math.max(h, 60), 6);
      context.stroke();
    } else if (tool === 'star5') {
      context.beginPath();
      drawStar(context, x, y, Math.max(w, 60), Math.max(h, 60), 5);
      context.stroke();
    } else if (tool === 'star6') {
      context.beginPath();
      drawStar(context, x, y, Math.max(w, 60), Math.max(h, 60), 6);
      context.stroke();
    } else if (tool === 'arrowUp') {
      context.beginPath();
      drawArrow(context, x, y, Math.max(w, 40), Math.max(h, 60), 'up');
      context.stroke();
    } else if (tool === 'arrowDown') {
      context.beginPath();
      drawArrow(context, x, y, Math.max(w, 40), Math.max(h, 60), 'down');
      context.stroke();
    } else if (tool === 'arrowLeft') {
      context.beginPath();
      drawArrow(context, x, y, Math.max(w, 60), Math.max(h, 40), 'left');
      context.stroke();
    } else if (tool === 'arrowRight') {
      context.beginPath();
      drawArrow(context, x, y, Math.max(w, 60), Math.max(h, 40), 'right');
      context.stroke();
    } else if (tool === 'line') {
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
      context.setLineDash([]);
      return;
    }
  }, [isDrawing, tool, penPath]);

  const render = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    const mainCanvas = canvasRef.current;

    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.save();
    ctx.translate(canvas.panX, canvas.panY);
    ctx.scale(canvas.zoom, canvas.zoom);

    drawGrid(ctx);
    drawConnections(ctx);
    drawPenPaths(ctx);
    drawNodes(ctx);
    drawSmartPath(ctx);
    drawPreview(ctx);

    ctx.restore();
  }, [ctx, canvasRef, canvas, drawGrid, drawConnections, drawPenPaths, drawNodes, drawSmartPath, drawPreview]);

  useEffect(() => {
    render();
  }, [render, nodes, connections, penPaths, selectedId, selectedPenPathId, canvas, isDrawing, penPath, tool, connectFrom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const currentTool = useStore.getState().tool;
    const point = getCanvasPoint(e);

    if (currentTool === 'hand') {
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (currentTool === 'select') {
      const penPath = hitTestPenPath(point.x, point.y);
      if (penPath) {
        setSelectedPenPathId(penPath.id);
        penPathDragStartRef.current = { x: e.clientX, y: e.clientY, path: [...penPath.points] };
      } else {
        setSelectedPenPathId(null);
        const node = hitTest(point.x, point.y);
        if (node) {
          setSelected(node.id);
          dragStartRef.current = { x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y };
        } else {
          setSelected(null);
        }
      }
    } else if (currentTool === 'connect') {
      const node = hitTest(point.x, point.y);
      if (node) {
        if (connectFrom) {
          if (connectFrom.nodeId !== node.id) {
            const conn: any = {
              from: connectFrom.nodeId,
              to: node.id,
              anchorFrom: connectFrom.anchor,
              anchorTo: findNearestAnchor(point.x, point.y, node),
            };
            useStore.setState((state) => ({
              connections: [...state.connections, { ...conn, id: uuid() }],
            }));
            useStore.getState().saveHistory();
          }
          setConnectFrom(null);
        } else {
          const anchor = findNearestAnchor(point.x, point.y, node);
          const anchorPoint = getAnchorPoint(node, anchor);
          setConnectFrom({ nodeId: node.id, anchor, x: anchorPoint.x, y: anchorPoint.y });
        }
      } else {
        setConnectFrom(null);
      }
    } else if (currentTool === 'textInput') {
      if (onShowTextInput) {
        onShowTextInput(e.nativeEvent);
      }
    } else {
      startDrawing(point.x, point.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const currentTool = useStore.getState().tool;
    const { isDrawing: currentIsDrawing, selectedId: currentSelectedId } = useStore.getState();
    const point = getCanvasPoint(e);

    if (currentTool === 'hand' && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan(canvas.panX + dx, canvas.panY + dy);
      panStartRef.current = { x: e.clientX, y: e.clientY };
    } else if (currentTool === 'select' && penPathDragStartRef.current && selectedPenPathId) {
      const dx = (e.clientX - penPathDragStartRef.current.x) / canvas.zoom;
      const dy = (e.clientY - penPathDragStartRef.current.y) / canvas.zoom;
      const newPoints = penPathDragStartRef.current.path.map((p) => ({
        x: p.x + dx,
        y: p.y + dy,
      }));
      updatePenPath(selectedPenPathId, { points: newPoints });
    } else if (currentTool === 'select' && dragStartRef.current && currentSelectedId) {
      const node = nodes.find((n: MindNode) => n.id === currentSelectedId);
      if (node) {
        const dx = (e.clientX - dragStartRef.current.x) / canvas.zoom;
        const dy = (e.clientY - dragStartRef.current.y) / canvas.zoom;
        updateNode(currentSelectedId, {
          x: dragStartRef.current.nodeX + dx,
          y: dragStartRef.current.nodeY + dy,
        });
      }
    } else if (currentIsDrawing && (currentTool === 'pen' || currentTool === 'rect' || currentTool === 'circle' || currentTool === 'diamond' || currentTool === 'triangle' || currentTool === 'pentagon' || currentTool === 'hexagon' || currentTool === 'star5' || currentTool === 'star6' || currentTool === 'arrowUp' || currentTool === 'arrowDown' || currentTool === 'arrowLeft' || currentTool === 'arrowRight' || currentTool === 'line')) {
      continueDrawing(point.x, point.y);
    }
  };

  const handleMouseUp = () => {
    panStartRef.current = null;
    dragStartRef.current = null;
    penPathDragStartRef.current = null;

    if (isDrawing) {
      const currentTool = useStore.getState().tool;
      const { drawStart, penPath: currentPenPath } = useStore.getState();

      if (currentTool === 'pen' && currentPenPath.length > 2) {
        addPenPath({ points: currentPenPath, color: penColor, width: 3 });
      } else if (currentTool === 'line') {
        if (drawStart && currentPenPath.length > 0) {
          const endPoint = currentPenPath[currentPenPath.length - 1];
          const w = endPoint.x - drawStart.x;
          const h = endPoint.y - drawStart.y;
          const dist = Math.hypot(w, h);
          if (dist > 10) {
            addNode({
              type: 'idea',
              shape: 'line',
              x: drawStart.x,
              y: drawStart.y,
              w: w,
              h: h,
              text: '',
              bg: '#eef2ff',
              border: '#6366f1',
            });
          }
        }
      } else if (currentTool === 'rect' || currentTool === 'circle' || currentTool === 'diamond' || currentTool === 'triangle' || currentTool === 'pentagon' || currentTool === 'hexagon' || currentTool === 'star5' || currentTool === 'star6' || currentTool === 'arrowUp' || currentTool === 'arrowDown' || currentTool === 'arrowLeft' || currentTool === 'arrowRight') {
        if (drawStart && currentPenPath.length > 0) {
          const endPoint = currentPenPath[currentPenPath.length - 1];
          const w = Math.abs(endPoint.x - drawStart.x);
          const h = Math.abs(endPoint.y - drawStart.y);
          if (w > 10 || h > 10) {
            const x = Math.min(drawStart.x, endPoint.x);
            const y = Math.min(drawStart.y, endPoint.y);
            addNode({
              type: 'idea',
              shape: currentTool,
              x,
              y,
              w: Math.max(w, 60),
              h: Math.max(h, 40),
              text: '',
              bg: '#eef2ff',
              border: '#6366f1',
            });
          }
        }
      }
      endDrawing();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    const node = hitTest(point.x, point.y);
    if (node) {
      setEditingNode(node.id);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const { setZoom } = useStore.getState();
    setZoom(canvas.zoom + delta);
  };

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas
        id="mainCanvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as any);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as any);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleMouseUp();
        }}
        style={{ cursor: tool === 'hand' ? 'grab' : (tool === 'select' || tool === 'textInput') ? 'text' : 'crosshair' }}
      />
    </div>
  );
}