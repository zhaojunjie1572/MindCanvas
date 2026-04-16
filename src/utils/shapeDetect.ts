import { Point } from '../types';

interface DetectedShape {
  type: 'triangle' | 'rectangle' | 'circle' | 'diamond';
  x: number;
  y: number;
  w: number;
  h: number;
  cx?: number;
  cy?: number;
  r?: number;
  points?: Point[];
}

export function detectShape(pts: Point[]): DetectedShape | null {
  if (pts.length < 20) return null;

  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = maxX - minX;
  const h = maxY - minY;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  if (w < 30 || h < 30) return null;

  const startEnd = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
  const isClosedShape = startEnd < Math.max(w, h) * 0.4;

  if (!isClosedShape) return null;

  const corners8 = findCorners(pts, 8);
  const corners12 = findCorners(pts, 12);

  const aspectRatio = w / h;
  const isSquareLike = aspectRatio > 0.5 && aspectRatio < 2.0;

  const circularity = calculateCircularity(pts, cx, cy, Math.min(w, h) / 2);
  if (circularity > 0.75) {
    return { type: 'circle', x: minX, y: minY, w, h, cx, cy, r: Math.min(w, h) / 2 };
  }

  if (corners8.length === 3) {
    const triangleScore = checkTriangleShape(pts, corners8, minX, minY, maxX, maxY);
    if (triangleScore > 0.5) {
      return { type: 'triangle', x: minX, y: minY, w, h };
    }
  }

  if (corners8.length === 4 || corners12.length === 4) {
    const diamondScore = checkDiamondShape(corners8, corners12, cx, cy, aspectRatio);
    if (diamondScore > 0.6) {
      return { type: 'diamond', x: minX, y: minY, w, h, cx, cy };
    }

    const rectScore = checkRectangleShape(corners8, corners12, aspectRatio);
    if (rectScore > 0.6 && isSquareLike) {
      return { type: 'rectangle', x: minX, y: minY, w, h, cx, cy };
    }
  }

  if (corners12.length >= 4 && corners12.length <= 6 && isSquareLike) {
    const angleAnalysis = analyzeCornerAngles(corners12);
    if (angleAnalysis.rightAngles >= 3) {
      return { type: 'rectangle', x: minX, y: minY, w, h, cx, cy };
    }
  }

  return null;
}

function findCorners(pts: Point[], tolerance: number): Point[] {
  if (pts.length < 3) return [];
  return douglasPeucker(pts, tolerance);
}

