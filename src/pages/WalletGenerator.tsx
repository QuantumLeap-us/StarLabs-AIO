import React, { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiFileText, 
  FiGrid, 
  FiCopy, 
  FiCheck 
} from 'react-icons/fi';
import { 
  SiEthereum
} from 'react-icons/si';
import {
  BiCube,
  BiAtom,
  BiCoinStack,
  BiGlobe
} from 'react-icons/bi';
import * as XLSX from 'xlsx';
import GasPrice from '../components/GasPrice/GasPrice';
import './WalletGenerator.css';

interface WalletConfig {
  network: 'ton' | 'sui' | 'solana' | 'evm' | 'ibc';
  amount: number;
  chain?: string;
}

interface GeneratedWallet {
  address: string;
  privateKey: string;
  mnemonic?: string;
  network: string;
}

interface IBCChain {
  name: string;
  chain_name: string;
  prefix: string;
  hdPath: string;
  denom: string;
  apis?: {
    rpc?: { address: string }[];
    rest?: { address: string }[];
  };
}

const networkIcons = {
  evm: <SiEthereum />,
  ton: <BiCoinStack size={24} />,
  sui: <BiCube size={24} />,
  solana: <BiAtom size={24} />,
  ibc: <BiGlobe size={24} />
};

const networkNames = {
  evm: 'Ethereum',
  ton: 'TON',
  sui: 'SUI',
  solana: 'Solana',
  ibc: 'Cosmos'
};

// 导入生成器
import { EVMWalletGenerator } from '../services/wallet/generators/evmWallet';
import { TONWalletGenerator } from '../services/wallet/generators/tonWallet';
import { SUIWalletGenerator } from '../services/wallet/generators/suiWallet';
import { SolanaWalletGenerator } from '../services/wallet/generators/solanaWallet';
import { IBCWalletGenerator } from '../services/wallet/generators/ibcWallet';

// 初始化生成器
const generators = {
  evm: new EVMWalletGenerator(),
  ton: new TONWalletGenerator(),
  sui: new SUIWalletGenerator(),
  solana: new SolanaWalletGenerator(),
  ibc: new IBCWalletGenerator()
};

const networkConfig = {
  evm: {
    name: 'Ethereum',
    hasPrivateKey: true,
    hasMnemonic: true
  },
  ton: {
    name: 'TON',
    hasPrivateKey: false,
    hasMnemonic: true
  },
  sui: {
    name: 'SUI',
    hasPrivateKey: true,
    hasMnemonic: false
  },
  solana: {
    name: 'Solana',
    hasPrivateKey: true,
    hasMnemonic: false
  },
  ibc: {
    name: 'Cosmos',
    hasPrivateKey: false,
    hasMnemonic: true
  }
};

const ibcChains = [
  { name: 'Cosmos Hub', prefix: 'cosmos', chain_id: 'cosmoshub-4' },
  { name: 'Osmosis', prefix: 'osmo', chain_id: 'osmosis-1' },
  { name: 'Juno', prefix: 'juno', chain_id: 'juno-1' },
  { name: 'Secret Network', prefix: 'secret', chain_id: 'secret-4' },
  { name: 'Akash', prefix: 'akash', chain_id: 'akashnet-2' },
  { name: 'Stargaze', prefix: 'stars', chain_id: 'stargaze-1' },
  { name: 'Kava', prefix: 'kava', chain_id: 'kava_2222-10' },
  { name: 'Injective', prefix: 'inj', chain_id: 'injective-1' },
  { name: 'Evmos', prefix: 'evmos', chain_id: 'evmos_9001-2' },
  { name: 'Persistence', prefix: 'persistence', chain_id: 'core-1' },
  { name: 'Axelar', prefix: 'axelar', chain_id: 'axelar-dojo-1' },
  { name: 'Crescent', prefix: 'cre', chain_id: 'crescent-1' },
  { name: 'Stride', prefix: 'stride', chain_id: 'stride-1' },
  { name: 'Umee', prefix: 'umee', chain_id: 'umee-1' },
  { name: 'Fetch.ai', prefix: 'fetch', chain_id: 'fetchhub-4' },
  { name: 'Agoric', prefix: 'agoric', chain_id: 'agoric-3' },
  { name: 'AssetMantle', prefix: 'mantle', chain_id: 'mantle-1' },
  { name: 'Comdex', prefix: 'comdex', chain_id: 'comdex-1' },
  { name: 'Chihuahua', prefix: 'chihuahua', chain_id: 'chihuahua-1' },
  { name: 'Band Protocol', prefix: 'band', chain_id: 'laozi-mainnet' },
  { name: 'Sifchain', prefix: 'sif', chain_id: 'sifchain-1' },
  { name: 'Gravity Bridge', prefix: 'gravity', chain_id: 'gravity-bridge-3' },
  { name: 'IRISnet', prefix: 'iris', chain_id: 'irishub-1' },
  { name: 'Regen Network', prefix: 'regen', chain_id: 'regen-1' },
  { name: 'Sentinel', prefix: 'sent', chain_id: 'sentinelhub-2' }
];

