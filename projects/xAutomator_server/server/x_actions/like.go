package x_actions

import (
	"encoding/json"
	"fmt"
	"net/http"
	"twitter/instance"
)

type LikeRequest struct {
	AuthToken string `json:"auth_token"`
	Proxy     string `json:"proxy"`
	TweetLink string `json:"tweet_link"`
}

type UnlikeRequest struct {
	AuthToken string `json:"auth_token"`
	Proxy     string `json:"proxy"`
	TweetLink string `json:"tweet_link"`
}

func (h *Handler) HandleLike(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(Response{
			Status:    false,
			Logs:      []string{"Method not allowed"},
			ErrorType: ErrorTypeUnknown,
		})
		return
	}

	var req LikeRequest
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
	fmt.Println(req.TweetLink)
	success, errorType, likeLogs := twitter.Like(req.TweetLink)

	json.NewEncoder(w).Encode(Response{
		Status:    success,
		Data:      map[string]interface{}{"username": twitter.Username},
		Logs:      append(logs, likeLogs...),
		ErrorType: errorType,
	})
}

func (h *Handler) HandleUnlike(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(Response{
			Status:    false,
			Logs:      []string{"Method not allowed"},
			ErrorType: ErrorTypeUnknown,
		})
		return
	}

	var req UnlikeRequest
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

	success, errorType, unlikeLogs := twitter.Unlike(req.TweetLink)

	json.NewEncoder(w).Encode(Response{
		Status:    success,
		Data:      map[string]interface{}{"username": twitter.Username},
		Logs:      append(logs, unlikeLogs...),
		ErrorType: errorType,
	})
}
