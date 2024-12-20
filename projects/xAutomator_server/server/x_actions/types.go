package x_actions

type Response struct {
    Status    bool        `json:"status"`
    Data     interface{} `json:"data"`
    Logs     []string    `json:"logs"`
    ErrorType string     `json:"error_type"`
}

const (
    ErrorTypeLocked         = "Locked"
    ErrorTypeUnauthenticated = "Unauthenticated"
    ErrorTypeUnknown        = "Unknown"
)