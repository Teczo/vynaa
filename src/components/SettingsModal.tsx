import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

const PROVIDERS = {
    google: {
        label: 'Google Gemini',
        models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'],
    },
    openai: {
        label: 'OpenAI',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o4-mini'],
    },
    anthropic: {
        label: 'Anthropic',
        models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
    },
} as const;

type Provider = keyof typeof PROVIDERS;

export interface AIConfig {
    provider: Provider;
    model: string;
    apiKey: string;
}

export function getStoredConfig(): AIConfig | null {
    const raw = sessionStorage.getItem('vynaa_ai_config');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function storeConfig(config: AIConfig) {
    sessionStorage.setItem('vynaa_ai_config', JSON.stringify(config));
}

export function clearConfig() {
    sessionStorage.removeItem('vynaa_ai_config');
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: AIConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
    const [provider, setProvider] = useState<Provider>('google');
    const [model, setModel] = useState(PROVIDERS.google.models[0]);
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testError, setTestError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const saved = getStoredConfig();
            if (saved) {
                setProvider(saved.provider);
                setModel(saved.model);
                setApiKey(saved.apiKey);
            }
        }
    }, [isOpen]);

    const handleProviderChange = (p: Provider) => {
        setProvider(p);
        setModel(PROVIDERS[p].models[0]);
        setTestStatus('idle');
    };

    const handleTestConnection = async () => {
        if (!apiKey.trim()) return;
        setTestStatus('testing');
        setTestError('');

        try {
            let testUrl: string;
            let testOptions: RequestInit;

            if (provider === 'google') {
                testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                testOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Say "ok"' }] }],
                        generationConfig: { maxOutputTokens: 5 },
                    }),
                };
            } else if (provider === 'openai') {
                testUrl = 'https://api.openai.com/v1/chat/completions';
                testOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: 'user', content: 'Say "ok"' }],
                        max_tokens: 5,
                    }),
                };
            } else {
                testUrl = 'https://api.anthropic.com/v1/messages';
                testOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true',
                    },
                    body: JSON.stringify({
                        model,
                        max_tokens: 5,
                        messages: [{ role: 'user', content: 'Say "ok"' }],
                    }),
                };
            }

            const response = await fetch(testUrl, testOptions);
            if (response.ok) {
                setTestStatus('success');
            } else {
                const err = await response.text();
                setTestStatus('error');
                setTestError(`API returned ${response.status}`);
            }
        } catch (e: any) {
            setTestStatus('error');
            setTestError(e.message || 'Connection failed');
        }
    };

    const handleSave = () => {
        const config: AIConfig = { provider, model, apiKey: apiKey.trim() };
        storeConfig(config);
        onSave(config);
        onClose();
    };

    const handleClear = () => {
        clearConfig();
        setApiKey('');
        setTestStatus('idle');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a1a1e] rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/5">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">AI Settings</h2>
                    <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <X size={18} className="text-zinc-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Provider Tabs */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Provider</label>
                        <div className="flex gap-2">
                            {(Object.keys(PROVIDERS) as Provider[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => handleProviderChange(p)}
                                    className={[
                                        'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all',
                                        provider === p
                                            ? 'bg-black text-white dark:bg-white dark:text-black'
                                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10',
                                    ].join(' ')}
                                >
                                    {PROVIDERS[p].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Model Select */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Model</label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-zinc-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {PROVIDERS[provider].models.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* API Key Input */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">API Key</label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => { setApiKey(e.target.value); setTestStatus('idle'); }}
                                placeholder={`Enter your ${PROVIDERS[provider].label} API key`}
                                className="w-full bg-zinc-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2.5 px-4 pr-10 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                            >
                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="mt-1.5 text-[10px] text-zinc-400">
                            Stored in browser session only. Never sent to Vynaa servers for storage.
                        </p>
                    </div>

                    {/* Test Connection */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleTestConnection}
                            disabled={!apiKey.trim() || testStatus === 'testing'}
                            className="px-4 py-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                        >
                            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                        </button>
                        {testStatus === 'success' && (
                            <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                                <Check size={14} /> Connected
                            </span>
                        )}
                        {testStatus === 'error' && (
                            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                <AlertCircle size={14} /> {testError}
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-black/10 dark:border-white/5">
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        Clear All Keys
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!apiKey.trim()}
                            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-40"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
