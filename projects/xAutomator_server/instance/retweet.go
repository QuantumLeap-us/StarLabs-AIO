package instance

import (
	"encoding/json"
	"fmt"

	http "github.com/bogdanfinn/fhttp"

	"io"
	"strings"
	"twitter/instance/additional_twitter_methods"
)

// Retweet performs a retweet action
func (twitter *Twitter) Retweet(tweetLink string) (bool, string, []string) {
	var logs []string
	errorType := "Unknown"

	retweetURL := fmt.Sprintf("https://twitter.com/i/api/graphql/%s/CreateRetweet", twitter.queryID.RetweetID)
	tweetID := additional_twitter_methods.GetTweetID(tweetLink)
	if tweetID == "" {
		logs = append(logs, "Invalid tweet link")
		return false, errorType, logs
	}
	fmt.Println(tweetID)

	for i := 0; i < twitter.config.Info.MaxTasksRetries; i++ {
		var stringData = fmt.Sprintf(`{"variables":{"tweet_id":"%s","dark_request":false},"queryId":"%s"}`, tweetID, twitter.queryID.RetweetID)
		data := strings.NewReader(stringData)

		// Create new request
		req, err := http.NewRequest("POST", retweetURL, data)
		if err != nil {
			logs = append(logs, fmt.Sprintf("Failed to build retweet request: %s", err.Error()))
			continue
		}
		req.Header = http.Header{
			"accept":                {"*/*"},
			"accept-encoding":       {"gzip, deflate, br"},
			"authorization":         {twitter.queryID.BearerToken},
			"content-type":          {"application/json"},
			"cookie":                {twitter.cookies.CookiesToHeader()},
			"origin":                {"https://twitter.com"},
			"referer":               {tweetLink},
			"sec-ch-ua-mobile":      {"?0"},
			"sec-ch-ua-platform":    {`"Windows"`},
			"sec-fetch-dest":        {"empty"},
			"sec-fetch-mode":        {"cors"},
			"sec-fetch-site":        {"same-origin"},
			"x-csrf-token":          {twitter.ct0},
			"x-twitter-active-user": {"yes"},
			"x-twitter-auth-type":   {"OAuth2Session"},
			http.HeaderOrderKey: {
				"accept",
				"accept-encoding",
				"authorization",
				"content-type",
				"cookie",
				"origin",
				"referer",
				"sec-ch-ua-mobile",
				"sec-ch-ua-platform",
				"sec-fetch-dest",
				"sec-fetch-mode",
				"sec-fetch-site",
				"user-agent",
				"x-csrf-token",
				"x-twitter-active-user",
				"x-twitter-auth-type",
			},
			http.PHeaderOrderKey: {":authority", ":method", ":path", ":scheme"},
		}

		resp, err := twitter.client.Do(req)
		if err != nil {
			logs = append(logs, fmt.Sprintf("Failed to do retweet request: %s", err.Error()))
			continue
		}
		defer resp.Body.Close()

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			logs = append(logs, fmt.Sprintf("Failed to read retweet response body: %s", err.Error()))
			continue
		}

		bodyString := string(bodyBytes)

		if resp.StatusCode >= 200 && resp.StatusCode <= 299 {
			if strings.Contains(bodyString, "already") {
				var responseAlreadyLike alreadyLikedResponse
				err = json.Unmarshal(bodyBytes, &responseAlreadyLike)
				if err != nil {
					logs = append(logs, fmt.Sprintf("Failed to unmarshal already retweeted response: %s", err.Error()))
					continue
				}
				logs = append(logs, fmt.Sprintf("%s already retweeted tweet %s", twitter.Username, tweetID))
				return true, "", logs
			} else if strings.Contains(bodyString, "create_retweet") {
				var responseRetweet retweetResponse
				err = json.Unmarshal(bodyBytes, &responseRetweet)
				if err != nil {
					logs = append(logs, fmt.Sprintf("Failed to unmarshal retweeted response: %s", err.Error()))
					continue
				}
				logs = append(logs, fmt.Sprintf("%s retweeted tweet %s", twitter.Username, tweetID))
				return true, "", logs
			}

		} else if strings.Contains(bodyString, "this account is temporarily locked") {
			logs = append(logs, "Account is temporarily locked")
			return false, "Locked", logs

		} else if strings.Contains(bodyString, "Could not authenticate you") {
			logs = append(logs, "Could not authenticate you")
			return false, "Unauthenticated", logs
		} else {
			logs = append(logs, fmt.Sprintf("Unknown response while retweet: %s", bodyString))
			continue
		}
	}

	logs = append(logs, "Unable to do retweet")
	return false, errorType, logs
}

