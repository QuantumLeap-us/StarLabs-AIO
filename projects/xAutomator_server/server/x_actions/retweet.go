package x_actions

import (
	"encoding/json"
	"fmt"
	"net/http"
	"twitter/instance"
)

type RetweetRequest struct {
	AuthToken string `json:"auth_token"`
	Proxy     string `json:"proxy"`
	TweetLink string `json:"tweet_link"`
}

type UnretweetRequest struct {
	AuthToken string `json:"auth_token"`
	Proxy     string `json:"proxy"`
	TweetLink string `json:"tweet_link"`
}

func (h *Handler) HandleRetweet(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(Response{
			Status:    false,
			Logs:      []string{"Method not allowed"},
			ErrorType: ErrorTypeUnknown,
		})
		return
	}

	var req RetweetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(Response{
			Status:    false,
			Logs:      []string{"Invalid request body"},
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
			Logs:      append(logs, "Failed to initialize Twitter client: "+reason),
			ErrorType: errorType,
		})
		return
	}

	success, errorType, retweetLogs := twitter.Retweet(req.TweetLink)

	json.NewEncoder(w).Encode(Response{
		Status:    success,
		Data:      map[string]interface{}{"username": twitter.Username},
		Logs:      append(logs, retweetLogs...),
		ErrorType: errorType,
	})
}

func (h *Handler) HandleUnretweet(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(Response{
			Status:    false,
			Logs:      []string{"Method not allowed"},
			ErrorType: ErrorTypeUnknown,
		})
		return
	}

	var req UnretweetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(Response{
			Status:    false,
			Logs:      []string{"Invalid request body"},
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
			Logs:      append(logs, "Failed to initialize Twitter client: "+reason),
			ErrorType: errorType,
		})
		return
	}

	success, errorType, unretweetLogs := twitter.Unretweet(req.TweetLink)
	fmt.Println(success, errorType, unretweetLogs)
	json.NewEncoder(w).Encode(Response{
		Status:    success,
		Data:      map[string]interface{}{"username": twitter.Username},
		Logs:      append(logs, unretweetLogs...),
		ErrorType: errorType,
	})
}
