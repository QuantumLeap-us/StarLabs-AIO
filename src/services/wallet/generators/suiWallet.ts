import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { WalletGenerator, WalletConfig, GeneratedWallet } from '../../../modules/wallet_generator/types';
import { fromB64 } from "@mysten/sui.js/utils";
import * as fs from 'fs';

export class SUIWalletGenerator implements WalletGenerator {
  private client: SuiClient;

  constructor() {
    this.client = new SuiClient({ url: getFullnodeUrl("mainnet") });
  }

  async generateWallets(config: WalletConfig): Promise<GeneratedWallet[]> {
    const wallets: GeneratedWallet[] = [];
    
    for (let i = 0; i < config.amount; i++) {
      try {
        const keypair = new Ed25519Keypair();
        const address = keypair.getPublicKey().toSuiAddress();
        const exportedKeypair = keypair.export();

        wallets.push({
          network: 'sui',
          address: address,
          privateKey: exportedKeypair.privateKey,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error generating SUI wallet: ${error.message}`);
        throw error;
      }
    }

    return wallets;
  }

  async fromPrivateKey(privateKey: string): Promise<GeneratedWallet> {
    try {
      const secretKey = Buffer.from(privateKey, 'base64');
      const keypair = Ed25519Keypair.fromSecretKey(secretKey);

      return {
        network: 'sui',
        address: keypair.getPublicKey().toSuiAddress(),
        privateKey: privateKey,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error importing SUI wallet: Invalid private key`);
    }
  }

  async fromMnemonic(mnemonicPhrase: string): Promise<GeneratedWallet> {
    throw new Error('SUI wallet does not support mnemonic import');
  }

  async generateBulkWallets(count: number, network: string) {
    try {
      const wallets = [];
      console.log(`\nStarting generation of ${count} ${network} wallet(s)...`);

      for (let i = 0; i < count; i++) {
        const wallet = await this.generateWallets({ amount: 1 });
        wallets.push(wallet[0]);
        console.log(`Generated wallet ${i + 1}/${count}`);
      }

      // 保存到文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const detailsFileName = `${network.toLowerCase()}_wallet_details_${timestamp}.txt`;
      const addressesFileName = `${network.toLowerCase()}_addresses_${timestamp}.txt`;

      const detailsContent = wallets
        .map(
          (wallet, index) =>
            `Wallet #${index + 1}\n` +
            `Network: ${network}\n` +
            `Address: ${wallet.address}\n` +
            `Private Key: ${wallet.privateKey}\n` +
            "-".repeat(50) +
            "\n"
        )
        .join("\n");

      const addressesContent = wallets.map((wallet) => wallet.address).join("\n");

      await Promise.all([
        fs.writeFile(detailsFileName, detailsContent),
        fs.writeFile(addressesFileName, addressesContent),
      ]);

      console.log("\nGeneration completed successfully!");
      console.log(`Full details saved to: ${detailsFileName}`);
      console.log(`Addresses only saved to: ${addressesFileName}`);
    } catch (error) {
      console.error("Error generating wallets:", error);
      throw error;
    }
  }
}
