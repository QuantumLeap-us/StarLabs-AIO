import React, { useState } from 'react';
import { FiPlus, FiDownload } from 'react-icons/fi';
import type { WalletConfig, GeneratedWallet } from './types';
import './App.css';
import { generateWallet } from './services/walletService';

function App() {
  const [config, setConfig] = useState<WalletConfig>({
    network: 'evm',
    amount: 1
  });
  const [wallets, setWallets] = useState<GeneratedWallet[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNetworkChange = (network: WalletConfig['network']) => {
    setConfig(prev => ({ ...prev, network }));
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseInt(event.target.value) || 1;
    setConfig(prev => ({ ...prev, amount: Math.max(1, Math.min(100, amount)) }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const newWallets = await generateWallet(config);
      setWallets(prev => [...newWallets, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate wallets');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(wallets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallets_${config.network}_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="wallet-generator">
      <div className="wallet-generator-header">
        <h2>Wallet Generator</h2>
        {wallets.length > 0 && (
          <button className="btn-export" onClick={handleExport}>
            <FiDownload /> Export
          </button>
        )}
      </div>

      <div className="generator-controls">
        <div className="control-group">
          <label>Network:</label>
          <select 
            value={config.network}
            onChange={(e) => handleNetworkChange(e.target.value as WalletConfig['network'])}
          >
            <option value="evm">EVM</option>
            <option value="ton">TON</option>
            <option value="sui">SUI</option>
            <option value="solana">Solana</option>
            <option value="ibc">IBC</option>
          </select>
        </div>

        <div className="control-group">
          <label>Amount:</label>
          <input
            type="number"
            min="1"
            max="100"
            value={config.amount}
            onChange={handleAmountChange}
          />
        </div>

        <button 
          className="btn-generate" 
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <FiPlus /> {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {wallets.length > 0 && (
        <div className="wallets-list">
          <table>
            <thead>
              <tr>
                <th>Network</th>
                <th>Address</th>
                <th>Private Key</th>
                <th>Generated At</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet, index) => (
                <tr key={index}>
                  <td>{wallet.network}</td>
                  <td className="address">{wallet.address}</td>
                  <td className="private-key">{wallet.privateKey}</td>
                  <td>{wallet.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
