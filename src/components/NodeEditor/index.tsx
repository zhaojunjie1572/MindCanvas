import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';

export function NodeEditor() {
  const { editingNodeId, nodes, updateNode, setEditingNode } = useStore();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingNodeId) {
      const node = nodes.find((n) => n.id === editingNodeId);
      if (node) {
        setText(node.text);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  }, [editingNodeId, nodes]);

  if (!editingNodeId) return null;

  const node = nodes.find((n) => n.id === editingNodeId);
  if (!node) return null;

  const handleSave = () => {
    updateNode(editingNodeId, { text });
    setEditingNode(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingNode(null);
    }
  };

  const canvasRect = document.getElementById('mainCanvas')?.getBoundingClientRect();
  if (!canvasRect) return null;

  const zoom = useStore.getState().canvas.zoom;
  const panX = useStore.getState().canvas.panX;
  const panY = useStore.getState().canvas.panY;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: canvasRect.top + panY + node.y * zoom + node.h * zoom + 10,
    left: canvasRect.left + panX + node.x * zoom,
    zIndex: 150,
  };

  return (
    <div className="node-editor" style={style}>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder="输入文字..."
        style={{ width: node.w * zoom }}
      />
    </div>
  );
}