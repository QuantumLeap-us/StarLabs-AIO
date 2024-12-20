import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import '../styles/CreateWalletGroupModal.css';

interface CreateWalletGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, wallets: string[], proxies: string[]) => void;
  initialData?: {
    name: string;
    wallets: string[];
    proxies: string[];
  };
}

export const CreateWalletGroupModal: React.FC<CreateWalletGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  initialData
}) => {
  const [groupName, setGroupName] = useState(initialData?.name || '');
  const [walletsText, setWalletsText] = useState(initialData?.wallets.join('\n') || '');
  const [proxiesText, setProxiesText] = useState(initialData?.proxies.join('\n') || '');

  useEffect(() => {
    if (initialData) {
      setGroupName(initialData.name);
      setWalletsText(initialData.wallets.join('\n'));
      setProxiesText(initialData.proxies.join('\n'));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wallets = walletsText.split('\n').filter(line => line.trim());
    const proxies = proxiesText.split('\n').filter(line => line.trim());
    
    if (!groupName) {
      alert('Please enter a group name');
      return;
    }

    if (wallets.length === 0) {
      alert('Please add at least one wallet');
      return;
    }

    onCreateGroup(groupName, wallets, proxies);
    handleClose();
  };

  const handleClose = () => {
    setGroupName('');
    setWalletsText('');
    setProxiesText('');
    onClose();
  };

  const handleImportWallets = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      const wallets = text.split('\n').filter(line => line.trim());
      setWalletsText(prevText => {
        const currentWallets = prevText.split('\n').filter(line => line.trim());
        const newWallets = [...new Set([...currentWallets, ...wallets])].join('\n');
        return newWallets;
      });
    }
    // Сбрасываем значение input для возможности повторного импорта того же файла
    e.target.value = '';
  };

  const handleImportProxies = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      const proxies = text.split('\n').filter(line => line.trim());
      setProxiesText(prevText => {
        const currentProxies = prevText.split('\n').filter(line => line.trim());
        const newProxies = [...new Set([...currentProxies, ...proxies])].join('\n');
        return newProxies;
      });
    }
    // Сбрасываем значение input для возможности повторного импорта того же файла
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="create-wallet-modal-overlay">
      <div className="create-wallet-modal">
        <div className="create-wallet-modal-header">
          <h2>Create New Wallet Group</h2>
          <button className="create-wallet-modal-close" onClick={handleClose}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-wallet-modal-form">
          <div className="create-wallet-modal-input-group">
            <label>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>

          <div className="create-wallet-modal-input-group">
            <div className="create-wallet-modal-input-header">
              <label>Wallets (one per line)</label>
              <input
                type="file"
                accept=".txt"
                onChange={handleImportWallets}
                style={{ display: 'none' }}
                id="wallet-file-input"
              />
              <button
                type="button"
                className="create-wallet-modal-import-btn"
                onClick={() => document.getElementById('wallet-file-input')?.click()}
              >
                Import Wallets
              </button>
            </div>
            <textarea
              value={walletsText}
              onChange={(e) => setWalletsText(e.target.value)}
              placeholder="Enter wallets..."
              rows={8}
            />
          </div>

          <div className="create-wallet-modal-input-group">
            <div className="create-wallet-modal-input-header">
              <label>Proxies (one per line)</label>
              <input
                type="file"
                accept=".txt"
                onChange={handleImportProxies}
                style={{ display: 'none' }}
                id="proxy-file-input"
              />
              <button
                type="button"
                className="create-wallet-modal-import-btn"
                onClick={() => document.getElementById('proxy-file-input')?.click()}
              >
                Import Proxies
              </button>
            </div>
            <textarea
              value={proxiesText}
              onChange={(e) => setProxiesText(e.target.value)}
              placeholder="Enter proxies..."
              rows={8}
            />
          </div>

          <div className="create-wallet-modal-footer">
            <button type="button" className="create-wallet-modal-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="create-wallet-modal-submit">
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 