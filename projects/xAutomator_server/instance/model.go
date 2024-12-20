package instance

import (
	"fmt"
	tlsClient "github.com/bogdanfinn/tls-client"
	"twitter/extra"
	"twitter/instance/additional_twitter_methods"
	"twitter/utils"
)

type Twitter struct {
	index     int
	authToken string
	proxy     string
	config    extra.Config
	queryID   extra.QueryIDs

	ct0      string
	Username string

	client  tlsClient.HttpClient
	cookies *utils.CookieClient
	logger  extra.Logger
}

func (twitter *Twitter) InitTwitter(index int, authToken string, proxy string, config extra.Config, queryID extra.QueryIDs) (bool, string, []string) {
	var logs []string

	twitter.index = index
	twitter.authToken = authToken
	twitter.proxy = proxy
	twitter.config = config
	twitter.queryID = queryID

	ok, reason, initLogs := twitter.prepareClient()
	logs = append(logs, initLogs...)
	return ok, reason, logs
}

func (twitter *Twitter) prepareClient() (bool, string, []string) {
	var logs []string
	var err error

	for i := 0; i < twitter.config.Info.MaxTasksRetries; i++ {
		twitter.client, err = utils.CreateHttpClient(twitter.proxy)
		if err != nil {
			logs = append(logs, fmt.Sprintf("Failed to create HTTP client: %s", err.Error()))
			continue
		}

		twitter.cookies = utils.NewCookieClient()
		twitter.authToken, twitter.ct0, err = additional_twitter_methods.SetAuthCookies(twitter.index, twitter.cookies, twitter.authToken)
		if err != nil {
			logs = append(logs, fmt.Sprintf("Failed to set auth cookies: %s", err.Error()))
			continue
		}

		var username, ct0 string
		username, ct0, _, usernameLogs := additional_twitter_methods.GetTwitterUsername(
			twitter.index,
			twitter.client,
			twitter.cookies,
			twitter.queryID.BearerToken,
			twitter.ct0,
		)
		logs = append(logs, usernameLogs...)
		
		twitter.Username = username
		twitter.ct0 = ct0

		if twitter.Username == "locked" {
			return false, "locked", logs
		} else if twitter.Username == "failed_auth" {
			return false, "failed_auth", logs
		} else if twitter.Username != "" {
			logs = append(logs, "Client prepared successfully")
			return true, "ok", logs
		}
	}

	logs = append(logs, "Failed to prepare client")
	return false, "unknown", logs
}
