import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

interface InlineTextInputProps {
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

const COLORS = ['#1a1a2e', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];
const FONT_SIZES = [12, 14, 16, 20, 24, 32];

export function InlineTextInput({ visible, position, onClose }: InlineTextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [color, setColor] = useState('#1a1a2e');
  const [fontSize, setFontSize] = useState(16);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const { addNode, saveHistory } = useStore();

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setText('');
      setColor('#1a1a2e');
      setFontSize(16);
      setDirection('horizontal');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (text.trim()) {
      const canvasEl = document.getElementById('mainCanvas');
      if (!canvasEl) return;

      const canvas = useStore.getState().canvas;
      const canvasRect = canvasEl.getBoundingClientRect();

      const charCount = text.trim().length;
      const w = direction === 'horizontal'
        ? Math.max(50, charCount * fontSize * 0.6)
        : fontSize + 8;
      const h = direction === 'horizontal'
        ? fontSize + 8
        : charCount * fontSize * 0.8;

      const canvasX = (position.x - canvasRect.left - canvas.panX) / canvas.zoom;
      const canvasY = (position.y - canvasRect.top - canvas.panY) / canvas.zoom;

      addNode({
        type: 'idea',
        shape: 'text',
        x: canvasX,
        y: canvasY,
        w,
        h,
        text: text.trim(),
        bg: 'transparent',
        border: 'transparent',
        fontSize: fontSize,
        textColor: color,
        direction: direction,
      });
      saveHistory();
    }
    setText('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setText('');
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 200,
        background: 'var(--panel-bg)',
        border: '2px solid #6366f1',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        minWidth: '280px',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入文字..."
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: `${fontSize}px`,
          color: color,
          background: 'var(--bg)',
          outline: 'none',
          marginBottom: '12px',
          writingMode: direction === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
        }}
      />

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>颜色</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: color === c ? '3px solid #6366f1' : '1px solid var(--border)',
                background: c,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>字号</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: fontSize === size ? '2px solid #6366f1' : '1px solid var(--border)',
                background: fontSize === size ? 'var(--accent-light)' : 'var(--bg)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>方向</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setDirection('horizontal')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: direction === 'horizontal' ? '2px solid #6366f1' : '1px solid var(--border)',
              background: direction === 'horizontal' ? 'var(--accent-light)' : 'var(--bg)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            横向
          </button>
          <button
            onClick={() => setDirection('vertical')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: direction === 'vertical' ? '2px solid #6366f1' : '1px solid var(--border)',
              background: direction === 'vertical' ? 'var(--accent-light)' : 'var(--bg)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            纵向
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => { setText(''); onClose(); }}
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--bg)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: '8px',
            background: 'var(--accent)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          确认
        </button>
      </div>
    </div>
  );
}