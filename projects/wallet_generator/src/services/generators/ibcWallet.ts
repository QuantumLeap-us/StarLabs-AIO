import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import type { GeneratedWallet } from '../../types';

export class IBCWalletGenerator {
  async generate(): Promise<GeneratedWallet> {
    const wallet = await DirectSecp256k1HdWallet.generate(24);
    const [account] = await wallet.getAccounts();
    const privateKey = (await wallet.serialize('')).split('\"key\":\"')[1].split('\"')[0];
    
    return {
      network: 'ibc',
      address: account.address,
      privateKey: privateKey,
      timestamp: new Date().toISOString()
    };
  }
}
