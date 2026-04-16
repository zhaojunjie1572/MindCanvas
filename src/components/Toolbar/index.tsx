import { useStore } from '../../store';
import { Tool } from '../../types';
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Diamond,
  Triangle,
  AlignLeft,
  Pencil,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Undo2,
  Redo2,
  Settings,
  Bot,
  Palette,
  LayoutGrid,
  FolderOpen,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minus,
} from 'lucide-react';

const PentagonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 22,9 18,21 6,21 2,9" />
  </svg>
);

const HexagonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
  </svg>
);

const Star5Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
  </svg>
);

const Star6Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 14,9 21,9 16,14 18,21 12,17 6,21 8,14 3,9 10,9" />
  </svg>
);

const PEN_COLORS = [
  '#1a1a2e', '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#ffffff',
];

interface ToolButtonProps {
  tool: Tool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

function ToolButton({ tool, icon, label, shortcut }: ToolButtonProps) {
  const { tool: currentTool, setTool } = useStore();
  const isActive = currentTool === tool;

  return (
    <button
      className={`tool-btn ${isActive ? 'active' : ''}`}
      onClick={() => setTool(tool)}
    >
      {icon}
      <span className="tooltip">
        {label} {shortcut && `(${shortcut})`}
      </span>
    </button>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ActionButton({ icon, label, onClick, disabled }: ActionButtonProps) {
  return (
    <button className="tool-btn" onClick={onClick} disabled={disabled}>
      {icon}
      <span className="tooltip">{label}</span>
    </button>
  );
}

export function Toolbar() {
  const { theme, setTheme, setShowSidebar, showSidebar, undo, redo, historyIndex, history, zoomIn, zoomOut, zoomFit, canvas, tool, penColor, setPenColor } = useStore();

  const toggleSidebar = (name: string) => {
    setShowSidebar(showSidebar === name ? null : name);
  };

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'warm')[] = ['light', 'dark', 'warm'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
    document.body.setAttribute('data-theme', themes[nextIndex]);
  };

  const isPenTool = tool === 'pen';

  return (
    <div className="toolbar">
      <div className="toolbar-brand">
        <span className="logo">&#x1F3A8;</span>
        <span>MindCanvas</span>
      </div>

      <div className="toolbar-divider" />

      <div className="tool-group">
        <ToolButton tool="select" icon={<MousePointer2 size={18} />} label="选择" shortcut="V" />
        <ToolButton tool="hand" icon={<Hand size={18} />} label="移动" shortcut="H" />
      </div>

      <div className="toolbar-divider" />

      <div className="tool-group">
        <ToolButton tool="rect" icon={<Square size={18} />} label="矩形" shortcut="R" />
        <ToolButton tool="circle" icon={<Circle size={18} />} label="圆形" shortcut="C" />
        <ToolButton tool="diamond" icon={<Diamond size={18} />} label="菱形" shortcut="D" />
        <ToolButton tool="triangle" icon={<Triangle size={18} />} label="三角形" shortcut="T" />
        <ToolButton tool="pentagon" icon={<PentagonIcon />} label="五边形" shortcut="G" />
        <ToolButton tool="hexagon" icon={<HexagonIcon />} label="六边形" shortcut="G" />
        <ToolButton tool="star5" icon={<Star5Icon />} label="五角星" shortcut="G" />
        <ToolButton tool="star6" icon={<Star6Icon />} label="六芒星" shortcut="G" />
      </div>

      <div className="toolbar-divider" />

      <div className="tool-group">
        <ToolButton tool="arrowUp" icon={<ArrowUp size={18} />} label="上箭头" shortcut="A" />
        <ToolButton tool="arrowDown" icon={<ArrowDown size={18} />} label="下箭头" shortcut="A" />
        <ToolButton tool="arrowLeft" icon={<ArrowLeft size={18} />} label="左箭头" shortcut="A" />
        <ToolButton tool="arrowRight" icon={<ArrowRight size={18} />} label="右箭头" shortcut="A" />
        <ToolButton tool="line" icon={<Minus size={18} />} label="直线" shortcut="L" />
        <ToolButton tool="textInput" icon={<AlignLeft size={18} />} label="文本" shortcut="X" />
      </div>

      <div className="toolbar-divider" />

      <div className="tool-group">
        <ToolButton tool="connect" icon={<ArrowRight size={18} />} label="连线" shortcut="L" />
        <ToolButton tool="pen" icon={<Pencil size={18} />} label="画笔" shortcut="P" />
      </div>

      {isPenTool && (
        <>
          <div className="toolbar-divider" />
          <div className="tool-group pen-colors">
            {PEN_COLORS.map((color) => (
              <button
                key={color}
                className={`color-btn ${penColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setPenColor(color)}
              />
            ))}
          </div>
        </>
      )}

      <div className="toolbar-spacer" />

      <div className="tool-group">
        <ActionButton icon={<Undo2 size={18} />} label="撤销 (Ctrl+Z)" onClick={undo} disabled={historyIndex <= 0} />
        <ActionButton icon={<Redo2 size={18} />} label="重做 (Ctrl+Y)" onClick={redo} disabled={historyIndex >= history.length - 1} />
      </div>

      <div className="toolbar-divider" />

      <div className="tool-group">
        <ActionButton icon={<Settings size={18} />} label="设置" onClick={() => toggleSidebar('settings')} />
        <ActionButton icon={<Bot size={18} />} label="AI 助手" onClick={() => toggleSidebar('ai')} />
        <ActionButton icon={<Palette size={18} />} label="样式" onClick={() => toggleSidebar('style')} />
        <ActionButton icon={<LayoutGrid size={18} />} label="自动布局" onClick={() => {}} />
        <ActionButton icon={<FolderOpen size={18} />} label="文档" onClick={() => toggleSidebar('docs')} />
        <ActionButton
          icon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          label="主题"
          onClick={toggleTheme}
        />
      </div>

      <div className="zoom-controls" style={{ position: 'static', marginLeft: '16px' }}>
        <button className="zoom-btn" onClick={zoomOut}>
          <ZoomOut size={16} />
        </button>
        <span className="zoom-level">{Math.round(canvas.zoom * 100)}%</span>
        <button className="zoom-btn" onClick={zoomIn}>
          <ZoomIn size={16} />
        </button>
        <button className="zoom-btn" onClick={zoomFit}>
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}