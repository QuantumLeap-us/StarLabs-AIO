import { EVMWalletGenerator } from './generators/evmWallet';
import { TONWalletGenerator } from './generators/tonWallet';
import { SUIWalletGenerator } from './generators/suiWallet';
import { SolanaWalletGenerator } from './generators/solanaWallet';
import { IBCWalletGenerator } from './generators/ibcWallet';
import type { WalletConfig, GeneratedWallet } from '../types';

class WalletService {
  private generators = {
    evm: new EVMWalletGenerator(),
    ton: new TONWalletGenerator(),
    sui: new SUIWalletGenerator(),
    solana: new SolanaWalletGenerator(),
    ibc: new IBCWalletGenerator(),
  };

  async generateWallet(config: WalletConfig): Promise<GeneratedWallet[]> {
    const generator = this.generators[config.network];
    if (!generator) {
      throw new Error(`Unsupported network: ${config.network}`);
    }

    const wallets: GeneratedWallet[] = [];
    for (let i = 0; i < config.amount; i++) {
      const wallet = await generator.generate();
      wallets.push(wallet);
    }

    return wallets;
  }
}

export const walletService = new WalletService();
export const generateWallet = (config: WalletConfig) => walletService.generateWallet(config);
