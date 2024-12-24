import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import type { GeneratedWallet } from '../../types';

export class SUIWalletGenerator {
  async generate(): Promise<GeneratedWallet> {
    const keypair = new Ed25519Keypair();
    const address = keypair.getPublicKey().toSuiAddress();
    
    return {
      network: 'sui',
      address: address,
      privateKey: Buffer.from(keypair.export().privateKey, 'base64').toString('hex'),
      timestamp: new Date().toISOString()
    };
  }
}
