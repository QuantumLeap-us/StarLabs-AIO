package extra

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

const baseURL = "http://104.194.129.75:8080"

const CurrentSoftVersion = "0.96"

type KeyRequest struct {
	Count int `json:"count"`
}

type KeyValueRequest struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

func checkKey(key, value string) bool {
	request := KeyValueRequest{Key: key, Value: value}
	body, _ := json.Marshal(request)
	req, _ := http.NewRequest("POST", baseURL+"/check-key", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Unable to check the license. Try using VPN or VPS server.")
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false
	} else {
		return true
	}

}

func Auth(hwid, key string) bool {
	return checkKey(key, hwid)
}
