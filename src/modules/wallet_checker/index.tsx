import React, { useState, useEffect, useCallback } from 'react';
import { FiUserPlus, FiDownload, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';
import './WalletChecker.css';
import { SettingsModal } from './components/SettingsModal';
import { WalletTable } from './components/WalletTable';
import { CreateWalletGroupModal } from './components/CreateWalletGroupModal';
import { walletCheckerAPI } from './api/client';
import type { WalletAccount, WalletBase } from './types';

// Добавим функцию для генерации уникального ID
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
};

// Добавим функцию для подсчета общей суммы
const calculateTotalBalance = (base: WalletBase | null) => {
  if (!base) return 0;
  return base.accounts.reduce((sum, account) => sum + account.balance, 0);
};

export const WalletChecker: React.FC = () => {
  const [walletBases, setWalletBases] = useState<WalletBase[]>([]);
  const [selectedBase, setSelectedBase] = useState<WalletBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [debankConfig, setDebankConfig] = useState({
    parse_tokens: true,
    parse_nfts: true,
    parse_pools: true,
    threads: 1
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBase, setEditingBase] = useState<WalletBase | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    const fetchWalletBases = async () => {
      try {
        const bases = await walletCheckerAPI.getAllWalletBases();
        setWalletBases(bases as WalletBase[]);
      } catch (err) {
        setError('Failed to fetch wallet bases');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletBases();
  }, []);

  useEffect(() => {
    if (selectedBase) {
      const newTotal = selectedBase.accounts.reduce((sum, account) => sum + account.balance, 0);
      setTotalBalance(newTotal);
    } else {
      setTotalBalance(0);
    }
  }, [selectedBase?.accounts]);

  useEffect(() => {
    if (selectedBase) {
      const updatedBase = walletBases.find(base => base.accounts_name === selectedBase.accounts_name);
      if (updatedBase) {
        setSelectedBase(updatedBase);
      }
    }
  }, [walletBases]);

  const handleCreateGroup = async (name: string, wallets: string[], proxies: string[]) => {
    try {
      const accounts = wallets.map(wallet => ({
        account_data: wallet,
        address: "0x",
        balance: 0,
        tokens: { quantity: 0, data: [] },
        nfts: { quantity: 0, data: [] },
        pools: { quantity: 0, data: [] },
        proxy: proxies,
        last_check: 0
      } as WalletAccount));

      await walletCheckerAPI.createWalletBase(name, accounts);
      const updatedBases = await walletCheckerAPI.getAllWalletBases();
      setWalletBases(updatedBases as WalletBase[]);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExport = async () => {
    if (!selectedBase) {
      alert('Please select a wallet group to export');
      return;
    }

    try {
      const exportData = {
        accounts_name: selectedBase.accounts_name,
        accounts: selectedBase.accounts
      };

      const fileContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([fileContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedBase.accounts_name}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const handleEditGroup = (groupName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const base = walletBases.find(b => b.accounts_name === groupName);
    if (base) {
      setEditingBase(base);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteGroup = async (groupName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await walletCheckerAPI.deleteBase(groupName);
      setWalletBases(prevBases => prevBases.filter(base => base.accounts_name !== groupName));
      if (selectedBase?.accounts_name === groupName) {
        setSelectedBase(null);
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
      // Здесь можно добавить отображение ошибки пользователю
    }
  };

  const handleSettingsSave = (newSettings: typeof debankConfig) => {
    setDebankConfig(newSettings);
    // TODO: Сохранить настройки на бэкенде
  };

  const handleGroupSelect = (base: WalletBase) => {
    setSelectedBase(base);
  };

  const handleEditSave = async (_name: string, wallets: string[], proxies: string[]) => {
    if (!editingBase) return;
    
    try {
      const accounts = wallets.map(wallet => ({
        account_data: wallet,
        address: "0x",
        balance: 0,
        tokens: { quantity: 0, data: [] },
        nfts: { quantity: 0, data: [] },
        pools: { quantity: 0, data: [] },
        proxy: proxies,
        last_check: 0
      } as WalletAccount));

      await walletCheckerAPI.replaceBase(editingBase.accounts_name, accounts);
      const updatedBases = await walletCheckerAPI.getAllWalletBases();
      setWalletBases(updatedBases as WalletBase[]);
      setIsEditModalOpen(false);
      setEditingBase(null);
    } catch (error) {
      console.error('Failed to update group:', error);
      alert(`Failed to update group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAccountsUpdate = useCallback((updatedAccounts: WalletAccount[]) => {
    if (selectedBase) {
      const updatedBase = {
        ...selectedBase,
        accounts: updatedAccounts
      };
      
      setSelectedBase(updatedBase);
      setWalletBases(prevBases => 
        prevBases.map(base => 
          base.accounts_name === selectedBase.accounts_name ? updatedBase : base
        )
      );
    }
  }, [selectedBase]);

  return (
    <div className="wallet-checker">
      <div className="wallet-checker-header">
        <div className="wallet-checker-header-left">
          <button className="wallet-checker-btn" onClick={() => setIsCreateModalOpen(true)}>
            <FiUserPlus size={16} />
            Create New Wallet Group
          </button>
        </div>
        
        <div className="wallet-checker-header-right">
          <button 
            className="wallet-checker-btn" 
            onClick={handleExport}
            disabled={!selectedBase}
          >
            <FiDownload size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="wallet-checker-divider" />

      {loading ? (
        <div className="wallet-checker-loading">Loading wallet bases...</div>
      ) : error ? (
        <div className="wallet-checker-error">{error}</div>
      ) : (
        <div className="wallet-checker-groups">
          {walletBases && walletBases.length > 0 ? (
            walletBases.map((base) => (
              <div 
                key={base.accounts_name || generateUniqueId()}
                className={`wallet-checker-group ${selectedBase?.accounts_name === base.accounts_name ? 'active' : ''}`}
                onClick={() => handleGroupSelect(base)}
              >
                <div className="wallet-checker-group-header">
                  <button 
                    className="wallet-checker-group-btn" 
                    onClick={(e) => handleEditGroup(base.accounts_name, e)}
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button 
                    className="wallet-checker-group-btn" 
                    onClick={(e) => handleDeleteGroup(base.accounts_name, e)}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
                <div className="wallet-checker-group-content">
                  <FiDollarSign size={24} color="#2196f3" />
                  <h3 className="wallet-checker-group-name">{base.accounts_name}</h3>
                  <span className="wallet-checker-accounts-count">
                    {base.accounts.length} Wallets
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="wallet-checker-empty">
              Start by creating your first wallet group
            </div>
          )}
        </div>
      )}

      <div className="wallet-checker-divider" />
      
      <div className="wallet-checker-total-balance">
        <span className="wallet-checker-total-balance-label">Total Balance:</span>
        <span className="wallet-checker-total-balance-value">
          ${totalBalance.toFixed(2)}
        </span>
      </div>

      <div className="wallet-checker-divider" />

      <WalletTable 
        accounts={selectedBase?.accounts || []}
        baseName={selectedBase?.accounts_name}
        onAccountsUpdate={handleAccountsUpdate}
      />

      <div className="wallet-checker-divider" />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSettingsSave}
        initialSettings={debankConfig}
      />

      <CreateWalletGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

      <CreateWalletGroupModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBase(null);
        }}
        onCreateGroup={handleEditSave}
        initialData={{
          name: editingBase?.accounts_name || '',
          wallets: editingBase?.accounts.map(acc => acc.account_data) || [],
          proxies: editingBase?.accounts[0]?.proxy || []
        }}
      />
    </div>
  );
}; 