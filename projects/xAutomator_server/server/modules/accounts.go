package modules

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"twitter/extra"
)

type AccountsBase struct {
    AccountsName string        `json:"accounts_name"`
    Accounts     []AccountData `json:"accounts"`
}

type AccountData struct {
    Token  string `json:"token"`
    Proxy  string `json:"proxy"`
    Status string `json:"status"`
}

type EditAccountRequest struct {
    BaseName    string      `json:"base_name"`
    AccountData AccountData `json:"account_data"`
    Index       int         `json:"index"`
}

type DeleteAccountRequest struct {
    BaseName string `json:"base_name"`
    Index    int    `json:"index"`
}

type ReplaceBaseRequest struct {
    BaseName string      `json:"base_name"`
    Accounts []AccountData `json:"accounts"`
}

const accountsPath = "data/accounts"

func init() {
    // Создаем директорию если её нет
    if err := os.MkdirAll(accountsPath, 0755); err != nil {
        panic(err)
    }
}

type Handler struct {
    config   extra.Config
    queryIDs extra.QueryIDs
}

func NewHandler(config extra.Config, queryIDs extra.QueryIDs) *Handler {
    return &Handler{
        config:   config,
        queryIDs: queryIDs,
    }
}

func (h *Handler) HandleCreateAccountsBase(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var base AccountsBase
    if err := json.NewDecoder(r.Body).Decode(&base); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    // Проверяем наличие status для каждого аккаунта
    for i, account := range base.Accounts {
        if account.Status == "" {
            base.Accounts[i].Status = "active" // По умолчанию статус active
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

func (h *Handler) HandleGetAllBases(w http.ResponseWriter, r *http.Request) {
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

func (h *Handler) HandleDeleteBase(w http.ResponseWriter, r *http.Request) {
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

func (h *Handler) HandleEditAccount(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPut {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var req EditAccountRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    // Проверяем статус
    if req.AccountData.Status == "" {
        req.AccountData.Status = "active" // По умолчанию статус active
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

    base.Accounts[req.Index] = req.AccountData

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

func (h *Handler) HandleDeleteAccount(w http.ResponseWriter, r *http.Request) {
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

func (h *Handler) HandleReplaceBase(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPut {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var req ReplaceBaseRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    // Проверяем статус для каждого аккаунта
    for i, account := range req.Accounts {
        if account.Status == "" {
            req.Accounts[i].Status = "active" // По умолчанию статус active
        }
    }

    filePath := filepath.Join(accountsPath, req.BaseName+".json")
    
    if _, err := os.Stat(filePath); os.IsNotExist(err) {
        http.Error(w, "Base not found", http.StatusNotFound)
        return
    }

    newBase := AccountsBase{
        AccountsName: req.BaseName,
        Accounts:    req.Accounts,
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
