export interface WalletConfig {
  network: 'evm' | 'ton' | 'sui' | 'solana' | 'ibc';
  chain?: string;
  amount: number;
}

export interface GeneratedWallet {
  network: string;
  chain?: string;
  address: string;
  privateKey?: string;
  mnemonic?: string;
  chainId?: string;
  prefix?: string;
  denom?: string;
}

export interface WalletGenerator {
  generateWallets(config: WalletConfig): Promise<GeneratedWallet[]>;
}
