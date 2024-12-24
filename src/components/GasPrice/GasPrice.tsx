import { useState, useEffect } from 'react';
import './GasPrice.css';

interface GasData {
  priorityFee: string;
  maxFee: string;
  probability: number;
  chainName: string;
}

interface ChainConfig {
  name: string;
  apiEndpoint: string;
  chainId: number;
  displayName: string;
}

const GasPrice = () => {
  const [gasData, setGasData] = useState<GasData[]>([]);
  const [currentChainIndex, setCurrentChainIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chains: ChainConfig[] = [
    { 
      name: 'Ethereum', 
      displayName: 'Ethereum',
      apiEndpoint: 'https://api.blocknative.com/gasprices/blockprices',
      chainId: 1
    },
    { 
      name: 'Polygon', 
      displayName: 'Polygon',
      apiEndpoint: 'https://api.blocknative.com/gasprices/blockprices?chainid=137',
      chainId: 137
    },
    {
      name: 'Arbitrum',
      displayName: 'Arbitrum One',
      apiEndpoint: 'https://api.blocknative.com/gasprices/blockprices?chainid=42161',
      chainId: 42161
    },
    {
      name: 'Base',
      displayName: 'Base',
      apiEndpoint: 'https://api.blocknative.com/gasprices/blockprices?chainid=8453',
      chainId: 8453
    },
    {
      name: 'Avalanche',
      displayName: 'Avalanche C-Chain',
      apiEndpoint: 'https://api.blocknative.com/gasprices/blockprices?chainid=43114',
      chainId: 43114
    },
    {
      name: 'ZKSync',
      displayName: 'zkSync Era',
      apiEndpoint: 'https://api.blocknative.com/gasprices/blockprices?chainid=324',
      chainId: 324
    }
  ];

  const formatGasPrice = (price: number): string => {
    return price.toFixed(4);
  };

  const fetchGasPrice = async (chain: ChainConfig) => {
    try {
      const response = await fetch(chain.apiEndpoint, {
        headers: {
          'Authorization': '0a4b9baf-fd29-499a-be5f-730f6d5252a1'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Gas data for ${chain.name}:`, data);

      const estimatedPrices = data.blockPrices[0].estimatedPrices;
      return estimatedPrices.map((price: any) => ({
        priorityFee: formatGasPrice(price.maxPriorityFeePerGas),
        maxFee: formatGasPrice(price.maxFeePerGas),
        probability: price.confidence,
        chainName: chain.name
      }));
    } catch (err) {
      console.error(`Error fetching gas price for ${chain.name}:`, err);
      return null;
    }
  };

  useEffect(() => {
    const fetchAllGasPrices = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(chains.map(chain => fetchGasPrice(chain)));
        const validResults = results.filter(result => result !== null);
        
        if (validResults.length === 0) {
          throw new Error('Unable to fetch gas prices from any chain');
        }

        setGasData(validResults.flat());
      } catch (err) {
        console.error('Error fetching gas prices:', err);
        setError('Failed to fetch gas prices');
      } finally {
        setLoading(false);
      }
    };

    fetchAllGasPrices();
    const interval = setInterval(fetchAllGasPrices, 10000); // 更新间隔改为10秒

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentChainIndex(prev => (prev + 1) % chains.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !gasData.length) {
    return <div className="gas-price-container loading">Loading gas prices...</div>;
  }

  if (error) {
    return <div className="gas-price-container error">{error}</div>;
  }

  const currentChainData = gasData.filter(data => data.chainName === chains[currentChainIndex].name);
  const currentChain = chains[currentChainIndex];

  return (
    <div className="gas-price-container">
      <div className="gas-price-header">
        <h2>{currentChain.displayName} Gas Prices</h2>
        <div className="chain-id">Chain ID: {currentChain.chainId}</div>
      </div>
      <div className="speed-indicator">
        <span>FASTER</span>
        <span>SLOWER</span>
      </div>
      <div className="gas-price-grid">
        {currentChainData.map((price, index) => (
          <div key={index} className="gas-price-card">
            <div className="priority-fee-label">priority fee</div>
            <div className="priority-fee">{price.priorityFee}</div>
            <div className="max-fee-label">max fee</div>
            <div className="max-fee">{price.maxFee}</div>
            <div className={`probability probability-${Math.floor(price.probability / 10) * 10}`}>
              {price.probability}% Probability
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GasPrice;
