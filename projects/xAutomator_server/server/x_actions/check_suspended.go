package x_actions

import (
	"encoding/json"
	"log"
	"net/http"
	"twitter/instance"
)

type CheckSuspendedRequest struct {
	AuthToken string `json:"auth_token"`
	Proxy     string `json:"proxy"`
}

func (h *Handler) HandleCheckSuspended(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received check_suspended request from %s", r.RemoteAddr)
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(Response{
				Status:    false,
				Logs:      []string{"Method not allowed"},
				ErrorType: ErrorTypeUnknown,
			})
		return
	}

	var req CheckSuspendedRequest
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

	success, errorType, checkLogs, _, creationDate := twitter.CheckSuspended()

	json.NewEncoder(w).Encode(Response{
		Status: success,
		Data: map[string]interface{}{
			"username":      twitter.Username,
			"creation_date": creationDate,
		},
		Logs:      append(logs, checkLogs...),
		ErrorType: errorType,
	})
}