const WalletGenerator: React.FC = () => {
  const [config, setConfig] = useState<WalletConfig>({
    network: 'evm',
    amount: 1,
    chain: 'Cosmos Hub'
  });
  const [wallets, setWallets] = useState<GeneratedWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (config.network === 'ibc') {
      const chains = (generators.ibc as IBCWalletGenerator).getAvailableChains();
      setConfig(prev => ({ ...prev, amount: 1 }));
    }
  }, [config.network]);

  const handleNetworkChange = (network: WalletConfig['network']) => {
    setConfig(prev => ({ ...prev, network }));
    setWallets([]);
    setError(null);
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseInt(event.target.value) || 1;
    setConfig(prev => ({ ...prev, amount: Math.max(1, Math.min(100, amount)) }));
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const generator = generators[config.network];
      const generatedWallets = await generator.generateWallets({
        network: config.network,
        amount: config.amount,
        chain: config.network === 'ibc' ? config.chain : undefined
      });

      setWallets(generatedWallets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate wallets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTxt = () => {
    let content = '';
    wallets.forEach((wallet, index) => {
      content += `Wallet ${index + 1} (${wallet.network.toUpperCase()})\n`;
      content += `Address: ${wallet.address}\n`;
      content += `Private Key: ${wallet.privateKey}\n`;
      if (wallet.mnemonic) {
        content += `Mnemonic: ${wallet.mnemonic}\n`;
      }
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallets_${config.network}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(wallets.map(wallet => ({
      Network: wallet.network.toUpperCase(),
      Address: wallet.address,
      'Private Key': wallet.privateKey,
      Mnemonic: wallet.mnemonic || ''
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Wallets');
    
    XLSX.writeFile(workbook, `wallets_${config.network}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderWalletCard = (wallet: GeneratedWallet, index: number) => {
    return (
      <div className="wallet-card" key={index}>
        <div className="wallet-header">
          <span className="wallet-index">#{index + 1}</span>
          <span className="wallet-network">{networkConfig[wallet.network].name}</span>
        </div>
        <div className="wallet-content">
          <div className="wallet-field">
            <div className="wallet-field-label">Address</div>
            <div className="wallet-field-value">
              <span>{wallet.address}</span>
              <button
                className="copy-button"
                onClick={() => handleCopy(wallet.address, `address-${index}`)}
              >
                {copiedStates[`address-${index}`] ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
          </div>

          {networkConfig[config.network].hasPrivateKey && wallet.privateKey && (
            <div className="wallet-field">
              <div className="wallet-field-label">Private Key</div>
              <div className="wallet-field-value">
                <span>{wallet.privateKey}</span>
                <button
                  className="copy-button"
                  onClick={() => handleCopy(wallet.privateKey!, `private-${index}`)}
                >
                  {copiedStates[`private-${index}`] ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>
          )}

          {networkConfig[config.network].hasMnemonic && wallet.mnemonic && (
            <div className="wallet-field">
              <div className="wallet-field-label">Mnemonic</div>
              <div className="wallet-field-value">
                <span>{wallet.mnemonic}</span>
                <button
                  className="copy-button"
                  onClick={() => handleCopy(wallet.mnemonic!, `mnemonic-${index}`)}
                >
                  {copiedStates[`mnemonic-${index}`] ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderControls = () => (
    <div className="generator-controls">
      {config.network === 'ibc' && (
        <div className="control-group">
          <label>Chain:</label>
          <select 
            value={config.chain} 
            onChange={(e) => setConfig(prev => ({ ...prev, chain: e.target.value }))}
          >
            {ibcChains.map(chain => (
              <option key={chain.chain_id} value={chain.name}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>
      )}
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
    </div>
  );

  return (
    <div className="wallet-generator">
      <div className="gas-price-wrapper">
        <GasPrice />
      </div>
      <div className="wallet-generator-content">
        <div className="network-cards">
          {Object.entries(generators).map(([network, _]) => (
            <div
              key={network}
              className={`network-card ${config.network === network ? 'selected' : ''}`}
              onClick={() => handleNetworkChange(network as WalletConfig['network'])}
            >
              <div className="network-card-icon">
                {networkIcons[network as keyof typeof networkIcons]}
              </div>
              <span className="network-card-name">{networkNames[network as keyof typeof networkNames]}</span>
            </div>
          ))}
        </div>

        {renderControls()}

        <button 
          className="btn-generate" 
          onClick={handleGenerate}
          disabled={loading || (config.network === 'ibc' && !config.chain)}
        >
          {loading ? (
            <span>Generating...</span>
          ) : (
            <span>Generate Wallets</span>
          )}
        </button>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {wallets.length > 0 && (
          <>
            <div className="export-buttons">
              <button className="btn-export" onClick={handleExportTxt}>
                <FiFileText /> Export TXT
              </button>
              <button className="btn-export" onClick={handleExportExcel}>
                <FiGrid /> Export Excel
              </button>
            </div>
            <div className="wallet-list">
              {wallets.map((wallet, index) => renderWalletCard(wallet, index))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletGenerator;
