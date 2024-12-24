import type { GeneratedWallet } from "./types";

export class BaseWalletGenerator {
  protected timestamp: string;

  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  }

  async generateBulkWallets(count: number, networkName: string) {
    const wallets: GeneratedWallet[] = [];
    console.log(`Starting generation of ${count} ${networkName} wallet(s)...`);

    try {
      for (let i = 0; i < count; i++) {
        const wallet = await this.generateWallet();
        wallets.push({ 
          ...wallet, 
          network: networkName, 
          timestamp: this.timestamp 
        });
        console.log(`Generated ${i + 1}/${count} wallet(s)`);
      }

      console.log("Wallet generation completed!");
      return wallets;
    } catch (error) {
      console.error(`Error during ${networkName} bulk generation:`, error);
      throw error;
    }
  }

  async generateWallet(): Promise<Omit<GeneratedWallet, 'network' | 'timestamp'>> {
    throw new Error("generateWallet method must be implemented");
  }
}

export default BaseWalletGenerator;