func (twitter *Twitter) Unretweet(tweetLink string) (bool, string, []string) {
	var logs []string
	errorType := "Unknown"

	unretweetURL := fmt.Sprintf("https://twitter.com/i/api/graphql/%s/DeleteRetweet", twitter.queryID.UnretweetID)
	tweetID := additional_twitter_methods.GetTweetID(tweetLink)
	if tweetID == "" {
		logs = append(logs, "Invalid tweet link")
		return false, errorType, logs
	}

	for i := 0; i < twitter.config.Info.MaxTasksRetries; i++ {
		var stringData = fmt.Sprintf(`{"variables":{"source_tweet_id":"%s","dark_request":false},"queryId":"%s"}`, tweetID, twitter.queryID.UnretweetID)
		data := strings.NewReader(stringData)

		req, err := http.NewRequest("POST", unretweetURL, data)
		if err != nil {
			logs = append(logs, fmt.Sprintf("Failed to build unretweet request: %s", err.Error()))
			continue
		}

		req.Header = http.Header{
			"accept":                {"*/*"},
			"accept-encoding":       {"gzip, deflate, br"},
			"authorization":         {twitter.queryID.BearerToken},
			"content-type":          {"application/json"},
			"cookie":                {twitter.cookies.CookiesToHeader()},
			"origin":                {"https://twitter.com"},
			"sec-ch-ua-mobile":      {"?0"},
			"sec-ch-ua-platform":    {`"Windows"`},
			"sec-fetch-dest":        {"empty"},
			"sec-fetch-mode":        {"cors"},
			"sec-fetch-site":        {"same-origin"},
			"x-csrf-token":          {twitter.ct0},
			"x-twitter-active-user": {"yes"},
			"x-twitter-auth-type":   {"OAuth2Session"},
			http.PHeaderOrderKey:    {":authority", ":method", ":path", ":scheme"},
		}

		resp, err := twitter.client.Do(req)
		if err != nil {
			logs = append(logs, fmt.Sprintf("Failed to do unretweet request: %s", err.Error()))
			continue
		}
		defer resp.Body.Close()

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			logs = append(logs, fmt.Sprintf("Failed to read unretweet response body: %s", err.Error()))
			continue
		}

		bodyString := string(bodyBytes)

		if resp.StatusCode >= 200 && resp.StatusCode <= 299 {
			if strings.Contains(bodyString, "already") {
				logs = append(logs, fmt.Sprintf("%s already unretweeted tweet %s", twitter.Username, tweetID))
				return true, "", logs
			} else if strings.Contains(bodyString, "unretweet") {
				logs = append(logs, fmt.Sprintf("%s unretweeted tweet %s", twitter.Username, tweetID))
				return true, "", logs
			}
		} else if strings.Contains(bodyString, "this account is temporarily locked") {
			logs = append(logs, "Account is temporarily locked")
			return false, "Locked", logs
		} else if strings.Contains(bodyString, "Could not authenticate you") {
			logs = append(logs, "Could not authenticate you")
			return false, "Unauthenticated", logs
		} else {
			logs = append(logs, fmt.Sprintf("Unknown response while unretweet: %s", bodyString))
			continue
		}
	}

	logs = append(logs, "Unable to do unretweet")
	return false, errorType, logs
}

type retweetResponse struct {
	Data struct {
		CreateRetweet struct {
			RetweetResults struct {
				Result struct {
					RestID string `json:"rest_id"`
					Legacy struct {
						FullText string `json:"full_text"`
					} `json:"legacy"`
				} `json:"result"`
			} `json:"retweet_results"`
		} `json:"create_retweet"`
	} `json:"data"`
}

// type alreadyRetweetedResponse struct {
// 	Errors []struct {
// 		Message   string `json:"message"`
// 		Locations []struct {
// 			Line   int `json:"line"`
// 			Column int `json:"column"`
// 		} `json:"locations"`
// 		Path       []string `json:"path"`
// 		Extensions struct {
// 			Name    string `json:"name"`
// 			Source  string `json:"source"`
// 			Code    int    `json:"code"`
// 			Kind    string `json:"kind"`
// 			Tracing struct {
// 				TraceID string `json:"trace_id"`
// 			} `json:"tracing"`
// 		} `json:"extensions"`
// 		Code    int    `json:"code"`
// 		Kind    string `json:"kind"`
// 		Name    string `json:"name"`
// 		Source  string `json:"source"`
// 		Tracing struct {
// 			TraceID string `json:"trace_id"`
// 		} `json:"tracing"`
// 	} `json:"errors"`
// 	Data struct {
// 	} `json:"data"`
// }

type unretweetResponse struct {
	Data struct {
		Unretweet struct {
			SourceTweetResults struct {
				Result struct {
					RestID string `json:"rest_id"`
					Legacy struct {
						FullText string `json:"full_text"`
					} `json:"legacy"`
				} `json:"result"`
			} `json:"source_tweet_results"`
		} `json:"unretweet"`
	} `json:"data"`
}
