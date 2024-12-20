package x_actions

import (
    "encoding/json"
    "net/http"
    "twitter/extra"
    "twitter/instance"
)

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

type CommentRequest struct {
    AuthToken  string `json:"auth_token"`
    Proxy      string `json:"proxy"`
    Content    string `json:"content"`
    TweetLink  string `json:"tweet_link"`
}

func (h *Handler) HandleComment(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")

    if r.Method != http.MethodPost {
        json.NewEncoder(w).Encode(Response{
            Status:    false,
            Logs:     []string{"Method not allowed"},
            ErrorType: ErrorTypeUnknown,
        })
        return
    }

    var req CommentRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        json.NewEncoder(w).Encode(Response{
            Status:    false,
            Logs:     []string{"Invalid request body"},
            ErrorType: ErrorTypeUnknown,
        })
        return
    }

    twitter := instance.Twitter{}
    
    ok, reason, logs := twitter.InitTwitter(1, req.AuthToken, req.Proxy, h.config, h.queryIDs)
    if !ok {
        errorType := ErrorTypeUnknown
        switch reason {
        case "locked":
            errorType = ErrorTypeLocked
        case "failed_auth":
            errorType = ErrorTypeUnauthenticated
        }
        
        json.NewEncoder(w).Encode(Response{
            Status:    false,
            Logs:     append(logs, "Failed to initialize Twitter client: "+reason),
            ErrorType: errorType,
        })
        return
    }

    success, errorType, commentLogs := twitter.Comment(req.Content, req.TweetLink)

    json.NewEncoder(w).Encode(Response{
        Status:    success,
        Data:      map[string]interface{}{"username": twitter.Username},
        Logs:      append(logs, commentLogs...),
        ErrorType: errorType,
    })
}