package modules

import (
	"debank_checker_v3/customTypes"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
)

type AccountsBase struct {
	AccountsName string        `json:"accounts_name"`
	Accounts     []AccountData `json:"accounts"`
}

type AccountData struct {
	AccountData string   `json:"account_data"`
	Address     string   `json:"address"`
	Balance     float64  `json:"balance"`
	Proxy       []string `json:"proxy"`
	LastCheck   int64    `json:"last_check"`
	
	// Используем те же структуры, что и в ServerResponse
	Tokens customTypes.TokensData `json:"tokens"`
	NFTs   customTypes.NFTsData  `json:"nfts"`
	Pools  customTypes.PoolsData `json:"pools"`
}

// Структуры для входных данных (упрощенные)
type InputAccountData struct {
	AccountData string   `json:"account_data"`
	Proxy       []string `json:"proxy"`
}

type CreateBaseRequest struct {
	AccountsName string            `json:"accounts_name"`
	Accounts     []InputAccountData `json:"accounts"`
}

type EditAccountRequest struct {
	BaseName    string          `json:"base_name"`
	AccountData InputAccountData `json:"account_data"`
	Index       int             `json:"index"`
}

type DeleteAccountRequest struct {
	BaseName string `json:"base_name"`
	Index    int    `json:"index"`
}

type ReplaceBaseRequest struct {
	BaseName string            `json:"base_name"`
	Accounts []InputAccountData `json:"accounts"`
}

const accountsPath = "data/accounts"

func init() {
	if err := os.MkdirAll(accountsPath, 0755); err != nil {
		panic(err)
	}
}

type AccountHandler struct{}

func NewAccountHandler() *AccountHandler {
	return &AccountHandler{}
}

func (h *AccountHandler) HandleCreateAccountsBase(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateBaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Создаем полную структуру базы
	base := AccountsBase{
		AccountsName: req.AccountsName,
		Accounts:     make([]AccountData, len(req.Accounts)),
	}

	// Заполняем данные для каждого аккаунта
	for i, inputAcc := range req.Accounts {
		base.Accounts[i] = AccountData{
			AccountData: inputAcc.AccountData,
			Address:    inputAcc.AccountData, // Используем account_data как адрес
			Proxy:      inputAcc.Proxy,
			Balance:    0,
			LastCheck:  0,
			Tokens: customTypes.TokensData{
				Quantity: 0,
				Data:     make([]customTypes.ChainTokens, 0),
			},
			NFTs: customTypes.NFTsData{
				Quantity: 0,
				Data:     make([]customTypes.ChainNfts, 0),
			},
			Pools: customTypes.PoolsData{
				Quantity: 0,
				Data:     make([]customTypes.ChainPools, 0),
			},
		}
	}

	filePath := filepath.Join(accountsPath, base.AccountsName+".json")
	data, err := json.MarshalIndent(base, "", "    ")
	if err != nil {
		http.Error(w, "Failed to marshal data", http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		http.Error(w, "Failed to write file", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AccountHandler) HandleGetAllBases(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	entries, err := os.ReadDir(accountsPath)
	if err != nil {
		http.Error(w, "Failed to read directory", http.StatusInternalServerError)
		return
	}

	var bases []AccountsBase
	for _, entry := range entries {
		if filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		data, err := os.ReadFile(filepath.Join(accountsPath, entry.Name()))
		if err != nil {
			continue
		}

		var base AccountsBase
		if err := json.Unmarshal(data, &base); err != nil {
			continue
		}
		bases = append(bases, base)
	}

	json.NewEncoder(w).Encode(bases)
}

func (h *AccountHandler) HandleDeleteBase(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	baseName := r.URL.Query().Get("name")
	if baseName == "" {
		http.Error(w, "Base name is required", http.StatusBadRequest)
		return
	}

	filePath := filepath.Join(accountsPath, baseName+".json")
	if err := os.Remove(filePath); err != nil {
		http.Error(w, "Failed to delete file", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AccountHandler) HandleEditAccount(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req EditAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	filePath := filepath.Join(accountsPath, req.BaseName+".json")
	data, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	var base AccountsBase
	if err := json.Unmarshal(data, &base); err != nil {
		http.Error(w, "Failed to parse file", http.StatusInternalServerError)
		return
	}

	if req.Index >= len(base.Accounts) {
		http.Error(w, "Invalid account index", http.StatusBadRequest)
		return
	}

	// Обновляем только account_data и proxy, сохраняем остальные данные
	oldAccount := base.Accounts[req.Index]
	base.Accounts[req.Index] = AccountData{
		AccountData: req.AccountData.AccountData,
		Address:    req.AccountData.AccountData,
		Proxy:      req.AccountData.Proxy,
		Balance:    oldAccount.Balance,
		LastCheck:  oldAccount.LastCheck,
		Tokens:     oldAccount.Tokens,
		NFTs:       oldAccount.NFTs,
		Pools:      oldAccount.Pools,
	}

	newData, err := json.MarshalIndent(base, "", "    ")
	if err != nil {
		http.Error(w, "Failed to marshal data", http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(filePath, newData, 0644); err != nil {
		http.Error(w, "Failed to write file", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AccountHandler) HandleDeleteAccount(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req DeleteAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	filePath := filepath.Join(accountsPath, req.BaseName+".json")
	data, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	var base AccountsBase
	if err := json.Unmarshal(data, &base); err != nil {
		http.Error(w, "Failed to parse file", http.StatusInternalServerError)
		return
	}

	if req.Index >= len(base.Accounts) {
		http.Error(w, "Invalid account index", http.StatusBadRequest)
		return
	}

	// Удаляем аккаунт по индексу
	base.Accounts = append(base.Accounts[:req.Index], base.Accounts[req.Index+1:]...)

	newData, err := json.MarshalIndent(base, "", "    ")
	if err != nil {
		http.Error(w, "Failed to marshal data", http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(filePath, newData, 0644); err != nil {
		http.Error(w, "Failed to write file", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AccountHandler) HandleReplaceBase(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ReplaceBaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Создаем новую базу с полными данными
	newBase := AccountsBase{
		AccountsName: req.BaseName,
		Accounts:     make([]AccountData, len(req.Accounts)),
	}

	// Заполняем данные для каждого аккаунта
	for i, inputAcc := range req.Accounts {
		newBase.Accounts[i] = AccountData{
			AccountData: inputAcc.AccountData,
			Address:    inputAcc.AccountData,
			Proxy:      inputAcc.Proxy,
			Balance:    0,
			LastCheck:  0,
			Tokens: customTypes.TokensData{
				Quantity: 0,
				Data:     make([]customTypes.ChainTokens, 0),
			},
			NFTs: customTypes.NFTsData{
				Quantity: 0,
				Data:     make([]customTypes.ChainNfts, 0),
			},
			Pools: customTypes.PoolsData{
				Quantity: 0,
				Data:     make([]customTypes.ChainPools, 0),
			},
		}
	}

	filePath := filepath.Join(accountsPath, req.BaseName+".json")
	
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "Base not found", http.StatusNotFound)
		return
	}

	data, err := json.MarshalIndent(newBase, "", "    ")
	if err != nil {
		http.Error(w, "Failed to marshal data", http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		http.Error(w, "Failed to write file", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
