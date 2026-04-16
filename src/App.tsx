import { useRef, useEffect, useState } from 'react';
import { useStore } from './store';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { SidebarContainer } from './components/Sidebar';
import { NodeEditor } from './components/NodeEditor';
import { InlineTextInput } from './components/InlineTextInput';
import { Tool, MindNode } from './types';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    setTool,
    selectedId,
    deleteNode,
    undo,
    redo,
    setShowSidebar,
    editingNodeId,
    nodes,
    addNode,
    addConnection,
    setSelected,
  } = useStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);

  const handleShowTextInput = (e: MouseEvent) => {
    if (useStore.getState().tool === 'textInput') {
      e.preventDefault();
      setTextInputPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleTextInputClose = () => {
    setTextInputPos(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const toolMap: Record<string, Tool> = {
        v: 'select',
        h: 'hand',
        r: 'rect',
        c: 'circle',
        d: 'diamond',
        t: 'triangle',
        x: 'textInput',
        l: 'connect',
        p: 'pen',
      };

      if (toolMap[e.key.toLowerCase()]) {
        setTool(toolMap[e.key.toLowerCase()]);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !editingNodeId) {
          deleteNode(selectedId);
        }
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        useStore.setState({ selectedId: null, editingNodeId: null });
        setShowSidebar(null);
        setContextMenu(null);
        setTextInputPos(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, selectedId, editingNodeId, deleteNode, undo, redo, setShowSidebar]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (selectedId) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedId);

  const handleCopy = () => {
    if (selectedNode) {
      localStorage.setItem('mindcanvas_clipboard', JSON.stringify(selectedNode));
    }
    setContextMenu(null);
  };

  const handlePaste = () => {
    const clipboard = localStorage.getItem('mindcanvas_clipboard');
    if (clipboard) {
      try {
        const node: MindNode = JSON.parse(clipboard);
        const newId = Date.now().toString();
        addNode({
          type: node.type,
          shape: node.shape,
          x: node.x + 30,
          y: node.y + 30,
          w: node.w,
          h: node.h,
          text: node.text,
          bg: node.bg,
          border: node.border,
          fontSize: node.fontSize,
        });
        setSelected(newId);
      } catch (err) {
        console.error(err);
      }
    }
    setContextMenu(null);
  };

  const handleDuplicate = () => {
    if (selectedNode) {
      addNode({
        type: selectedNode.type,
        shape: selectedNode.shape,
        x: selectedNode.x + 30,
        y: selectedNode.y + 30,
        w: selectedNode.w,
        h: selectedNode.h,
        text: selectedNode.text,
        bg: selectedNode.bg,
        border: selectedNode.border,
        fontSize: selectedNode.fontSize,
      });
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (selectedId) {
      deleteNode(selectedId);
    }
    setContextMenu(null);
  };

  const handleAddChild = () => {
    if (selectedNode) {
      const newId = Date.now().toString();
      addNode({
        type: 'idea',
        shape: 'rect',
        x: selectedNode.x + selectedNode.w + 50,
        y: selectedNode.y + 20,
        w: 120,
        h: 50,
        text: '新节点',
        bg: '#eef2ff',
        border: '#6366f1',
      });
      addConnection(selectedNode.id, newId);
      setSelected(newId);
    }
    setContextMenu(null);
  };

  return (
    <>
      <Toolbar />
      <div onContextMenu={handleContextMenu}>
        <Canvas canvasRef={canvasRef} onShowTextInput={handleShowTextInput} />
      </div>
      <SidebarContainer />
      <NodeEditor />
      <InlineTextInput
        visible={textInputPos !== null}
        position={textInputPos || { x: 0, y: 0 }}
        onClose={handleTextInputClose}
      />

      {contextMenu && selectedNode && (
        <div
          className="context-menu show"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 200,
          }}
        >
          <div className="context-item" onClick={handleCopy}>
            &#x1F4CB; 复制
          </div>
          <div className="context-item" onClick={handlePaste}>
            &#x1F4DD; 粘贴
          </div>
          <div className="context-divider" />
          <div className="context-item" onClick={handleAddChild}>
            &#x2795; 添加子节点
          </div>
          <div className="context-divider" />
          <div className="context-item" onClick={handleDuplicate}>
            &#x1F4CB; 复制节点
          </div>
          <div className="context-item danger" onClick={handleDelete}>
            &#x1F5D1; 删除
          </div>
        </div>
      )}

      <div className="shortcuts-hint">
        <span>
          <kbd>V</kbd>选择
        </span>
        <span>
          <kbd>H</kbd>移动
        </span>
        <span>
          <kbd>R</kbd>矩形
        </span>
        <span>
          <kbd>C</kbd>圆形
        </span>
        <span>
          <kbd>T</kbd>三角
        </span>
        <span>
          <kbd>P</kbd>画笔
        </span>
        <span>
          <kbd>Del</kbd>删除
        </span>
      </div>
    </>
  );
}

export default App;