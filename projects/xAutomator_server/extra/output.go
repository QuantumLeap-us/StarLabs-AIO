package extra

import (
	"fmt"

	"github.com/gookit/color"
)

func ShowMenu() {
	for i, item := range MainMenu {
		if i < 9 {
			fmt.Printf("\033[36m[\033[33m0%d\033[36m] \033[36m>> \033[37m%s\033[0m\n", i+1, item)
		} else {
			fmt.Printf("\033[36m[\033[33m%d\033[36m] \033[36m>> \033[37m%s\033[0m\n", i+1, item)
		}
	}
}

func ShowLogo() {
	logo := " _____                                                                              _____ \n( ___ )----------------------------------------------------------------------------( ___ )\n |   |                                                                              |   | \n |   | #######           #                                                          |   | \n |   | #       #    #   # #   #    # #####  ####  #    #   ##   #####  ####  #####  |   | \n |   | #        #  #   #   #  #    #   #   #    # ##  ##  #  #    #   #    # #    # |   | \n |   | #####     ##   #     # #    #   #   #    # # ## # #    #   #   #    # #    # |   | \n |   | #         ##   ####### #    #   #   #    # #    # ######   #   #    # #####  |   | \n |   | #        #  #  #     # #    #   #   #    # #    # #    #   #   #    # #   #  |   | \n |   | ####### #    # #     #  ####    #    ####  #    # #    #   #    ####  #    # |   | \n |___|                                                                              |___| \n(_____)----------------------------------------------------------------------------(_____)"

	color.LightYellow.Printf(logo + "\n")

}

func ShowDevInfo(version string) {
	//if version != CurrentSoftVersion {
	//
	//} else {
	fmt.Printf("\033[36mVERSION: \033[33m%s\033[33m", version)
	fmt.Println()
	//}

}

var MainMenu = []string{
	"Follow",
	"Retweet",
	"Like",
	"Tweet",
	"Tweet with Picture",
	"Quote Tweet",
	"Comment",
	"Comment with Picture",
	"Unfollow",
	"Unlike",
	"Unretweet",
	"Change Description",
	"Change Username",
	"Change Name",
	"Change Background",
	"Change Password",
	"Change Birthdate",
	"Change Location",
	"Change profile Picture",
	"Check if account is valid",
	"Unfreeze Accounts",
	"Mutual Subscription",
	"Vote in the poll",
	"Account's BrutForce",
	"Scrape Followers",
	"Scrape Followings",
	"Scrape Likes",
	"Scrape Retweets",
	//"Scrape Replies",
	"Download all parsed pictures",
	"Get account creation date by username",
	"Username to user ID",
	"Boost account followers",
	//"Filter accounts for BrutForce",
}
