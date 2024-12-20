package main

import (
	"debank_checker_v3/core"
	"debank_checker_v3/customTypes"
	"debank_checker_v3/modules"
	"debank_checker_v3/utils"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/rs/cors"
)

type RequestData struct {
	Account string                   `json:"account"`
	Proxy   []string                 `json:"proxy"`
	Type    string                   `json:"type"`
	Config  customTypes.ConfigStruct `json:"config"`
}

type ResponseData struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

func handleCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var reqData RequestData
	if err := json.NewDecoder(r.Body).Decode(&reqData); err != nil {
		http.Error(w, fmt.Sprintf("Error parsing request body: %v", err), http.StatusBadRequest)
		return
	}

	utils.ConfigFile = reqData.Config

	var result *customTypes.ServerResponse
	var err error

	switch reqData.Type {
	case "debank":
		result, err = core.ParseDebankAccount(reqData.Account, reqData.Proxy)
	case "rabby":
		result, err = core.ParseRabbyAccount(reqData.Account, reqData.Proxy)
	default:
		http.Error(w, "Invalid type. Must be 'debank' or 'rabby'", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Сохраняем результаты проверки в базу данных
	if err := saveCheckResults(result); err != nil {
		log.Printf("Error saving check results: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func saveCheckResults(result *customTypes.ServerResponse) error {
	const accountsPath = "data/accounts"
	entries, err := os.ReadDir(accountsPath)
	if err != nil {
		return fmt.Errorf("failed to read accounts directory: %v", err)
	}

	// Ищем аккаунт во всех базах
	for _, entry := range entries {
		if filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		filePath := filepath.Join(accountsPath, entry.Name())
		data, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}

		var base modules.AccountsBase
		if err := json.Unmarshal(data, &base); err != nil {
			continue
		}

		// Ищем аккаунт в текущей базе
		updated := false
		for i, acc := range base.Accounts {
			// Ищем аккаунт либо по адресу, либо по account_data
			if strings.EqualFold(acc.Address, result.WalletAddress) || 
			   strings.EqualFold(acc.AccountData, result.WalletData) {
				// Обновляем данные аккаунта
				base.Accounts[i].Address = result.WalletAddress // Сохраняем реальный адрес
				base.Accounts[i].Balance = result.TotalBalance
				base.Accounts[i].LastCheck = time.Now().Unix()
				base.Accounts[i].Tokens = result.Tokens
				base.Accounts[i].NFTs = result.NFTs
				base.Accounts[i].Pools = result.Pools
				updated = true
				break
			}
		}

		if updated {
			// Сохраняем обновленную базу
			newData, err := json.MarshalIndent(base, "", "    ")
			if err != nil {
				return fmt.Errorf("failed to marshal updated base: %v", err)
			}

			if err := os.WriteFile(filePath, newData, 0644); err != nil {
				return fmt.Errorf("failed to write updated base: %v", err)
			}
			break
		}
	}

	return nil
}

func main() {
	fmt.Printf("WebSite - nazavod.dev\nAntiDrain - antidrain.me\nTG - t.me/n4z4v0d\n\n")

	accountHandler := modules.NewAccountHandler()

	// Создаем новый mux
	mux := http.NewServeMux()

	// Регистрируем обработчики на mux вместо http.DefaultServeMux
	mux.HandleFunc("/check", handleCheck)
	mux.HandleFunc("/accounts/create", accountHandler.HandleCreateAccountsBase)
	mux.HandleFunc("/accounts/all", accountHandler.HandleGetAllBases)
	mux.HandleFunc("/accounts/delete", accountHandler.HandleDeleteBase)
	mux.HandleFunc("/accounts/edit", accountHandler.HandleEditAccount)
	mux.HandleFunc("/accounts/delete-one", accountHandler.HandleDeleteAccount)
	mux.HandleFunc("/accounts/replace", accountHandler.HandleReplaceBase)

	// Настраиваем CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:5174"}, // Добавляем порт 5174
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
		MaxAge:           int(12 * time.Hour.Seconds()),
	})

	// Оборачиваем наш mux в CORS handler
	handler := corsHandler.Handler(mux)

	port := ":4003"
	fmt.Printf("Server starting on port %s...\n", port)

	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
