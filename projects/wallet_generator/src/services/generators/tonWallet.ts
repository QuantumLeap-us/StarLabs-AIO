import { KeyPair, mnemonicToPrivateKey, mnemonicNew } from '@ton/crypto';
import type { GeneratedWallet } from '../../types';

export class TONWalletGenerator {
  async generate(): Promise<GeneratedWallet> {
    const mnemonic = await mnemonicNew();
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const publicKey = Buffer.from(keyPair.publicKey).toString('hex');
    const privateKey = Buffer.from(keyPair.secretKey).toString('hex');
    
    return {
      network: 'ton',
      address: publicKey,
      privateKey: privateKey,
      timestamp: new Date().toISOString()
    };
  }
}
