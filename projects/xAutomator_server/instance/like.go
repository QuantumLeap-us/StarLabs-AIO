package instance

import (
	"encoding/json"
	"fmt"
	http "github.com/bogdanfinn/fhttp"

	"io"
	"strings"

	"twitter/instance/additional_twitter_methods"
)

// Like press like button
func (twitter *Twitter) Like(tweetLink string) (bool, string, []string) {
	var logs []string
	errorType := "Unknown"
	
	likeURL := fmt.Sprintf("https://twitter.com/i/api/graphql/%s/FavoriteTweet", twitter.queryID.LikeID)
	tweetID := additional_twitter_methods.GetTweetID(tweetLink)
	if tweetID == "" {
		logs = append(logs, "Invalid tweet link")
		return false, errorType, logs
	}

	for i := 0; i < twitter.config.Info.MaxTasksRetries; i++ {
		var stringData = fmt.Sprintf(`{"variables":{"tweet_id":"%s"},"queryId":"%s"}`, tweetID, twitter.queryID.LikeID)
		data := strings.NewReader(stringData)

		req, err := http.NewRequest("POST", likeURL, data)
		if err != nil {
			logs = append(logs, fmt.Sprintf("Failed to build like request: %s", err.Error()))
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
			// x-client-transaction-id
			http.HeaderOrderKey: {
				"accept",
				"accept-encoding",
				"authorization",
				"content-type",
				"cookie",
				"origin",
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
			logs = append(logs, fmt.Sprintf("Failed to do like request: %s", err.Error()))
			continue
		}
		defer resp.Body.Close()

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			logs = append(logs, fmt.Sprintf("Failed to read like response body: %s", err.Error()))
			continue
		}

		bodyString := string(bodyBytes)

		if resp.StatusCode >= 200 && resp.StatusCode <= 299 {
			if strings.Contains(bodyString, "already") {
				var responseAlreadyLike alreadyLikedResponse
				err = json.Unmarshal(bodyBytes, &responseAlreadyLike)
				if err != nil {
					logs = append(logs, fmt.Sprintf("Failed to unmarshal already liked response: %s", err.Error()))
					continue
				}
				logs = append(logs, fmt.Sprintf("%s already liked tweet %s", twitter.Username, tweetID))
				return true, "", logs
			} else if strings.Contains(bodyString, "favorite_tweet") {
				var responseLike likeResponse
				err = json.Unmarshal(bodyBytes, &responseLike)
				if err != nil {
					logs = append(logs, fmt.Sprintf("Failed to unmarshal like response: %s", err.Error()))
					continue
				}
				if responseLike.Data.FavoriteTweet == "Done" {
					logs = append(logs, fmt.Sprintf("%s liked tweet %s", twitter.Username, tweetID))
					return true, "", logs
				}
			}
		} else if strings.Contains(bodyString, "this account is temporarily locked") {
			logs = append(logs, "Account is temporarily locked")
			return false, "Locked", logs
		} else if strings.Contains(bodyString, "Could not authenticate you") {
			logs = append(logs, "Could not authenticate you")
			return false, "Unauthenticated", logs
		} else {
			logs = append(logs, fmt.Sprintf("Unknown response while like: %s", bodyString))
			continue
		}
	}

	logs = append(logs, "Unable to do like")
	return false, errorType, logs
}

func (twitter *Twitter) Unlike(tweetLink string) (bool, string, []string) {
    var logs []string
    errorType := "Unknown"

    likeURL := fmt.Sprintf("https://twitter.com/i/api/graphql/%s/UnfavoriteTweet", twitter.queryID.UnlikeID)
    tweetID := additional_twitter_methods.GetTweetID(tweetLink)
    if tweetID == "" {
        logs = append(logs, "Invalid tweet link")
        return false, errorType, logs
    }

    for i := 0; i < twitter.config.Info.MaxTasksRetries; i++ {
        var stringData = fmt.Sprintf(`{"variables":{"tweet_id":"%s"},"queryId":"%s"}`, tweetID, twitter.queryID.LikeID)
        data := strings.NewReader(stringData)

        req, err := http.NewRequest("POST", likeURL, data)
        if err != nil {
            logs = append(logs, fmt.Sprintf("Failed to build unlike request: %s", err.Error()))
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
            logs = append(logs, fmt.Sprintf("Failed to do unlike request: %s", err.Error()))
            continue
        }
        defer resp.Body.Close()

        bodyBytes, err := io.ReadAll(resp.Body)
        if err != nil {
            logs = append(logs, fmt.Sprintf("Failed to read unlike response body: %s", err.Error()))
            continue
        }

        bodyString := string(bodyBytes)

        if resp.StatusCode >= 200 && resp.StatusCode <= 299 {
            if strings.Contains(bodyString, "already") {
                var responseAlreadyLike alreadyLikedResponse
                err = json.Unmarshal(bodyBytes, &responseAlreadyLike)
                if err != nil {
                    logs = append(logs, fmt.Sprintf("Failed to unmarshal already unliked response: %s", err.Error()))
                    continue
                }
                logs = append(logs, fmt.Sprintf("%s already unliked tweet %s", twitter.Username, tweetID))
                return true, "", logs
            } else if strings.Contains(bodyString, "favorite_tweet") {
                var responseLike unlikeResponse
                err = json.Unmarshal(bodyBytes, &responseLike)
                if err != nil {
                    logs = append(logs, fmt.Sprintf("Failed to unmarshal unlike response: %s", err.Error()))
                    continue
                }
                if responseLike.Data.UnfavoriteTweet == "Done" {
                    logs = append(logs, fmt.Sprintf("%s unliked tweet %s", twitter.Username, tweetID))
                    return true, "", logs
                }
            }
        } else if strings.Contains(bodyString, "this account is temporarily locked") {
            logs = append(logs, "Account is temporarily locked")
            return false, "Locked", logs
        } else if strings.Contains(bodyString, "Could not authenticate you") {
            logs = append(logs, "Could not authenticate you")
            return false, "Unauthenticated", logs
        } else {
            logs = append(logs, fmt.Sprintf("Unknown response while unlike: %s", bodyString))
            continue
        }
    }

    logs = append(logs, "Unable to do unlike")
    return false, errorType, logs
}

type likeResponse struct {
	Data struct {
		FavoriteTweet string `json:"favorite_tweet"`
	} `json:"data"`
}

type alreadyLikedResponse struct {
	Errors []struct {
		Message   string `json:"message"`
		Locations []struct {
			Line   int `json:"line"`
			Column int `json:"column"`
		} `json:"locations"`
		Path       []string `json:"path"`
		Extensions struct {
			Name    string `json:"name"`
			Source  string `json:"source"`
			Code    int    `json:"code"`
			Kind    string `json:"kind"`
			Tracing struct {
				TraceID string `json:"trace_id"`
			} `json:"tracing"`
		} `json:"extensions"`
		Code    int    `json:"code"`
		Kind    string `json:"kind"`
		Name    string `json:"name"`
		Source  string `json:"source"`
		Tracing struct {
			TraceID string `json:"trace_id"`
		} `json:"tracing"`
	} `json:"errors"`
	Data struct {
	} `json:"data"`
}

type unlikeResponse struct {
	Data struct {
		UnfavoriteTweet string `json:"unfavorite_tweet"`
	} `json:"data"`
}
