import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import '../styles/SettingsModal.css';

interface DebankConfig {
  parse_tokens: boolean;
  parse_nfts: boolean;
  parse_pools: boolean;
  threads: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: DebankConfig) => void;
  initialSettings: DebankConfig;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSettings
}) => {
  const [settings, setSettings] = useState(initialSettings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    onClose();
  };

  const handleThreadsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setSettings(prev => ({ ...prev, threads: value }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h2>Settings</h2>
          <button className="settings-modal-close" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="settings-modal-form">
          <div className="settings-modal-section">
            <h3>DeBank Settings</h3>
            <div className="settings-modal-checkboxes">
              <label className="settings-modal-checkbox">
                <input
                  type="checkbox"
                  checked={settings.parse_tokens}
                  onChange={e => setSettings(prev => ({ ...prev, parse_tokens: e.target.checked }))}
                />
                <span>Parse Tokens</span>
              </label>
              <label className="settings-modal-checkbox">
                <input
                  type="checkbox"
                  checked={settings.parse_nfts}
                  onChange={e => setSettings(prev => ({ ...prev, parse_nfts: e.target.checked }))}
                />
                <span>Parse NFTs</span>
              </label>
              <label className="settings-modal-checkbox">
                <input
                  type="checkbox"
                  checked={settings.parse_pools}
                  onChange={e => setSettings(prev => ({ ...prev, parse_pools: e.target.checked }))}
                />
                <span>Parse Pools</span>
              </label>
            </div>
          </div>

          <div className="settings-modal-section">
            <h3>Performance Settings</h3>
            <div className="settings-modal-input-group">
              <label>Threads</label>
              <input
                type="number"
                min="1"
                value={settings.threads}
                onChange={handleThreadsChange}
                className="settings-modal-input"
              />
              <span className="settings-modal-input-hint">
                Number of wallets to check simultaneously
              </span>
            </div>
          </div>

          <div className="settings-modal-footer">
            <button type="submit" className="settings-modal-save">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 