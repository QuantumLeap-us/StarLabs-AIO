package modules

import (
    "encoding/json"
    "net/http"
    "os"
)

type Config struct {
    TakeDataRandom      bool    `json:"take_data_random"`
    MaxTasksRetries     int     `json:"max_tasks_retries"`
    PauseBetweenTasks   []int   `json:"pause_between_tasks"`
    PauseBetweenAccounts []int  `json:"pause_between_accounts"`
}

type ScraperConfig struct {
    ScrapeBios                    bool `json:"scrape_bios"`
    ScrapeProfilePictures         bool `json:"scrape_profile_pictures"`
    ScrapeBackgrounds             bool `json:"scrape_backgrounds"`
    ScrapeNames                   bool `json:"scrape_names"`
    ScrapeIds                     bool `json:"scrape_ids"`
    ScrapeUsernames               bool `json:"scrape_usernames"`
    UseProxyForDownloadingPictures bool `json:"use_proxy_for_downloading_pictures"`
    OnlyVerifiedAccounts          bool `json:"only_verified_accounts"`
    
    MinimumFollowers             int  `json:"minimum_followers"`
    MinimumFollowings           int  `json:"minimum_followings"`
    MinimumFavourites           int  `json:"minimum_favourites"`
    MinimumTweets               int  `json:"minimum_tweets"`
}

func (h *Handler) HandleGetConfig(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    data, err := os.ReadFile("config.json")
    if err != nil {
        http.Error(w, "Failed to read config file", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.Write(data)
}

func (h *Handler) HandleUpdateConfig(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPut {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var config Config
    if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    data, err := json.MarshalIndent(config, "", "    ")
    if err != nil {
        http.Error(w, "Failed to marshal config", http.StatusInternalServerError)
        return
    }

    if err := os.WriteFile("config.json", data, 0644); err != nil {
        http.Error(w, "Failed to write config file", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *Handler) HandleGetScraperConfig(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    data, err := os.ReadFile("scraper_config.json")
    if err != nil {
        http.Error(w, "Failed to read scraper config file", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.Write(data)
}

func (h *Handler) HandleUpdateScraperConfig(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPut {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var config ScraperConfig
    if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    data, err := json.MarshalIndent(config, "", "    ")
    if err != nil {
        http.Error(w, "Failed to marshal scraper config", http.StatusInternalServerError)
        return
    }

    if err := os.WriteFile("scraper_config.json", data, 0644); err != nil {
        http.Error(w, "Failed to write scraper config file", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}