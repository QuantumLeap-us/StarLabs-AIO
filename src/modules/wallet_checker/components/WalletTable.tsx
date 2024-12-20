import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiEdit2, FiTrash2, FiChevronRight, FiPlay, FiFilter, FiSettings, FiChevronsDown, FiChevronsUp } from 'react-icons/fi';
import '../styles/WalletTable.css';
import { WalletFilter } from './WalletFilter';
import { CheckTypeModal } from './CheckTypeModal';
import { SettingsModal } from './SettingsModal';

interface Token {
  name: string;
  balance_usd: string;
  amount: string;
  contract_address: string;
}

interface ChainTokens {
  chain_name: string;
  tokens: Token[];
}

interface TokenData {
  quantity: number;
  data: ChainTokens[];
}

interface NFT {
  name: string;
  price_usd: string;
  amount: string;
}

interface ChainNFTs {
  chain_name: string;
  nfts: NFT[];
}

interface NFTData {
  quantity: number;
  data: ChainNFTs[];
}

interface Pool {
  name: string;
  balance_usd: string;
  amount: string;
}

interface Protocol {
  protocol_name: string;
  pools: Pool[];
}

interface ChainPools {
  chain_name: string;
  protocols: Protocol[];
}

interface PoolData {
  quantity: number;
  data: ChainPools[];
}

interface WalletAccount {
  address: string;
  account_data: string;
  balance: number;
  proxy: string[];
  last_check: number;
  tokens: TokenData;
  nfts: NFTData;
  pools: PoolData;
}

interface WalletTableProps {
  accounts: WalletAccount[];
  baseName?: string;
  onAccountsUpdate?: (updatedAccounts: WalletAccount[]) => void;
}

interface DebankConfig {
  parse_tokens: boolean;
  parse_nfts: boolean;
  parse_pools: boolean;
  threads: number;
}

interface FilterValues {
  showNFTs: boolean;
  showPools: boolean;
  showTokens: boolean;
  minWalletBalance: string;
  minTokensCount: string;
  minNFTsCount: string;
  walletAddressSearch: string;
  dataSearch: string;
  tokenNameSearch: string;
  poolNameSearch: string;
  nftNameSearch: string;
}

