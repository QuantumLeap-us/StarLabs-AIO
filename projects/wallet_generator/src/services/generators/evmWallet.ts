import { ethers } from 'ethers';
import type { GeneratedWallet } from '../../types';

export class EVMWalletGenerator {
  async generate(): Promise<GeneratedWallet> {
    const wallet = ethers.Wallet.createRandom();
    
    return {
      network: 'evm',
      address: wallet.address,
      privateKey: wallet.privateKey,
      timestamp: new Date().toISOString()
    };
  }
}
