import { useState } from 'react';
import { GitHubSync } from './GitHubSync';

interface ApiConfig {
  url: string;
  key: string;
  model: string;
  provider: 'minimax' | 'openai' | 'deepseek' | 'custom';
}

const PRESETS = {
  minimax: 'https://api.minimaxi.com/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
};

export function SettingsSidebar() {
  const [config, setConfig] = useState<ApiConfig>({
    url: PRESETS.minimax,
    key: '',
    model: 'MiniMax-M2.7',
    provider: 'minimax',
  });
  const [testResult, setTestResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleProviderChange = (provider: 'minimax' | 'openai' | 'deepseek' | 'custom') => {
    if (provider !== 'custom') {
      const models: Record<string, string> = {
        minimax: 'MiniMax-M2.7',
        openai: 'gpt-3.5-turbo',
        deepseek: 'deepseek-chat',
      };
      setConfig({
        ...config,
        provider,
        url: PRESETS[provider],
        model: models[provider] || 'gpt-3.5-turbo',
      });
    } else {
      setConfig({ ...config, provider: 'custom' });
    }
  };

  const saveSettings = () => {
    localStorage.setItem('mindcanvas_api', JSON.stringify(config));
    setTestResult({ message: '配置已保存', type: 'success' });
    setTimeout(() => setTestResult(null), 2000);
  };

  const testApi = async () => {
    if (!config.key) {
      setTestResult({ message: '请先输入 API Key', type: 'error' });
      return;
    }

    setIsTesting(true);
    try {
      const resp = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + config.key,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 50,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (resp.ok) {
        setTestResult({ message: '连接成功！', type: 'success' });
      } else {
        const err = await resp.json();
        setTestResult({ message: err.error?.message || '请求失败', type: 'error' });
      }
    } catch {
      setTestResult({ message: '网络错误', type: 'error' });
    }
    setIsTesting(false);
  };

  return (
    <>
      <div className="section">
        <div className="section-title">API 提供商</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            className={`btn ${config.provider === 'minimax' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleProviderChange('minimax')}
            style={{ flex: 1, fontSize: '12px' }}
          >
            MiniMax
          </button>
          <button
            className={`btn ${config.provider === 'openai' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleProviderChange('openai')}
            style={{ flex: 1, fontSize: '12px' }}
          >
            OpenAI
          </button>
          <button
            className={`btn ${config.provider === 'deepseek' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleProviderChange('deepseek')}
            style={{ flex: 1, fontSize: '12px' }}
          >
            DeepSeek
          </button>
        </div>

        <label className="label">API 地址</label>
        <input
          type="text"
          className="input input-mono"
          value={config.url}
          onChange={(e) => setConfig({ ...config, url: e.target.value })}
          placeholder={config.provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.minimaxi.com/v1/chat/completions'}
        />

        <label className="label" style={{ marginTop: '12px' }}>
          API Key
        </label>
        <input
          type="password"
          className="input input-mono"
          value={config.key}
          onChange={(e) => setConfig({ ...config, key: e.target.value })}
          placeholder="输入你的 API Key"
        />

        <label className="label" style={{ marginTop: '12px' }}>
          模型名称
        </label>
        <input
          type="text"
          className="input"
          value={config.model}
          onChange={(e) => setConfig({ ...config, model: e.target.value })}
          placeholder={config.provider === 'openai' ? 'gpt-3.5-turbo' : 'MiniMax-M2.7'}
        />

        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={saveSettings}>
          &#x1F4BE; 保存配置
        </button>
      </div>

      <div className="section">
        <div className="section-title">连接测试</div>
        <button className="btn btn-secondary" onClick={testApi} disabled={isTesting}>
          {isTesting ? '测试中...' : '&#x1F9EA; 测试连接'}
        </button>
        {testResult && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '12px',
              textAlign: 'center',
              color: testResult.type === 'success' ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {testResult.message}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">说明</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <p>1. 支持 MiniMax、OpenAI、DeepSeek 及兼容 OpenAI 接口的其他大模型</p>
          <p style={{ marginTop: '8px' }}>2. API Key 仅保存在本地浏览器，不会上传</p>
          <p style={{ marginTop: '8px' }}>3. 配置后 AI 功能（生成导图、扩展内容）即可使用</p>
        </div>
      </div>

      <GitHubSync />
    </>
  );
}