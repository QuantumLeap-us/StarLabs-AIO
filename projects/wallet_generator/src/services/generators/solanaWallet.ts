import { Keypair } from '@solana/web3.js';
import type { GeneratedWallet } from '../../types';

export class SolanaWalletGenerator {
  async generate(): Promise<GeneratedWallet> {
    const keypair = Keypair.generate();
    
    return {
      network: 'solana',
      address: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString('hex'),
      timestamp: new Date().toISOString()
    };
  }
}
