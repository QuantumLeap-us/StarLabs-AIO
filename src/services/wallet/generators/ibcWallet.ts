import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { BaseWalletGenerator } from "../../../modules/wallet_generator/baseWallet";
import type { GeneratedWallet } from "../../../modules/wallet_generator/types";
import { IBC_CHAINS } from "../../../../projects/wallet_generator/src/chains/ibc/index.js";

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

const chainPrefixes: { [key: string]: string } = {
  'Cosmos Hub': 'cosmos',
  'Osmosis': 'osmo',
  'Juno': 'juno',
  'Secret Network': 'secret',
  'Akash': 'akash',
  'Stargaze': 'stars',
  'Kava': 'kava',
  'Injective': 'inj',
  'Evmos': 'evmos',
  'Persistence': 'persistence',
  'Axelar': 'axelar',
  'Crescent': 'cre',
  'Stride': 'stride',
  'Umee': 'umee',
  'Fetch.ai': 'fetch',
  'Agoric': 'agoric',
  'AssetMantle': 'mantle',
  'Comdex': 'comdex',
  'Chihuahua': 'chihuahua',
  'Band Protocol': 'band',
  'Sifchain': 'sif',
  'Gravity Bridge': 'gravity',
  'IRISnet': 'iris',
  'Regen Network': 'regen',
  'Sentinel': 'sent'
};

export class IBCWalletGenerator extends BaseWalletGenerator {
  private chainInfo: IBCChain[];

  constructor() {
    super();
    this.chainInfo = IBC_CHAINS;
  }

  getAvailableChains() {
    return this.chainInfo;
  }

  async generate(chainName?: string): Promise<GeneratedWallet> {
    // 如果没有指定链名，默认使用 Cosmos Hub
    const selectedChain = chainName 
      ? this.chainInfo.find(chain => chain.name.toLowerCase() === chainName.toLowerCase()) 
      : this.chainInfo.find(chain => chain.name === "Cosmos Hub");

    if (!selectedChain) {
      throw new Error(`Chain ${chainName} not found. Available chains: ${this.chainInfo.map(c => c.name).join(', ')}`);
    }

    try {
      const wallet = await DirectSecp256k1HdWallet.generate(24, {
        prefix: selectedChain.prefix,
        hdPath: selectedChain.hdPath,
      });

      const [firstAccount] = await wallet.getAccounts();

      return {
        network: 'ibc',
        address: firstAccount.address,
        privateKey: wallet.mnemonic,
        timestamp: new Date().toISOString(),
        chain: selectedChain.name,
        chainId: selectedChain.chain_name,
        prefix: selectedChain.prefix,
        hdPath: selectedChain.hdPath,
        denom: selectedChain.denom,
        rpcEndpoint: selectedChain.apis?.rpc?.[0]?.address || "Not available",
        restEndpoint: selectedChain.apis?.rest?.[0]?.address || "Not available"
      };
    } catch (error) {
      throw new Error(`Error generating IBC wallet: ${error.message}`);
    }
  }

  async fromPrivateKey(mnemonic: string, chainName?: string): Promise<GeneratedWallet> {
    // 如果没有指定链名，默认使用 Cosmos Hub
    const selectedChain = chainName 
      ? this.chainInfo.find(chain => chain.name.toLowerCase() === chainName.toLowerCase())
      : this.chainInfo.find(chain => chain.name === "Cosmos Hub");

    if (!selectedChain) {
      throw new Error(`Chain ${chainName} not found. Available chains: ${this.chainInfo.map(c => c.name).join(', ')}`);
    }

    try {
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: selectedChain.prefix,
        hdPath: selectedChain.hdPath,
      });

      const [firstAccount] = await wallet.getAccounts();

      return {
        network: 'ibc',
        address: firstAccount.address,
        privateKey: mnemonic,
        timestamp: new Date().toISOString(),
        chain: selectedChain.name,
        chainId: selectedChain.chain_name,
        prefix: selectedChain.prefix,
        hdPath: selectedChain.hdPath,
        denom: selectedChain.denom,
        rpcEndpoint: selectedChain.apis?.rpc?.[0]?.address || "Not available",
        restEndpoint: selectedChain.apis?.rest?.[0]?.address || "Not available"
      };
    } catch (error) {
      throw new Error(`Error importing IBC wallet: Invalid mnemonic`);
    }
  }

  // 获取特定链的信息
  getChainInfo(chainName: string): IBCChain | undefined {
    return this.chainInfo.find(chain => chain.name.toLowerCase() === chainName.toLowerCase());
  }

  async generateWallets(config: { chain: string; amount: number }): Promise<GeneratedWallet[]> {
    if (!config.chain) {
      throw new Error('Chain must be specified for IBC wallet generation');
    }

    const prefix = chainPrefixes[config.chain];
    if (!prefix) {
      throw new Error(`Unsupported IBC chain: ${config.chain}`);
    }

    const wallets: GeneratedWallet[] = [];
    for (let i = 0; i < config.amount; i++) {
      const wallet = await DirectSecp256k1HdWallet.generate(24, {
        prefix: prefix,
      });
      
      const [account] = await wallet.getAccounts();
      const mnemonic = wallet.mnemonic;

      wallets.push({
        network: 'ibc',
        chain: config.chain,
        address: account.address,
        mnemonic: mnemonic,
        chainId: config.chain
      });
    }

    return wallets;
  }
}
