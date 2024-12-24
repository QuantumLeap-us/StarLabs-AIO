import type { WalletConfig, GeneratedWallet } from '../types';

class WalletGeneratorAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://localhost:3000'; // Update this with your actual API endpoint
  }

  async generateWallets(config: WalletConfig): Promise<GeneratedWallet[]> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to generate wallets');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating wallets:', error);
      throw error;
    }
  }
}

export const walletGeneratorAPI = new WalletGeneratorAPI();
