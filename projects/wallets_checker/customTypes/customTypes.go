package customTypes

import (
	"math/big"
)

type RequestParamsStruct struct {
	AccountHeader string
	Nonce         string
	Signature     string
	Timestamp     string
}

type TokenBalancesResultData struct {
	Amount          *big.Float `json:"amount"`
	Name            string     `json:"name"`
	ContractAddress string     `json:"contract_address"`
	BalanceUSD      *big.Float `json:"balance_usd"`
}

type PoolBalancesResultData struct {
	Amount     *big.Float `json:"amount"`
	Name       string     `json:"name"`
	BalanceUSD *big.Float `json:"balance_usd"`
}

type NftBalancesResultData struct {
	Amount     *big.Float `json:"amount"`
	Name       string     `json:"name"`
	BalanceUSD *big.Float `json:"price_usd"`
}

type RabbyReturnData struct {
	ChainName    string  `json:"chain_name"`
	ChainBalance float64 `json:"chain_balance"`
}

type ConfigStruct struct {
	DebankConfig struct {
		ParseTokens bool `json:"parse_tokens"`
		ParseNfts   bool `json:"parse_nfts"`
		ParsePools  bool `json:"parse_pools"`
	} `json:"debank_config"`
}

type TokenData struct {
	Name            string     `json:"name"`
	BalanceUSD      *big.Float `json:"balance_usd"`
	Amount          *big.Float `json:"amount"`
	ContractAddress string     `json:"contract_address"`
}

type ChainTokens struct {
	ChainName string      `json:"chain_name"`
	Tokens    []TokenData `json:"tokens"`
}

type NftData struct {
	Name       string     `json:"name"`
	PriceUSD   *big.Float `json:"price_usd"`
	Amount     *big.Float `json:"amount"`
}

type ChainNfts struct {
	ChainName string    `json:"chain_name"`
	Nfts      []NftData `json:"nfts"`
}

type PoolData struct {
	Name       string     `json:"name"`
	BalanceUSD *big.Float `json:"balance_usd"`
	Amount     *big.Float `json:"amount"`
}

type ProtocolPools struct {
	ProtocolName string     `json:"protocol_name"`
	Pools        []PoolData `json:"pools"`
}

type ChainPools struct {
	ChainName string          `json:"chain_name"`
	Protocols []ProtocolPools `json:"protocols"`
}

type TokensData struct {
	Quantity int           `json:"quantity"`
	Data     []ChainTokens `json:"data"`
}

type NFTsData struct {
	Quantity int         `json:"quantity"`
	Data     []ChainNfts `json:"data"`
}

type PoolsData struct {
	Quantity int         `json:"quantity"`
	Data     []ChainPools `json:"data"`
}

type ServerResponse struct {
	WalletAddress string     `json:"wallet_address"`
	WalletData    string     `json:"wallet_data"`
	TotalBalance  float64    `json:"total_balance"`
	Tokens        TokensData `json:"tokens"`
	NFTs          NFTsData  `json:"nfts"`
	Pools         PoolsData `json:"pools"`
}
