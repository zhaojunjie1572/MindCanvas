import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../store';
import { SettingsSidebar } from './SettingsSidebar';
import { AISidebar } from './AISidebar';
import { StyleSidebar } from './StyleSidebar';
import { DocsSidebar } from './DocsSidebar';
import { ChatWindow } from '../ChatWindow';

export function SidebarContainer() {
  const { showSidebar, setShowSidebar } = useStore();
  const [chatOpen, setChatOpen] = useState(false);

  const closeSidebar = () => setShowSidebar(null);

  return (
    <>
      <div id="settingsSidebar" className={`sidebar ${showSidebar === 'settings' ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">&#x2699;&#xFE0F; 设置</div>
          <button className="sidebar-close" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>
        <SettingsSidebar />
      </div>

      <div id="aiSidebar" className={`sidebar ${showSidebar === 'ai' ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">&#x1F916; AI 助手</div>
          <button className="sidebar-close" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>
        <AISidebar onOpenChat={() => setChatOpen(true)} />
      </div>

      <div id="styleSidebar" className={`sidebar ${showSidebar === 'style' ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">&#x1F3A8; 节点样式</div>
          <button className="sidebar-close" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>
        <StyleSidebar />
      </div>

      <div id="docsSidebar" className={`sidebar ${showSidebar === 'docs' ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">&#x1F4C1; 我的文档</div>
          <button className="sidebar-close" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>
        <DocsSidebar />
      </div>

      {chatOpen && <ChatWindow onClose={() => setChatOpen(false)} />}
    </>
  );
}