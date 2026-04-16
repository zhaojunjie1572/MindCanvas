import { useState, useRef, useEffect } from 'react';
import { v4 as uuid } from 'uuid';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatWindowProps {
  onClose: () => void;
}

export function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const resizeRef = useRef<{ width: number; height: number; x: number; y: number } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 370, y: 100 });
  const [size, setSize] = useState({ width: 350, height: 500 });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-input-area')) return;
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    dragRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeRef.current = {
      width: size.width,
      height: size.height,
      x: e.clientX,
      y: e.clientY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current) {
      setPosition({
        x: e.clientX - dragRef.current.x,
        y: e.clientY - dragRef.current.y,
      });
    }
    if (resizeRef.current) {
      const dx = e.clientX - resizeRef.current.x;
      const dy = e.clientY - resizeRef.current.y;
      setSize({
        width: Math.max(280, resizeRef.current.width + dx),
        height: Math.max(350, resizeRef.current.height + dy),
      });
    }
  };

  const handleMouseUp = () => {
    dragRef.current = null;
    resizeRef.current = null;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const configStr = localStorage.getItem('mindcanvas_api');
    if (!configStr) {
      alert('请先在设置中配置 API');
      return;
    }

    const userMessage: ChatMessage = {
      id: uuid(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const config = JSON.parse(configStr);
      const historyMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      historyMessages.push({ role: 'user', content: userMessage.content });

      const resp = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + config.key,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 1000,
          messages: historyMessages,
        }),
      });

      if (!resp.ok) throw new Error('API错误');
      const data = await resp.json();
      const content = data.choices[0].message.content;

      const assistantMessage: ChatMessage = {
        id: uuid(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage: ChatMessage = {
        id: uuid(),
        role: 'assistant',
        content: '抱歉，发生了错误。请检查 API 配置是否正确。',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
    setIsLoading(false);
  };

  return (
    <div
      ref={windowRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        background: 'var(--panel-bg)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        border: '1px solid var(--border)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: dragRef.current ? 'grabbing' : 'default',
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: '12px 16px',
          background: 'var(--accent)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <span>AI 对话助手</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0 4px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              color: 'var(--text-secondary)',
              textAlign: 'center',
              padding: '40px 20px',
              fontSize: '13px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>&#x1F4AC;</div>
            有什么我可以帮助你的吗？
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '12px',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                fontSize: '13px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
            AI 思考中...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div
        className="chat-input-area"
        style={{
          padding: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="输入问题..."
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          &#x27A4;
        </button>
      </div>

      <div
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '24px',
          height: '24px',
          cursor: 'se-resize',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" style={{ opacity: 0.4, color: 'var(--text-secondary)' }}>
          <path d="M14 2 L14 14 L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
    </div>
  );
}
