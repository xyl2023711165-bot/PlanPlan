'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { getApiConfig, saveApiConfig, setSetupComplete, ApiConfig } from '@/services/storage';
import { PROVIDERS, ProviderId } from '@/services/ai';

function SettingsFallback() {
  return (
    <div className="page-container">
      <NavBar />
      <main className="main-content">
        <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
      </main>
    </div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWizard = searchParams.get('from') === 'wizard';

  const [config, setConfig] = useState<ApiConfig>({
    provider: 'siliconflow',
    apiKey: '',
    baseUrl: '',
    model: '',
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const savedConfig = getApiConfig();
    if (savedConfig.provider && savedConfig.model) {
      setConfig(savedConfig);
    } else {
      const defaultProvider = PROVIDERS.siliconflow;
      setConfig({
        provider: 'siliconflow',
        apiKey: '',
        baseUrl: '',
        model: defaultProvider.models[0],
      });
    }
  }, []);

  const handleProviderChange = (providerId: string) => {
    const provider = PROVIDERS[providerId as ProviderId];
    setConfig({
      ...config,
      provider: providerId,
      baseUrl: '',
      model: provider?.models[0] || '',
    });
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!config.apiKey.trim()) {
      setTestResult({ success: false, message: '请输入 API Key' });
      return;
    }

    setSaving(true);
    try {
      saveApiConfig(config);
      setSetupComplete(true);

      if (isWizard) {
        router.push('/');
      } else {
        setTestResult({ success: true, message: '保存成功！' });
      }
    } catch (error) {
      setTestResult({ success: false, message: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.apiKey.trim()) {
      setTestResult({ success: false, message: '请输入 API Key' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const provider = PROVIDERS[config.provider as ProviderId];
      const baseUrl = config.baseUrl || provider.baseUrl;
      const model = config.model || provider.models[0];

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: '连接成功！API 配置正确。' });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTestResult({ success: false, message: `连接失败: ${errorData.error?.message || response.statusText}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}` });
    } finally {
      setTesting(false);
    }
  };

  const currentProvider = PROVIDERS[config.provider as ProviderId];

  return (
    <div className="page-container">
      <NavBar />

      <main className="main-content">
        <section className="settings-section">
          <h1 className="page-title">
            {isWizard ? '欢迎使用 PlanPlan' : '设置'}
          </h1>

          {isWizard && (
            <p className="welcome-text">
              请先配置您的 AI API 以开始使用。我们支持多种 AI 服务商。
            </p>
          )}

          <div className="form-group">
            <label>AI 服务商</label>
            <select
              value={config.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="select-input"
            >
              {Object.entries(PROVIDERS).map(([id, p]) => (
                <option key={id} value={id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => {
                setConfig({ ...config, apiKey: e.target.value });
                setTestResult(null);
              }}
              placeholder={`输入您的 ${currentProvider?.name} API Key`}
              className="text-input"
            />
            <p className="help-text">
              可以在 {currentProvider?.name} 官网获取 API Key
            </p>
          </div>

          <div className="form-group">
            <label>模型</label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="select-input"
            >
              {currentProvider?.models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>自定义端点（可选）</label>
            <input
              type="text"
              value={config.baseUrl || ''}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder={currentProvider?.baseUrl}
              className="text-input"
            />
            <p className="help-text">
              留空使用默认值: {currentProvider?.baseUrl}
            </p>
          </div>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.message}
            </div>
          )}

          <div className="button-group">
            <button
              onClick={handleTest}
              disabled={testing || !config.apiKey.trim()}
              className="btn btn-secondary"
            >
              {testing ? '测试中...' : '测试连接'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !config.apiKey.trim()}
              className="btn btn-primary"
            >
              {saving ? '保存中...' : isWizard ? '开始使用' : '保存设置'}
            </button>
          </div>
        </section>
      </main>

      <style>{`
        .page-container {
          min-height: 100vh;
          background: #f7f8fa;
        }

        .page-container > div:first-child {
          height: 72px;
        }

        .main-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 24px;
          min-height: calc(100vh - 72px);
        }

        .settings-section {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 12px;
        }

        .welcome-text {
          font-size: 16px;
          color: #718096;
          margin: 0 0 32px;
          line-height: 1.6;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .text-input, .select-input {
          width: 100%;
          padding: 14px 16px;
          font-size: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          color: #2d3748;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .text-input:focus, .select-input:focus {
          outline: none;
          border-color: #2d3748;
        }

        .text-input::placeholder {
          color: #a0aec0;
        }

        .help-text {
          font-size: 13px;
          color: #a0aec0;
          margin: 6px 0 0;
        }

        .test-result {
          padding: 14px 18px;
          border-radius: 10px;
          font-size: 15px;
          margin-bottom: 24px;
        }

        .test-result.success {
          background: #f0fff4;
          color: #276749;
          border: 1px solid #9ae6b4;
        }

        .test-result.error {
          background: #fff5f5;
          color: #c53030;
          border: 1px solid #feb2b2;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .btn {
          flex: 1;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #2d3748;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1a202c;
        }

        .btn-secondary {
          background: #edf2f7;
          color: #2d3748;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsContent />
    </Suspense>
  );
}