export const WalletTable: React.FC<WalletTableProps> = ({ 
  accounts: initialAccounts, 
  baseName,
  onAccountsUpdate 
}) => {
  const [accounts, setAccounts] = useState<WalletAccount[]>(initialAccounts);
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCheckTypeModalOpen, setIsCheckTypeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [checkerType, setCheckerType] = useState<'debank' | 'rabby' | null>(null);
  const [settings, setSettings] = useState<DebankConfig>({
    parse_tokens: true,
    parse_nfts: true,
    parse_pools: true,
    threads: 1
  });
  const [isChecking, setIsChecking] = useState(false);
  const [shouldStartCheck, setShouldStartCheck] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    showNFTs: true,
    showPools: true,
    showTokens: true,
    minWalletBalance: '',
    minTokensCount: '',
    minNFTsCount: '',
    walletAddressSearch: '',
    dataSearch: '',
    tokenNameSearch: '',
    poolNameSearch: '',
    nftNameSearch: ''
  });
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  useEffect(() => {
    console.log('CheckerType changed:', checkerType); // Для отладки
  }, [checkerType]);

  useEffect(() => {
    if (expandAll) {
      setExpandedWallet('all');
    } else {
      setExpandedWallet(null);
    }
  }, [expandAll]);

  const handleExpand = (walletAddress: string) => {
    if (expandedWallet === 'all') {
      setExpandAll(false);
      setExpandedWallet(walletAddress);
    } else {
      setExpandedWallet(expandedWallet === walletAddress ? null : walletAddress);
    }
  };

  const handleExpandAll = () => {
    setExpandAll(!expandAll);
  };

  const generateKey = (prefix: string, ...parts: (string | number)[]) => {
    return `${prefix}-${parts.join('-')}`;
  };

  const checkWallet = useCallback(async (account: WalletAccount) => {
    try {
      const requestData = {
        account: account.account_data,
        proxy: account.proxy,
        type: checkerType,
        config: {
          debank_config: {
            parse_tokens: settings.parse_tokens,
            parse_nfts: settings.parse_nfts,
            parse_pools: settings.parse_pools
          }
        }
      };

      const response = await fetch('http://localhost:4003/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setAccounts(prevAccounts => {
        const newAccounts = prevAccounts.map(acc => 
          acc.address === account.address 
            ? { 
                ...acc,
                balance: result.total_balance,
                address: result.wallet_address,
                tokens: {
                  quantity: result.tokens.quantity,
                  data: result.tokens.data
                },
                nfts: {
                  quantity: result.nfts.quantity,
                  data: result.nfts.data
                },
                pools: {
                  quantity: result.pools.quantity,
                  data: result.pools.data
                },
                last_check: Math.floor(Date.now() / 1000)
              }
            : acc
        );
        
        onAccountsUpdate?.(newAccounts);
        
        return newAccounts;
      });
      
    } catch (error) {
      console.error('Error checking wallet:', error);
    }
  }, [checkerType, settings, onAccountsUpdate]);

  const startChecking = useCallback(async () => {
    if (!checkerType || isChecking) return;
    setIsChecking(true);
    
    try {
      for (let i = 0; i < accounts.length; i += settings.threads) {
        const batch = accounts.slice(i, i + settings.threads);
        
        await Promise.all(
          batch.map(account => checkWallet(account))
        );
        
        if (i + settings.threads < accounts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error during checking process:', error);
    } finally {
      setIsChecking(false);
    }
  }, [checkerType, isChecking, accounts, checkWallet, settings.threads]);

  const handleCheckTypeSelect = useCallback((type: 'rabby' | 'debank') => {
    setCheckerType(type);
    setIsCheckTypeModalOpen(false);
    setShouldStartCheck(true);
  }, []);

  useEffect(() => {
    if (checkerType && shouldStartCheck && !isCheckTypeModalOpen) {
      console.log('Starting check with type:', checkerType);
      startChecking();
      setShouldStartCheck(false);
    }
  }, [checkerType, isCheckTypeModalOpen, startChecking, shouldStartCheck]);

  const handleSettingsSave = (newSettings: DebankConfig) => {
    setSettings(newSettings);
  };

  const formatValue = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(5);
  };

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const renderCheckDetails = (account: WalletAccount) => {
    return (
      <div className="wallet-checker-details">
        {filters.showTokens && account.tokens.quantity > 0 && (
          <div className="wallet-checker-details-section">
            <h4>Tokens ({account.tokens.quantity})</h4>
            <table className="wallet-checker-details-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Chain</th>
                  <th>Balance USD ($)</th>
                  <th>Amount</th>
                  <th>Contract Address</th>
                </tr>
              </thead>
              <tbody>
                {account.tokens.data.map((chain) => (
                  chain.tokens.map((token, tokenIdx) => (
                    <tr key={`${chain.chain_name}-${token.name}-${tokenIdx}`}>
                      <td>{token.name}</td>
                      <td>{chain.chain_name.toUpperCase()}</td>
                      <td>${formatValue(token.balance_usd)}</td>
                      <td>{formatValue(token.amount)}</td>
                      <td>{token.contract_address}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filters.showNFTs && account.nfts.quantity > 0 && (
          <div className="wallet-checker-details-section">
            <h4>NFTs ({account.nfts.quantity})</h4>
            <table className="wallet-checker-details-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Chain</th>
                  <th>Price USD ($)</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {account.nfts.data.map((chain) => (
                  chain.nfts.map((nft, nftIdx) => (
                    <tr key={`${chain.chain_name}-${nft.name}-${nftIdx}`}>
                      <td>{nft.name}</td>
                      <td>{chain.chain_name.toUpperCase()}</td>
                      <td>${formatValue(nft.price_usd)}</td>
                      <td>{nft.amount}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filters.showPools && account.pools.quantity > 0 && (
          <div className="wallet-checker-details-section">
            <h4>Pools ({account.pools.quantity})</h4>
            <table className="wallet-checker-details-table">
              <thead>
                <tr>
                  <th>Protocol / Name</th>
                  <th>Chain</th>
                  <th>Balance USD ($)</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {account.pools.data.map((chain) => (
                  chain.protocols.map(protocol => (
                    protocol.pools.map((pool, poolIdx) => (
                      <tr key={`${chain.chain_name}-${protocol.protocol_name}-${pool.name}-${poolIdx}`}>
                        <td>{protocol.protocol_name} / {pool.name}</td>
                        <td>{chain.chain_name.toUpperCase()}</td>
                        <td>${formatValue(pool.balance_usd)}</td>
                        <td>{formatValue(pool.amount)}</td>
                      </tr>
                    ))
                  ))
                ))}
              </tbody>
            </table>
          </div>
        )}

        {account.last_check > 0 && (
          <div className="wallet-checker-details-section">
            <h4>Last Check: {new Date(account.last_check * 1000).toLocaleString()}</h4>
          </div>
        )}
      </div>
    );
  };

  const handleStartCheck = () => {
    if (accounts.length === 0) {
      alert('Please select accounts before starting the check');
      return;
    }
    setIsCheckTypeModalOpen(true);
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      if (filters.walletAddressSearch && 
          !account.address.toLowerCase().includes(filters.walletAddressSearch.toLowerCase())) {
        return false;
      }

      if (filters.dataSearch && 
          !account.account_data.toLowerCase().includes(filters.dataSearch.toLowerCase())) {
        return false;
      }

      if (filters.minWalletBalance && 
          account.balance < parseFloat(filters.minWalletBalance)) {
        return false;
      }

      if (filters.minTokensCount && 
          account.tokens.quantity < parseInt(filters.minTokensCount)) {
        return false;
      }

      if (filters.minNFTsCount && 
          account.nfts.quantity < parseInt(filters.minNFTsCount)) {
        return false;
      }

      if (filters.tokenNameSearch && filters.showTokens) {
        const hasMatchingToken = account.tokens.data.some(chain =>
          chain.tokens.some(token =>
            token.name.toLowerCase().includes(filters.tokenNameSearch.toLowerCase())
          )
        );
        if (!hasMatchingToken) return false;
      }

      if (filters.poolNameSearch && filters.showPools) {
        const hasMatchingPool = account.pools.data.some(chain =>
          chain.protocols.some(protocol =>
            protocol.pools.some(pool =>
              pool.name.toLowerCase().includes(filters.poolNameSearch.toLowerCase())
            )
          )
        );
        if (!hasMatchingPool) return false;
      }

      if (filters.nftNameSearch && filters.showNFTs) {
        const hasMatchingNFT = account.nfts.data.some(chain =>
          chain.nfts.some(nft =>
            nft.name.toLowerCase().includes(filters.nftNameSearch.toLowerCase())
          )
        );
        if (!hasMatchingNFT) return false;
      }

      return true;
    });
  }, [accounts, filters]);

  // Добавим функцию для форматирования длинных строк
  const truncateString = (str: string, maxLength: number = 42) => {
    if (str.length <= maxLength) return str;
    return '...' + str.slice(-maxLength);
  };

  return (
    <div className="wallet-checker-table-container">
      <div className="wallet-checker-table-header">
        <div className="wallet-checker-table-buttons">
          <button 
            className={`wallet-checker-table-check-btn ${isChecking ? 'checking' : ''}`}
            onClick={handleStartCheck}
            disabled={isChecking}
          >
            <FiPlay size={20} />
            {isChecking ? 'Checking...' : 'Check Wallets'}
          </button>
          <button 
            className="wallet-checker-table-check-btn secondary" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <FiFilter size={18} />
            Filter
          </button>
          <button 
            className="wallet-checker-table-check-btn secondary" 
            onClick={() => setIsSettingsOpen(true)}
          >
            <FiSettings size={18} />
            Settings
          </button>
          <button 
            className="wallet-checker-table-check-btn secondary" 
            onClick={handleExpandAll}
          >
            {expandAll ? (
              <>
                <FiChevronsUp size={18} />
                Collapse All
              </>
            ) : (
              <>
                <FiChevronsDown size={18} />
                Expand All
              </>
            )}
          </button>
        </div>
      </div>

      <WalletFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
      />

      <CheckTypeModal
        isOpen={isCheckTypeModalOpen}
        onClose={() => setIsCheckTypeModalOpen(false)}
        onSelect={handleCheckTypeSelect}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSettingsSave}
        initialSettings={settings}
      />

      <table className="wallet-checker-table">
        <thead>
          <tr>
            <th className="wallet-checker-table-expand"></th>
            <th>Address</th>
            <th>Data</th>
            <th>Balance</th>
            <th>Tokens</th>
          </tr>
        </thead>
        <tbody>
          {filteredAccounts.map((account, accountIndex) => (
            <React.Fragment key={generateKey('account', account.address, accountIndex)}>
              <tr key={generateKey('row', account.address, accountIndex)} 
                  className={(expandedWallet === 'all' || expandedWallet === account.address) ? 'expanded' : ''}>
                <td className="wallet-checker-table-expand">
                  <button 
                    className="wallet-checker-table-expand-btn"
                    onClick={() => handleExpand(account.address)}
                  >
                    <FiChevronRight 
                      size={18} 
                      className={expandedWallet === account.address ? 'rotated' : ''}
                    />
                  </button>
                </td>
                <td className="wallet-checker-table-address" title={account.address}>
                  {truncateString(account.address)}
                </td>
                <td className="wallet-checker-table-private-key" title={account.account_data}>
                  {truncateString(account.account_data)}
                </td>
                <td>{account.balance.toFixed(5)}</td>
                <td>{account.tokens.quantity}</td>
              </tr>
              {(expandedWallet === 'all' || expandedWallet === account.address) && (
                <tr className="wallet-checker-table-details">
                  <td colSpan={7}>
                    {renderCheckDetails(account)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 