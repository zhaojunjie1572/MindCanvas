import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

interface FloatingTextInputProps {
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export function FloatingTextInput({ visible, position, onClose }: FloatingTextInputProps) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(20);
  const [bgColor, setBgColor] = useState('#ffffff');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { addNode, saveHistory } = useStore();

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setText('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (text.trim()) {
      const canvasEl = document.getElementById('mainCanvas');
      if (!canvasEl) return;

      const canvas = useStore.getState().canvas;
      const canvasRect = canvasEl.getBoundingClientRect();
      const actualZoom = canvas.zoom || 1;

      const canvasX = (position.x - canvasRect.left - canvas.panX) / actualZoom;
      const canvasY = (position.y - canvasRect.top - canvas.panY) / actualZoom;

      addNode({
        type: 'idea',
        shape: 'rect',
        x: canvasX,
        y: canvasY,
        w: Math.max(100, text.length * fontSize * 0.6),
        h: Math.max(40, fontSize * 2),
        text: text.trim(),
        bg: bgColor,
        border: '#e5e7eb',
        fontSize: Math.round(fontSize / actualZoom),
      });
      saveHistory();
    }
    setText('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        border: '1px solid var(--border)',
        minWidth: '200px',
        maxWidth: '400px',
      }}
    >
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入文字，按 Enter 确认..."
        style={{
          width: '100%',
          minHeight: '60px',
          padding: '8px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: `${fontSize}px`,
          background: bgColor,
          color: 'var(--text)',
          resize: 'none',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>字号:</label>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          style={{
            padding: '4px 8px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '12px',
          }}
        >
          <option value={12}>12px</option>
          <option value={14}>14px</option>
          <option value={16}>16px</option>
          <option value={20}>20px</option>
          <option value={24}>24px</option>
          <option value={32}>32px</option>
        </select>

        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>背景:</label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          style={{ width: '32px', height: '32px', border: 'none', cursor: 'pointer' }}
        />

        <div style={{ flex: 1 }} />

        <button
          onClick={() => { setText(''); onClose(); }}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--bg)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            background: 'var(--accent)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          确认
        </button>
      </div>
    </div>
  );
}