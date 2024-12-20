package instance

import (
	"github.com/PuerkitoBio/goquery"
	http "github.com/bogdanfinn/fhttp"
	capsolver_go "github.com/capsolver/capsolver-go"
	"net/url"

	"io"
	"strings"
	"twitter/extra"
)

const unlockURL = "https://twitter.com/account/access"
const siteKey = "0152B4EB-D2DC-460A-89A1-629838B529C9"

func ParseUnlockHTML(html string) (string, string, bool, bool, bool, bool) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
	if err != nil {
		return "", "", false, false, false, false
	}

	authenticityToken, _ := doc.Find("input[name='authenticity_token']").Attr("value")
	assignmentToken, _ := doc.Find("input[name='assignment_token']").Attr("value")
	verificationString := doc.Find("#verification_string").Length() > 0
	startButton := doc.Find("input[value='Start']").Length() > 0
	finishButton := doc.Find("input[value='Continue to X']").Length() > 0
	deleteButton := doc.Find("input[value='Delete']").Length() > 0

	return authenticityToken, assignmentToken, verificationString, startButton, finishButton, deleteButton
}

func (twitter *Twitter) Unfreeze() bool {
	for i := 0; i < twitter.config.Info.MaxTasksRetries; i++ {
		req, err := http.NewRequest("GET", unlockURL, nil)
		if err != nil {
			twitter.logger.Error("%d | Failed to build unfreeze get request: %s", twitter.index, err.Error())
			continue
		}
		req.Header = http.Header{
			"accept":                    {"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"},
			"accept-encoding":           {"gzip, deflate, br"},
			"cookie":                    {twitter.cookies.CookiesToHeader()},
			"sec-ch-ua-mobile":          {"?0"},
			"sec-ch-ua-platform":        {`"Windows"`},
			"sec-fetch-dest":            {"document"},
			"sec-fetch-mode":            {"navigate"},
			"sec-fetch-site":            {"same-origin"},
			"upgrade-insecure-requests": {"1"},
			http.HeaderOrderKey: {
				"accept",
				"accept-encoding",
				"cookie",
				"sec-ch-ua-mobile",
				"sec-ch-ua-platform",
				"sec-fetch-dest",
				"sec-fetch-mode",
				"sec-fetch-site",
				"user-agent",
				"upgrade-insecure-requests",
			},
			http.PHeaderOrderKey: {":authority", ":method", ":path", ":scheme"},
		}

		resp, err := twitter.client.Do(req)
		if err != nil {
			extra.Logger{}.Error("%d | Failed to do unfreeze get request: %s", twitter.index, err.Error())
			continue
		}
		defer resp.Body.Close()
		twitter.cookies.SetCookieFromResponse(resp)

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			extra.Logger{}.Error("%d | Failed to read unfreeze GET response body: %s", twitter.index, err.Error())
			continue
		}

		bodyString := string(bodyBytes)

		if strings.Contains(bodyString, "Verify email") || strings.Contains(bodyString, "Verify your email address") {
			twitter.logger.Warning("%d | You need to verify an EMAIL to unlock your account.", twitter.index)
			return false
		} else if strings.Contains(bodyString, "change your password") {
			twitter.logger.Warning("%d | You need to change your password to unlock your account.", twitter.index)
			return false
		} else if strings.Contains(bodyString, "Pass an Arkose challenge") || strings.Contains(bodyString, "arkose_iframe") {
			twitter.logger.Info("%d | Starting to pass Arkose captcha", twitter.index)

		} else {
			twitter.logger.Warning("%d | Unknown server response: %s", twitter.index, bodyString)
			return false
		}

		authenticityToken, assignmentToken, needsUnlock, startButton, finishButton, deleteButton := ParseUnlockHTML(bodyString)
		attempt := 1
		if deleteButton {
			bodyString = twitter.confirmUnlock(authenticityToken, assignmentToken, "")
			authenticityToken, assignmentToken, needsUnlock, startButton, finishButton, deleteButton = ParseUnlockHTML(bodyString)
		}

		if startButton || finishButton {
			bodyString = twitter.confirmUnlock(authenticityToken, assignmentToken, "")
			authenticityToken, assignmentToken, needsUnlock, startButton, finishButton, deleteButton = ParseUnlockHTML(bodyString)
		}

		for needsUnlock && attempt <= twitter.config.Info.MaxUnfreezeAttempts {
			solutionToken := twitter.SolveFunCaptcha()
			if solutionToken == "" {
				attempt++
				continue
			}
			bodyString = twitter.confirmUnlock(authenticityToken, assignmentToken, solutionToken)
			if bodyString == "unlocked" {
				twitter.logger.Success("%d | Account is unlocked :)", twitter.index)
				return true
			}

			authenticityToken, assignmentToken, needsUnlock, startButton, finishButton, deleteButton = ParseUnlockHTML(bodyString)

			if finishButton {
				bodyString = twitter.confirmUnlock(authenticityToken, assignmentToken, "")
				if bodyString == "unlocked" {
					twitter.logger.Success("%d | Account is unlocked :)", twitter.index)
					return true
				}
				authenticityToken, assignmentToken, needsUnlock, startButton, finishButton, deleteButton = ParseUnlockHTML(bodyString)
			}
		}
	}

	return false
}

