import { useState } from 'react';
import { useStore } from '../../store';
import { v4 as uuid } from 'uuid';

const TEMPLATES = {
  project: {
    name: '项目管理',
    icon: '&#x1F4CB;',
    nodes: [
      { id: '1', type: 'root' as const, shape: 'rect' as const, x: 300, y: 200, w: 160, h: 70, text: '&#x1F4CB; 项目管理', bg: '#6366f1', border: '#6366f1' },
      { id: '2', type: 'idea' as const, shape: 'rect' as const, x: 550, y: 100, w: 120, h: 50, text: '&#x1F4CC; 需求', bg: '#eef2ff', border: '#6366f1' },
      { id: '3', type: 'idea' as const, shape: 'rect' as const, x: 550, y: 200, w: 120, h: 50, text: '&#x1F3AF; 设计', bg: '#eef2ff', border: '#6366f1' },
      { id: '4', type: 'idea' as const, shape: 'rect' as const, x: 550, y: 300, w: 120, h: 50, text: '&#x1F4BB; 开发', bg: '#eef2ff', border: '#6366f1' },
    ],
    connections: [
      { id: 'c1', from: '1', to: '2' },
      { id: 'c2', from: '1', to: '3' },
      { id: 'c3', from: '1', to: '4' },
    ],
  },
  business: {
    name: '商业分析',
    icon: '&#x1F4BC;',
    nodes: [
      { id: '1', type: 'root' as const, shape: 'rect' as const, x: 300, y: 200, w: 160, h: 70, text: '&#x1F4BC; 商业分析', bg: '#6366f1', border: '#6366f1' },
      { id: '2', type: 'idea' as const, shape: 'rect' as const, x: 550, y: 100, w: 120, h: 50, text: '&#x1F3AF; 市场定位', bg: '#eef2ff', border: '#6366f1' },
      { id: '3', type: 'idea' as const, shape: 'rect' as const, x: 550, y: 200, w: 120, h: 50, text: '&#x1F465; 用户画像', bg: '#eef2ff', border: '#6366f1' },
      { id: '4', type: 'idea' as const, shape: 'rect' as const, x: 550, y: 300, w: 120, h: 50, text: '&#x1F4B0; 盈利模式', bg: '#eef2ff', border: '#6366f1' },
    ],
    connections: [
      { id: 'c1', from: '1', to: '2' },
      { id: 'c2', from: '1', to: '3' },
      { id: 'c3', from: '1', to: '4' },
    ],
  },
  learning: {
    name: '学习计划',
    icon: '&#x1F4DA;',
    nodes: [
      { id: '1', type: 'root' as const, shape: 'rect' as const, x: 300, y: 200, w: 160, h: 70, text: '&#x1F4DA; 学习计划', bg: '#6366f1', border: '#6366f1' },
      { id: '2', type: 'idea' as const, shape: 'rect' as const, x: 550, y: 100, w: 120, h: 50, text: '&#x1F4D6; 理论', bg: '#eef2ff', border: '#6366f1' },
      { id: '3', type: 'idea' as const, shape: 'rect' as const, x: 550, y: 200, w: 120, h: 50, text: '&#x1F4BB; 实战', bg: '#eef2ff', border: '#6366f1' },
      { id: '4', type: 'idea' as const, shape: 'rect' as const, x: 550, y: 300, w: 120, h: 50, text: '&#x1F91D; 交流', bg: '#eef2ff', border: '#6366f1' },
    ],
    connections: [
      { id: 'c1', from: '1', to: '2' },
      { id: 'c2', from: '1', to: '3' },
      { id: 'c3', from: '1', to: '4' },
    ],
  },
  idea: {
    name: '头脑风暴',
    icon: '&#x1F4A1;',
    nodes: [
      { id: '1', type: 'root' as const, shape: 'rect' as const, x: 300, y: 200, w: 160, h: 70, text: '&#x1F4A1; 头脑风暴', bg: '#6366f1', border: '#6366f1' },
      { id: '2', type: 'note' as const, shape: 'rect' as const, x: 550, y: 100, w: 120, h: 50, text: '想法 A', bg: '#fef3c7', border: '#f59e0b' },
      { id: '3', type: 'note' as const, shape: 'rect' as const, x: 550, y: 200, w: 120, h: 50, text: '想法 B', bg: '#fef3c7', border: '#f59e0b' },
      { id: '4', type: 'note' as const, shape: 'rect' as const, x: 550, y: 300, w: 120, h: 50, text: '想法 C', bg: '#fef3c7', border: '#f59e0b' },
    ],
    connections: [
      { id: 'c1', from: '1', to: '2' },
      { id: 'c2', from: '1', to: '3' },
      { id: 'c3', from: '1', to: '4' },
    ],
  },
};

