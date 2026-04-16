import { useEffect, useState } from 'react';
import { useStore } from '../../store';

interface SavedDoc {
  name: string;
  data: string;
  date: number;
}

export function DocsSidebar() {
  const { nodes, connections, penPaths, loadData, clearCanvas, setShowSidebar } = useStore();
  const [docs, setDocs] = useState<SavedDoc[]>([]);

  useEffect(() => {
    loadDocList();
  }, []);

  const loadDocList = () => {
    try {
      const saved = localStorage.getItem('mindcanvas_docs');
      setDocs(saved ? JSON.parse(saved) : []);
    } catch {
      setDocs([]);
    }
  };

  const saveDoc = () => {
    const name = prompt('文档名称：', '我的导图 ' + new Date().toLocaleDateString());
    if (!name) return;

    const savedDocs = JSON.parse(localStorage.getItem('mindcanvas_docs') || '[]');
    savedDocs.unshift({
      name,
      data: JSON.stringify({ nodes, connections, penPaths }),
      date: Date.now(),
    });
    localStorage.setItem('mindcanvas_docs', JSON.stringify(savedDocs.slice(0, 20)));
    loadDocList();
    alert('已保存');
  };

  const loadDoc = (index: number) => {
    const doc = docs[index];
    if (!doc) return;

    try {
      const data = JSON.parse(doc.data);
      loadData(data.nodes || [], data.connections || [], data.penPaths || []);
      setShowSidebar(null);
    } catch {
      alert('加载失败');
    }
  };

  const deleteDoc = (index: number) => {
    if (!confirm('确定删除？')) return;
    const savedDocs = JSON.parse(localStorage.getItem('mindcanvas_docs') || '[]');
    savedDocs.splice(index, 1);
    localStorage.setItem('mindcanvas_docs', JSON.stringify(savedDocs));
    loadDocList();
  };

  const exportJSON = () => {
    const data = JSON.stringify({ nodes, connections, penPaths }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindcanvas_' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    const link = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = link;
    a.download = 'mindcanvas_' + Date.now() + '.png';
    a.click();
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        loadData(data.nodes || [], data.connections || [], data.penPaths || []);
        setShowSidebar(null);
        alert('导入成功');
      } catch {
        alert('导入失败');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <button className="btn btn-primary" onClick={saveDoc}>
        &#x1F4BE; 保存当前
      </button>

      <div className="section">
        <div className="section-title">已有文档</div>
        <div className="doc-list">
          {docs.length === 0 ? (
            <div style={{ color: '#999', fontSize: '12px', textAlign: 'center', padding: '20px' }}>暂无文档</div>
          ) : (
            docs.map((doc, i) => (
              <div key={i} className="doc-item" onClick={() => loadDoc(i)}>
                <div>
                  <div className="name">{doc.name}</div>
                  <div className="date">{new Date(doc.date).toLocaleDateString()}</div>
                </div>
                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteDoc(i); }}>
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-title">导入导出</div>
        <button className="btn btn-secondary" onClick={exportJSON}>
          &#x1F4E4; 导出 JSON
        </button>
        <button className="btn btn-secondary" style={{ marginTop: '8px' }} onClick={exportPNG}>
          &#x1F5BC; 导出 PNG
        </button>
        <button className="btn btn-secondary" style={{ marginTop: '8px' }} onClick={() => document.getElementById('importFile')?.click()}>
          &#x1F4E5; 导入
        </button>
        <input type="file" id="importFile" accept=".json" style={{ display: 'none' }} onChange={importJSON} />
      </div>

      <div className="section">
        <div className="section-title">清空</div>
        <button className="btn btn-danger" onClick={() => { if (confirm('确定清空画布？')) clearCanvas(); }}>
          &#x1F5D1; 清空画布
        </button>
      </div>
    </>
  );
}