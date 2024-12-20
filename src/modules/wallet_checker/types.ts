export interface Token {
  name: string;
  balance_usd: string;
  amount: string;
  contract_address: string;
}

export interface NFT {
  name: string;
  price_usd: string;
  amount: string;
}

export interface Protocol {
  protocol_name: string;
  pools: Pool[];
}

export interface Pool {
  name: string;
  balance_usd: string;
  amount: string;
}

export interface TokenData {
  quantity: number;
  data: ChainTokens[];
}

export interface NFTData {
  quantity: number;
  data: ChainNFTs[];
}

export interface PoolData {
  quantity: number;
  data: ChainPools[];
}

export interface ChainTokens {
  chain_name: string;
  tokens: Token[];
}

export interface ChainNFTs {
  chain_name: string;
  nfts: NFT[];
}

export interface ChainPools {
  chain_name: string;
  protocols: Protocol[];
}

export interface WalletAccount {
  address: string;
  account_data: string;
  balance: number;
  tokens: TokenData;
  proxy: string[];
  last_check: number;
  nfts: NFTData;
  pools: PoolData;
}

export interface WalletBase {
  accounts_name: string;
  accounts: WalletAccount[];
} 