import { useState, useEffect } from 'react';
import { useStore } from '../../store';

const GIST_FILENAME = 'mindcanvas-data.json';

interface SyncState {
  status: 'idle' | 'syncing' | 'success' | 'error';
  message: string;
  lastSync: number | null;
  gistId: string | null;
}

export function GitHubSync() {
  const [token, setToken] = useState('');
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    message: '',
    lastSync: null,
    gistId: null,
  });
  const store = useStore();

  useEffect(() => {
    const savedToken = localStorage.getItem('mindcanvas_github_token');
    const savedGistId = localStorage.getItem('mindcanvas_gist_id');
    const savedLastSync = localStorage.getItem('mindcanvas_last_sync');

    if (savedToken) setToken(savedToken);
    if (savedGistId) {
      setSyncState((prev) => ({
        ...prev,
        gistId: savedGistId,
        lastSync: savedLastSync ? parseInt(savedLastSync) : null,
      }));
    }
  }, []);

  const saveToLocal = (data: { gistId: string }) => {
    localStorage.setItem('mindcanvas_github_token', token);
    if (data.gistId) {
      localStorage.setItem('mindcanvas_gist_id', data.gistId);
      setSyncState((prev) => ({ ...prev, gistId: data.gistId }));
    }
    const now = Date.now();
    localStorage.setItem('mindcanvas_last_sync', now.toString());
    setSyncState((prev) => ({
      ...prev,
      lastSync: now,
      status: 'success',
      message: '同步成功',
    }));
  };

  const syncToGist = async () => {
    if (!token) {
      setSyncState({ status: 'error', message: '请输入 GitHub Token', lastSync: null, gistId: null });
      return;
    }

    setSyncState((prev) => ({ ...prev, status: 'syncing', message: '同步中...' }));

    try {
      const data = {
        nodes: store.nodes,
        connections: store.connections,
        penPaths: store.penPaths,
        canvas: store.canvas,
        theme: store.theme,
        updatedAt: Date.now(),
      };

      const gistId = localStorage.getItem('mindcanvas_gist_id');
      const gistContent = JSON.stringify(data, null, 2);

      let response;
      if (gistId) {
        response = await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: {
              [GIST_FILENAME]: {
                content: gistContent,
              },
            },
          }),
        });
      } else {
        response = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: 'MindCanvas Data Sync',
            public: false,
            files: {
              [GIST_FILENAME]: {
                content: gistContent,
              },
            },
          }),
        });
      }

      if (response.ok) {
        const result = await response.json();
        saveToLocal({ gistId: result.id });
      } else if (response.status === 401) {
        setSyncState({ status: 'error', message: 'Token 无效或已过期', lastSync: null, gistId: null });
        localStorage.removeItem('mindcanvas_github_token');
        localStorage.removeItem('mindcanvas_gist_id');
        setToken('');
      } else {
        setSyncState({ status: 'error', message: '同步失败', lastSync: null, gistId: null });
      }
    } catch {
      setSyncState({ status: 'error', message: '网络错误', lastSync: null, gistId: null });
    }
  };

  const syncFromGist = async () => {
    if (!token) {
      setSyncState({ status: 'error', message: '请输入 GitHub Token', lastSync: null, gistId: null });
      return;
    }

    setSyncState((prev) => ({ ...prev, status: 'syncing', message: '同步中...' }));

    try {
      const gistId = localStorage.getItem('mindcanvas_gist_id');
      if (!gistId) {
        setSyncState({ status: 'error', message: '没有找到已保存的 Gist', lastSync: null, gistId: null });
        return;
      }

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      if (response.ok) {
        const gist = await response.json();
        const file = gist.files[GIST_FILENAME];
        if (file) {
          const data = JSON.parse(file.content);

          store.loadData(data.nodes || [], data.connections || [], data.penPaths || []);

          if (data.canvas) {
            useStore.setState({ canvas: data.canvas });
          }
          if (data.theme) {
            useStore.setState({ theme: data.theme });
            document.body.setAttribute('data-theme', data.theme);
          }

          saveToLocal({ gistId });
        } else {
          setSyncState({ status: 'error', message: 'Gist 文件不存在', lastSync: null, gistId: null });
        }
      } else if (response.status === 404) {
        setSyncState({ status: 'error', message: 'Gist 不存在或已被删除', lastSync: null, gistId: null });
        localStorage.removeItem('mindcanvas_gist_id');
      } else {
        setSyncState({ status: 'error', message: '获取数据失败', lastSync: null, gistId: null });
      }
    } catch {
      setSyncState({ status: 'error', message: '网络错误', lastSync: null, gistId: null });
    }
  };

  const disconnect = () => {
    localStorage.removeItem('mindcanvas_github_token');
    localStorage.removeItem('mindcanvas_gist_id');
    localStorage.removeItem('mindcanvas_last_sync');
    setToken('');
    setSyncState({ status: 'idle', message: '', lastSync: null, gistId: null });
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const isConnected = !!syncState.gistId;

  return (
    <div className="section">
      <div className="section-title">GitHub 同步</div>

      <label className="label">Personal Access Token</label>
      <input
        type="password"
        className="input input-mono"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="ghp_xxxxxxxxxxxx"
        disabled={isConnected}
      />

      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
        请到 GitHub Settings &gt; Developer settings &gt; Personal access tokens 生成
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {!isConnected ? (
          <button
            className="btn btn-primary"
            onClick={syncToGist}
            disabled={syncState.status === 'syncing' || !token}
            style={{ flex: 1 }}
          >
            {syncState.status === 'syncing' ? '同步中...' : '&#x1F4E8; 创建并同步'}
          </button>
        ) : (
          <>
            <button
              className="btn btn-primary"
              onClick={syncToGist}
              disabled={syncState.status === 'syncing'}
              style={{ flex: 1 }}
            >
              {syncState.status === 'syncing' ? '同步中...' : '&#x2B06; 上传'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={syncFromGist}
              disabled={syncState.status === 'syncing'}
              style={{ flex: 1 }}
            >
              &#x2B07; 下载
            </button>
          </>
        )}
      </div>

      {syncState.message && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            textAlign: 'center',
            color:
              syncState.status === 'success'
                ? 'var(--success)'
                : syncState.status === 'error'
                ? 'var(--danger)'
                : 'var(--text-secondary)',
          }}
        >
          {syncState.message}
        </div>
      )}

      {syncState.lastSync && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          上次同步: {formatLastSync(syncState.lastSync)}
        </div>
      )}

      {isConnected && (
        <button
          className="btn btn-secondary"
          onClick={disconnect}
          style={{ marginTop: '12px', fontSize: '12px' }}
        >
          &#x1F6D1; 解除绑定
        </button>
      )}

      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.5' }}>
        <p>&#x1F512; 数据存储在你的私有 Gist 中</p>
        <p style={{ marginTop: '4px' }}>&#x1F4F1; 在不同设备登录同一 GitHub 账号即可同步</p>
      </div>
    </div>
  );
}
