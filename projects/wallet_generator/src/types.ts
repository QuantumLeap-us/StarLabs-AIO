export interface WalletConfig {
  network: 'ton' | 'sui' | 'solana' | 'evm' | 'ibc';
  amount: number;
}

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  network: string;
  timestamp: string;
}

export interface WalletGeneratorState {
  isGenerating: boolean;
  error: string | null;
  wallets: GeneratedWallet[];
}
