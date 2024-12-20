package x_actions

import (
	"encoding/json"
	"fmt"
	"net/http"
	"twitter/instance"
)

type FollowRequest struct {
	AuthToken string `json:"auth_token"`
	Proxy     string `json:"proxy"`
	Username  string `json:"username"`
}

type UnfollowRequest struct {
	AuthToken string `json:"auth_token"`
	Proxy     string `json:"proxy"`
	UserID    string `json:"user_id"`
}

func (h *Handler) HandleFollow(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(Response{
			Status:    false,
			Logs:      []string{"Method not allowed"},
			ErrorType: ErrorTypeUnknown,
		})
		return
	}

	var req FollowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(Response{
			Status:    false,
			Logs:      []string{"Invalid request body"},
			ErrorType: ErrorTypeUnknown,
		})
		return
	}
	fmt.Println(req)
	twitter := instance.Twitter{}

	ok, reason, logs := twitter.InitTwitter(1, req.AuthToken, req.Proxy, h.config, h.queryIDs)
	fmt.Println(ok, reason, logs)
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

	success, errorType, followLogs := twitter.Follow(req.Username)

	json.NewEncoder(w).Encode(Response{
		Status:    success,
		Data:      map[string]interface{}{"username": twitter.Username},
		Logs:      append(logs, followLogs...),
		ErrorType: errorType,
	})
}

func (h *Handler) HandleUnfollow(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(Response{
			Status:    false,
			Logs:      []string{"Method not allowed"},
			ErrorType: ErrorTypeUnknown,
		})
		return
	}

	var req UnfollowRequest
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

	success, errorType, unfollowLogs := twitter.Unfollow(req.UserID)

	json.NewEncoder(w).Encode(Response{
		Status:    success,
		Data:      map[string]interface{}{"username": twitter.Username},
		Logs:      append(logs, unfollowLogs...),
		ErrorType: errorType,
	})
}
