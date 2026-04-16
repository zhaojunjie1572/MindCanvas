import { useStore } from '../../store';
import { NodeType } from '../../types';

const NODE_COLORS = [
  '#ffffff',
  '#fef3c7',
  '#d1fae5',
  '#dbeafe',
  '#fce7f3',
  '#e9d5ff',
  '#fef9c3',
  '#ffedd5',
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
];

const NODE_TYPES: { type: NodeType; name: string; icon: string; preview: string }[] = [
  { type: 'root', name: '中心', icon: '&#x1F3E0;', preview: '#6366f1' },
  { type: 'idea', name: '想法', icon: '&#x1F4A1;', preview: '#eef2ff' },
  { type: 'action', name: '行动', icon: '&#x1F3AF;', preview: '#d1fae5' },
  { type: 'note', name: '笔记', icon: '&#x1F4DD;', preview: '#fef3c7' },
];

export function StyleSidebar() {
  const { selectedId, nodes, updateNode, deleteNode, duplicateNode } = useStore();
  const selectedNode = nodes.find((n) => n.id === selectedId);

  if (!selectedNode) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
        <p style={{ fontSize: '14px' }}>请先选择一个节点</p>
      </div>
    );
  }

  const handleTypeChange = (type: NodeType) => {
    const colors = {
      root: { bg: '#6366f1', border: '#6366f1' },
      idea: { bg: '#eef2ff', border: '#6366f1' },
      action: { bg: '#d1fae5', border: '#10b981' },
      note: { bg: '#fef3c7', border: '#f59e0b' },
    };
    updateNode(selectedNode.id, { type, ...colors[type] });
  };

  const handleColorChange = (bg: string) => {
    updateNode(selectedNode.id, { bg });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      updateNode(selectedNode.id, { image: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    updateNode(selectedNode.id, { image: undefined });
  };

  const handleDelete = () => {
    deleteNode(selectedNode.id);
  };

  const handleDuplicate = () => {
    duplicateNode(selectedNode.id);
  };

  return (
    <>
      <div className="section">
        <div className="section-title">节点类型</div>
        <div className="node-type-grid">
          {NODE_TYPES.map((nt) => (
            <div
              key={nt.type}
              className={`node-type-card ${selectedNode.type === nt.type ? 'active' : ''}`}
              onClick={() => handleTypeChange(nt.type)}
            >
              <div className="preview" style={{ background: nt.preview }} />
              <div className="icon">{nt.icon}</div>
              <div className="name">{nt.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">背景颜色</div>
        <div className="color-grid">
          {NODE_COLORS.map((color) => (
            <div
              key={color}
              className={`color-swatch ${selectedNode.bg === color ? 'active' : ''}`}
              style={{ background: color, border: color === '#ffffff' ? '1px solid var(--border)' : 'none' }}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">节点图片</div>
        {selectedNode.image ? (
          <div style={{ position: 'relative' }}>
            <img
              src={selectedNode.image}
              alt="节点图片"
              style={{
                width: '100%',
                maxHeight: '150px',
                objectFit: 'contain',
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            />
            <button
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '8px' }}
              onClick={handleRemoveImage}
            >
              &#x1F5D1; 移除图片
            </button>
          </div>
        ) : (
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            &#x1F4C4; 上传图片
          </label>
        )}
      </div>

      <div className="section">
        <div className="section-title">文本编辑</div>
        <input
          type="text"
          className="input"
          value={selectedNode.text}
          onChange={(e) => updateNode(selectedNode.id, { text: e.target.value })}
          placeholder="输入节点文字..."
        />
      </div>

      <div className="section">
        <div className="section-title">操作</div>
        <button className="btn btn-secondary" onClick={handleDuplicate}>
          &#x1F4CB; 复制节点
        </button>
        <button className="btn btn-danger" style={{ marginTop: '8px' }} onClick={handleDelete}>
          &#x1F5D1; 删除节点
        </button>
      </div>
    </>
  );
}