func (twitter *Twitter) confirmUnlock(authenticityToken, assignmentToken, verificationString string) string {
	for i := 0; i < twitter.config.Info.MaxTasksRetries; i++ {
		data := url.Values{}
		data.Set("authenticity_token", authenticityToken)
		data.Set("assignment_token", assignmentToken)
		data.Set("lang", "en")
		data.Set("flow", "")

		if verificationString != "" {
			data.Set("verification_string", verificationString)
			data.Set("language_code", "en")
		}

		dataPayload := strings.NewReader(data.Encode())

		// Create new request
		req, err := http.NewRequest("POST", unlockURL, dataPayload)
		if err != nil {
			extra.Logger{}.Error("Failed to build C unlock request: %s", err.Error())
			continue
		}
		req.Header.Set("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
		req.Header.Set("cache-control", "max-age=0")
		req.Header.Set("content-type", "application/x-www-form-urlencoded")
		req.Header.Set("cookie", twitter.cookies.CookiesToHeader())
		req.Header.Set("origin", "https://x.com")
		req.Header.Set("priority", "u=0, i")
		req.Header.Set("referer", "https://x.com/account/access")
		req.Header.Set("sec-ch-ua-mobile", "?0")
		req.Header.Set("sec-ch-ua-platform", `"Windows"`)
		req.Header.Set("sec-fetch-dest", "document")
		req.Header.Set("sec-fetch-mode", "navigate")
		req.Header.Set("sec-fetch-site", "same-origin")
		req.Header.Set("sec-fetch-user", "?1")
		req.Header.Set("upgrade-insecure-requests", "1")

		resp, err := twitter.client.Do(req)
		if err != nil {
			extra.Logger{}.Error("%d | Failed to do unfreeze get request: %s", twitter.index, err.Error())
			continue
		}

		if resp.Request.URL.String() == "https://twitter.com/?lang=en" || resp.Request.URL.String() == "https://x.com/?lang=en" {
			return "unlocked"
		}
		defer resp.Body.Close()
		twitter.cookies.SetCookieFromResponse(resp)

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			extra.Logger{}.Error("%d | Failed to read unfreeze GET response body: %s", twitter.index, err.Error())
			continue
		}

		bodyString := string(bodyBytes)

		return bodyString
	}
	return ""
}

func (twitter *Twitter) SolveFunCaptcha() string {
	//if twitter.proxy != "" {
	//	//credentials, address := extra.SplitAt(twitter.proxy, "@")
	//	//proxyLogin, proxyPassword := extra.SplitAt(credentials, ":")
	//	//proxyAddress, proxyPort := extra.SplitAt(address, ":")
	//
	//	funCaptcha["type"] = "FunCaptchaTask"
	//	funCaptcha["proxyType"] = "http"
	//	//funCaptcha["proxyAddress"] = proxyAddress
	//	//funCaptcha["proxyPort"] = proxyPort
	//	//funCaptcha["proxyLogin"] = proxyLogin
	//	//funCaptcha["proxyPassword"] = proxyPassword
	//} else {
	//
	//}
	for i := 0; i < 5; i++ {
		funCaptcha := map[string]any{
			//"api_key":          twitter.config.Info.CapsolverApiKey,
			"websiteURL":       unlockURL,
			"websitePublicKey": siteKey,
		}
		funCaptcha["type"] = "FunCaptchaTaskProxyLess"

		capSolver := capsolver_go.CapSolver{ApiKey: twitter.config.Info.CapsolverApiKey}

		s, err := capSolver.Solve(funCaptcha)
		if err != nil {
			twitter.logger.Error("%d | Failed to solve funcaptcha: %s", twitter.index, err)
			continue
		}

		twitter.logger.Success("%d | Captcha solved!", twitter.index)
		return s.Solution.Token
	}
	twitter.logger.Error("%d | Failed to solve funcaptcha.", twitter.index)
	return ""
}