interface AISidebarProps {
  onOpenChat: () => void;
}

export function AISidebar({ onOpenChat }: AISidebarProps) {
  const store = useStore();
  const [prompt, setPrompt] = useState('');
  const [expandPrompt, setExpandPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplate = (type: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[type];
    store.loadData(
      template.nodes.map((n) => ({ ...n, id: uuid() })),
      template.connections.map((c) => ({ ...c, id: uuid() }))
    );
    store.setShowSidebar(null);
  };

  const generateWithAI = async () => {
    if (!prompt.trim()) return;

    const configStr = localStorage.getItem('mindcanvas_api');
    if (!configStr) {
      alert('请先在设置中配置 API');
      return;
    }

    setIsLoading(true);
    try {
      const config = JSON.parse(configStr);
      const resp = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + config.key,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 2000,
          messages: [
            { role: 'system', content: '你是思维导图助手。根据用户想法生成JSON格式思维导图：{"nodes":[{"text":"中心","children":[{"text":"分支1","children":[]}]}]}。只返回JSON。' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!resp.ok) throw new Error('API错误');
      const data = await resp.json();
      const text = data.choices[0].message.content;
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');

      const newNodes: any[] = [];
      const newConnections: any[] = [];
      let id = 1;

      const process = (nodeData: any, parentId: string | null = null) => {
        const nodeId = String(id++);
        const node = {
          id: nodeId,
          type: parentId ? 'idea' : 'root',
          shape: 'rect' as const,
          x: 0,
          y: 0,
          w: 140,
          h: 55,
          text: nodeData.text,
          bg: parentId ? '#eef2ff' : '#6366f1',
          border: parentId ? '#6366f1' : '#6366f1',
        };
        newNodes.push(node);
        if (parentId) {
          newConnections.push({ id: uuid(), from: parentId, to: nodeId });
        }
        if (nodeData.children) {
          nodeData.children.forEach((child: any) => process(child, nodeId));
        }
      };

      if (json.nodes && json.nodes[0]) {
        process(json.nodes[0]);
        store.loadData(newNodes, newConnections);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const expandWithAI = async () => {
    if (!store.selectedId || !expandPrompt.trim()) return;

    const configStr = localStorage.getItem('mindcanvas_api');
    if (!configStr) {
      alert('请先在设置中配置 API');
      return;
    }

    setIsLoading(true);
    try {
      const config = JSON.parse(configStr);
      const resp = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + config.key,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 500,
          messages: [{ role: 'user', content: `以"${expandPrompt}"为主题，写3个扩展点，每个10字以内，用|分隔：` }],
        }),
      });

      const data = await resp.json();
      const text = data.choices[0].message.content;
      const points = text.split('|').map((s: string) => s.trim()).filter(Boolean);

      const selectedNode = store.nodes.find((n) => n.id === store.selectedId);
      if (selectedNode) {
        points.forEach((point: string, i: number) => {
          const newId = uuid();
          store.addNode({
            type: 'idea',
            shape: 'rect',
            x: selectedNode.x + 180,
            y: selectedNode.y + i * 70,
            w: 120,
            h: 50,
            text: point,
            bg: '#eef2ff',
            border: '#6366f1',
          });
          store.addConnection(store.selectedId!, newId);
        });
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
    setExpandPrompt('');
  };

  return (
    <>
      <div className="section">
        <div className="section-title">描述你的想法</div>
        <textarea
          className="input"
          id="aiPrompt"
          placeholder="例如：我想做一个个人品牌网站，包含首页、关于、作品集、联系页面..."
          style={{ minHeight: '100px' }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={generateWithAI} disabled={isLoading}>
          &#x2728; 生成思维导图
        </button>
      </div>

      <div className="section">
        <div className="section-title">快速模板</div>
        <div className="template-grid">
          {(Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>).map((type) => (
            <div key={type} className="template-card" onClick={() => loadTemplate(type)}>
              <div className="icon">{TEMPLATES[type].icon}</div>
              <div className="name">{TEMPLATES[type].name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">扩展选中节点</div>
        <textarea
          className="input"
          id="expandPrompt"
          placeholder="输入关键词扩展内容..."
          style={{ minHeight: '60px' }}
          value={expandPrompt}
          onChange={(e) => setExpandPrompt(e.target.value)}
        />
        <button className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={expandWithAI} disabled={isLoading || !store.selectedId}>
          &#x1F4A1; 扩展内容
        </button>
      </div>

      <div className="section">
        <div className="section-title">AI 对话助手</div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px' }}
          onClick={onOpenChat}
        >
          &#x1F4AC; 打开聊天窗口
        </button>
      </div>
    </>
  );
}
