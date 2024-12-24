import { Wallet } from 'ethers';
import { WalletGenerator, WalletConfig, GeneratedWallet } from '../../../modules/wallet_generator/types';

export interface GeneratedWallet {
  network: string;
  address: string;
  privateKey: string;
  mnemonic: string;
}

export class EVMWalletGenerator implements WalletGenerator {
  async generateWallets(config: WalletConfig): Promise<GeneratedWallet[]> {
    const wallets: GeneratedWallet[] = [];
    for (let i = 0; i < config.amount; i++) {
      const wallet = Wallet.createRandom();
      wallets.push({
        network: 'evm',
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase
      });
    }
    return wallets;
  }
}
