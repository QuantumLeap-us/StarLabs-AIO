package core

import (
	"debank_checker_v3/customTypes"
	"debank_checker_v3/utils"
	"encoding/json"
	"fmt"
	"github.com/valyala/fasthttp"
	"log"
	"net/url"
	"sort"
	"math/big"
)

func SortByChainBalance(data []customTypes.RabbyReturnData) {
	sort.Slice(data, func(i, j int) bool {
		// Sort in descending order by ChainBalance
		return data[i].ChainBalance > data[j].ChainBalance
	})
}

func getTotalBalance(accountAddress string, proxies []string) (float64, []customTypes.RabbyReturnData) {
	baseURL := "https://api.rabby.io/v1/user/total_balance"
	params := url.Values{}
	params.Set("id", accountAddress)

	type chainList struct {
		Name       string  `json:"name"`
		Token      string  `json:"native_token_id"`
		UsdBalance float64 `json:"usd_value"`
	}

	type responseStruct struct {
		ErrorCode     int         `json:"error_code"`
		TotalUsdValue float64     `json:"total_usd_value"`
		ChainList     []chainList `json:"chain_list"`
		Message       string      `json:"message,omitempty"`
	}

	for {
		client := GetClient(proxies)
		var result []customTypes.RabbyReturnData

		req := fasthttp.AcquireRequest()
		defer fasthttp.ReleaseRequest(req)
		req.SetRequestURI(fmt.Sprintf("%s?%s", baseURL, params.Encode()))
		req.Header.SetMethod(fasthttp.MethodGet)
		req.Header.Set("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
		req.Header.Set("accept-language", "\nru,en;q=0.9,vi;q=0.8,es;q=0.7,cy;q=0.6")
		resp := fasthttp.AcquireResponse()
		defer fasthttp.ReleaseResponse(resp)

		if err := client.Do(req, resp); err != nil {
			log.Printf("%s | Request Error: %s", accountAddress, err)
			continue
		}

		if resp.StatusCode() == 429 || resp.StatusCode() == 403 {
			log.Printf("%s | Rate Limited", accountAddress)
			continue
		}

		responseData := &responseStruct{}

		if err := json.Unmarshal(resp.Body(), &responseData); err != nil {
			log.Printf("%s | Failed To Parse JSON Response: %s", accountAddress, err)
			continue
		}

		if responseData.Message == "Too Many Requests" {
			log.Printf("%s | Rate Limited", accountAddress)
			continue
		}

		totalUsdBalance := responseData.TotalUsdValue

		for _, currentChain := range responseData.ChainList {
			if currentChain.UsdBalance <= 0 {
				continue
			}

			result = append(result, customTypes.RabbyReturnData{ChainName: currentChain.Name,
				ChainBalance: currentChain.UsdBalance})
		}

		return totalUsdBalance, result
	}
}

func ParseRabbyAccount(accountData string, proxies []string) (*customTypes.ServerResponse, error) {
	accountAddress, err := utils.GetAccountAddress(accountData)
	if err != nil {
		return nil, err
	}

	totalUsdBalance, chainBalances := getTotalBalance(accountAddress, proxies)
	SortByChainBalance(chainBalances)

	response := &customTypes.ServerResponse{
		WalletAddress: accountAddress,
		WalletData:    accountData,
		TotalBalance:  totalUsdBalance,
	}

	// Инициализируем пустые структуры для токенов, NFT и пулов
	chainTokens := make([]customTypes.ChainTokens, 0)
	totalTokens := 0

	// Преобразуем RabbyReturnData в формат ChainTokens
	for _, chainBalance := range chainBalances {
		chainTokens = append(chainTokens, customTypes.ChainTokens{
			ChainName: chainBalance.ChainName,
			Tokens: []customTypes.TokenData{
				{
					Name:            chainBalance.ChainName + " Native Token",
					BalanceUSD:      big.NewFloat(chainBalance.ChainBalance),
					Amount:          big.NewFloat(0), // У нас нет этих данных из Rabby
					ContractAddress: "", // У нас нет этих данных из Rabby
				},
			},
		})
		totalTokens++
	}

	// Заполняем данные о токенах
	response.Tokens.Quantity = totalTokens
	response.Tokens.Data = chainTokens

	// Инициализируем пустые NFT и пулы
	response.NFTs.Quantity = 0
	response.NFTs.Data = []customTypes.ChainNfts{}
	response.Pools.Quantity = 0
	response.Pools.Data = []customTypes.ChainPools{}

	log.Printf("%s | Total USD Balance: %f $", accountAddress, totalUsdBalance)
	return response, nil
}