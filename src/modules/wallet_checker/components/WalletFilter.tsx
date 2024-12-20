import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import '../styles/WalletFilter.css';

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

interface WalletFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterValues) => void;
}

export const WalletFilter: React.FC<WalletFilterProps> = ({
  isOpen,
  onClose,
  onApplyFilters
}) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newFilters = {
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    };
    setFilters(newFilters);
  };

  const handleReset = () => {
    const defaultFilters = {
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
    };
    setFilters(defaultFilters);
    onApplyFilters(defaultFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="wallet-filter">
      <div className="wallet-filter-header">
        <h3>Filter Options</h3>
        <button className="wallet-filter-close-btn" onClick={onClose}>
          <FiX size={20} />
        </button>
      </div>

      <div className="wallet-filter-content">
        <div className="wallet-filter-section">
          <h4>Asset Types</h4>
          <div className="wallet-filter-checkboxes">
            <label className="wallet-filter-checkbox">
              <input
                type="checkbox"
                name="showTokens"
                checked={filters.showTokens}
                onChange={handleInputChange}
              />
              <span>Show Tokens</span>
            </label>
            <label className="wallet-filter-checkbox">
              <input
                type="checkbox"
                name="showNFTs"
                checked={filters.showNFTs}
                onChange={handleInputChange}
              />
              <span>Show NFTs</span>
            </label>
            <label className="wallet-filter-checkbox">
              <input
                type="checkbox"
                name="showPools"
                checked={filters.showPools}
                onChange={handleInputChange}
              />
              <span>Show Pools</span>
            </label>
          </div>
        </div>

        <div className="wallet-filter-section">
          <h4>Minimum Values</h4>
          <div className="wallet-filter-inputs">
            <div className="wallet-filter-input-group">
              <label>Min Wallet Balance ($)</label>
              <input
                type="number"
                name="minWalletBalance"
                value={filters.minWalletBalance}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>
            <div className="wallet-filter-input-group">
              <label>Min Tokens Count</label>
              <input
                type="number"
                name="minTokensCount"
                value={filters.minTokensCount}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
            <div className="wallet-filter-input-group">
              <label>Min NFTs Count</label>
              <input
                type="number"
                name="minNFTsCount"
                value={filters.minNFTsCount}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="wallet-filter-section">
          <h4>Search</h4>
          <div className="wallet-filter-inputs">
            <div className="wallet-filter-input-group">
              <label>Wallet Address</label>
              <input
                type="text"
                name="walletAddressSearch"
                value={filters.walletAddressSearch}
                onChange={handleInputChange}
                placeholder="Search by wallet address..."
              />
            </div>
            <div className="wallet-filter-input-group">
              <label>Data</label>
              <input
                type="text"
                name="dataSearch"
                value={filters.dataSearch}
                onChange={handleInputChange}
                placeholder="Search by data..."
              />
            </div>
            <div className="wallet-filter-input-group">
              <label>Token Name</label>
              <input
                type="text"
                name="tokenNameSearch"
                value={filters.tokenNameSearch}
                onChange={handleInputChange}
                placeholder="Search by token name..."
              />
            </div>
            <div className="wallet-filter-input-group">
              <label>Pool Name</label>
              <input
                type="text"
                name="poolNameSearch"
                value={filters.poolNameSearch}
                onChange={handleInputChange}
                placeholder="Search by pool name..."
              />
            </div>
            <div className="wallet-filter-input-group">
              <label>NFT Name</label>
              <input
                type="text"
                name="nftNameSearch"
                value={filters.nftNameSearch}
                onChange={handleInputChange}
                placeholder="Search by NFT name..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="wallet-filter-footer">
        <button className="wallet-filter-apply-btn" onClick={() => onApplyFilters(filters)}>
          Apply Filters
        </button>
        <button className="wallet-filter-reset-btn" onClick={handleReset}>
          Reset Filters
        </button>
      </div>
    </div>
  );
}; 