function douglasPeucker(pts: Point[], epsilon: number): Point[] {
  if (pts.length < 3) return pts;

  let maxDist = 0;
  let maxIdx = 0;
  const start = pts[0];
  const end = pts[pts.length - 1];

  for (let i = 1; i < pts.length - 1; i++) {
    const dist = perpendicularDistance(pts[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(pts.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(pts.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [start, end];
}

function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

function calculateCircularity(pts: Point[], cx: number, cy: number, r: number): number {
  if (r === 0) return 0;
  let totalDist = 0;
  pts.forEach((p) => {
    totalDist += Math.abs(Math.hypot(p.x - cx, p.y - cy) - r);
  });
  return Math.max(0, 1 - totalDist / pts.length / r);
}

function checkTriangleShape(_pts: Point[], corners: Point[], minX: number, minY: number, maxX: number, maxY: number): number {
  if (corners.length !== 3) return 0;

  const boundingArea = (maxX - minX) * (maxY - minY);
  const area = polygonArea(corners);
  const fillRatio = area / boundingArea;

  if (fillRatio < 0.2) return 0;

  const angles = calculateAngles(corners);
  const hasSharpAngle = angles.some(a => a < Math.PI * 0.6);

  if (!hasSharpAngle) return 0;

  const top = corners.reduce((a, b) => a.y < b.y ? a : b);
  const bottoms = corners.filter(c => c !== top).sort((a, b) => a.x - b.x);

  if (bottoms.length !== 2) return 0;

  const height = Math.max(bottoms[0].y, bottoms[1].y) - top.y;
  const base = Math.hypot(bottoms[1].x - bottoms[0].x, bottoms[1].y - bottoms[0].y);

  if (height < 20 || base < 20) return 0;

  return fillRatio * 1.5;
}

function checkDiamondShape(corners8: Point[], corners12: Point[], cx: number, cy: number, _aspectRatio: number): number {
  const corners = corners8.length === 4 ? corners8 : corners12;
  if (corners.length !== 4) return 0;

  const isWide = _aspectRatio > 1.5;
  const isTall = _aspectRatio < 0.67;
  if (isWide || isTall) return 0;

  const sorted = [...corners].sort((a, b) => a.y - b.y);
  const top = sorted[0];
  const bottom = sorted[3];
  const leftRight = sorted.slice(1, 3).sort((a, b) => a.x - b.x);
  const left = leftRight[0];
  const right = leftRight[1];

  const dists = [
    Math.hypot(top.x - cx, top.y - cy),
    Math.hypot(bottom.x - cx, bottom.y - cy),
    Math.hypot(left.x - cx, left.y - cy),
    Math.hypot(right.x - cx, right.y - cy)
  ];

  const avgDist = dists.reduce((a, b) => a + b, 0) / 4;
  const variance = dists.reduce((sum, d) => sum + Math.pow(d - avgDist, 2), 0) / 4;

  if (variance > avgDist * 0.3) return 0;

  const slopes = [
    Math.abs((top.y - left.y) / (top.x - left.x + 0.001)),
    Math.abs((top.y - right.y) / (right.x - top.x + 0.001)),
    Math.abs((bottom.y - left.y) / (left.x - bottom.x + 0.001)),
    Math.abs((bottom.y - right.y) / (right.x - bottom.x + 0.001))
  ];

  const avgSlope = slopes.reduce((a, b) => a + b, 0) / 4;
  const slopeVariance = slopes.reduce((sum, s) => sum + Math.pow(s - avgSlope, 2), 0) / 4;

  if (slopeVariance > 0.5) return 0;

  return 1 - Math.sqrt(variance) / avgDist;
}

function checkRectangleShape(corners8: Point[], corners12: Point[], _aspectRatio: number): number {
  const corners = corners8.length >= 4 ? corners8 : corners12;
  if (corners.length < 4) return 0;

  const angleAnalysis = analyzeCornerAngles(corners);
  const rightAngleRatio = angleAnalysis.rightAngles / corners.length;

  if (rightAngleRatio < 0.5) return 0;

  const ratios = findAdjacentSides(corners);
  if (ratios.length < 2) return 0;

  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;

  if (avgRatio < 0.5) return 0;

  return rightAngleRatio * avgRatio;
}

function analyzeCornerAngles(corners: Point[]): { rightAngles: number; angles: number[] } {
  const angles: number[] = [];
  const n = corners.length;

  for (let i = 0; i < n; i++) {
    const prev = corners[(i - 1 + n) % n];
    const curr = corners[i];
    const next = corners[(i + 1) % n];

    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.hypot(v1.x, v1.y);
    const mag2 = Math.hypot(v2.x, v2.y);

    if (mag1 > 0 && mag2 > 0) {
      const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
      angles.push(Math.acos(cosAngle));
    }
  }

  const rightAngles = angles.filter(a => Math.abs(a - Math.PI / 2) < 0.4).length;

  return { rightAngles, angles };
}

function findAdjacentSides(corners: Point[]): number[] {
  const sides: number[] = [];
  const n = corners.length;

  for (let i = 0; i < n; i++) {
    const curr = corners[i];
    const next = corners[(i + 1) % n];
    sides.push(Math.hypot(next.x - curr.x, next.y - curr.y));
  }

  const ratios: number[] = [];
  for (let i = 0; i < n; i++) {
    const len = sides[i];
    const next = sides[(i + 1) % n];
    ratios.push(Math.min(len, next) / Math.max(len, next));
  }
  return ratios;
}

function calculateAngles(corners: Point[]): number[] {
  const angles: number[] = [];
  const n = corners.length;

  for (let i = 0; i < n; i++) {
    const prev = corners[(i - 1 + n) % n];
    const curr = corners[i];
    const next = corners[(i + 1) % n];

    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.hypot(v1.x, v1.y);
    const mag2 = Math.hypot(v2.x, v2.y);

    if (mag1 > 0 && mag2 > 0) {
      const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
      angles.push(Math.acos(cosAngle));
    }
  }

  return angles;
}

function polygonArea(pts: Point[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area / 2);
}