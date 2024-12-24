import { Keypair } from '@solana/web3.js';
import { WalletGenerator, WalletConfig, GeneratedWallet } from '../../../modules/wallet_generator/types';
import * as bs58 from 'bs58';

export class SolanaWalletGenerator implements WalletGenerator {
  async generateWallets(config: WalletConfig): Promise<GeneratedWallet[]> {
    const wallets: GeneratedWallet[] = [];
    
    for (let i = 0; i < config.amount; i++) {
      try {
        const keypair = Keypair.generate();
        wallets.push({
          network: 'solana',
          address: keypair.publicKey.toString(),
          privateKey: bs58.encode(keypair.secretKey)
        });
      } catch (error) {
        console.error(`Error generating Solana wallet: ${error.message}`);
        throw error;
      }
    }

    return wallets;
  }
}
