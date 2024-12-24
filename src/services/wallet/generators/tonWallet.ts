import TonWeb from 'tonweb';
import * as tonMnemonic from 'tonweb-mnemonic';
import { WalletGenerator, WalletConfig, GeneratedWallet } from '../../../modules/wallet_generator/types';

export class TONWalletGenerator implements WalletGenerator {
  private tonweb: any;

  constructor() {
    this.tonweb = new TonWeb();
  }

  async generateWallets(config: WalletConfig): Promise<GeneratedWallet[]> {
    const wallets: GeneratedWallet[] = [];
    
    for (let i = 0; i < config.amount; i++) {
      try {
        // 生成助记词
        const words = await tonMnemonic.generateMnemonic();
        // 从助记词生成种子
        const seed = await tonMnemonic.mnemonicToSeed(words);
        // 从种子生成密钥对
        const keyPair = TonWeb.utils.keyPairFromSeed(seed);

        // 创建 v4r2 钱包
        const WalletClass = this.tonweb.wallet.all['v4R2'];
        const wallet = new WalletClass(this.tonweb.provider, {
          publicKey: keyPair.publicKey,
        });

        // 获取地址
        const address = await wallet.getAddress();
        const addressString = address.toString(true, true, false);

        wallets.push({
          network: 'ton',
          address: addressString,
          mnemonic: words.join(' ')
        });
      } catch (error) {
        console.error(`Error generating TON wallet: ${error.message}`);
        throw error;
      }
    }

    return wallets;
  }
}
