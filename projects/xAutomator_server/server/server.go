package server

import (
	"log"
	"net/http"
	"twitter/extra"
	"twitter/server/middleware"
	"twitter/server/modules"
	"twitter/server/x_actions"
)

type Server struct {
	config   extra.Config
	queryIDs extra.QueryIDs
}

func NewServer() *Server {
	config := extra.ReadConfig()
	queryIDs := extra.ReadQueryIDs()

	return &Server{
		config:   config,
		queryIDs: queryIDs,
	}
}

func (s *Server) Start(port string) error {
	log.Printf("Starting server on port %s", port)
	// Create handler
	handler := x_actions.NewHandler(s.config, s.queryIDs)
	accountsHandler := modules.NewHandler(s.config, s.queryIDs)

	// Register routes with CORS middleware
	http.HandleFunc("/api/like", middleware.CORS(handler.HandleLike))
	http.HandleFunc("/api/unlike", middleware.CORS(handler.HandleUnlike))
	http.HandleFunc("/api/follow", middleware.CORS(handler.HandleFollow))
	http.HandleFunc("/api/unfollow", middleware.CORS(handler.HandleUnfollow))
	http.HandleFunc("/api/retweet", middleware.CORS(handler.HandleRetweet))
	http.HandleFunc("/api/unretweet", middleware.CORS(handler.HandleUnretweet))
	http.HandleFunc("/api/tweet", middleware.CORS(handler.HandleTweet))
	http.HandleFunc("/api/comment", middleware.CORS(handler.HandleComment))
	http.HandleFunc("/api/vote_poll", middleware.CORS(handler.HandleVotePoll))
	http.HandleFunc("/api/check_suspended", middleware.CORS(handler.HandleCheckSuspended))

	http.HandleFunc("/api/accounts/create", middleware.CORS(accountsHandler.HandleCreateAccountsBase))
	http.HandleFunc("/api/accounts/all", middleware.CORS(accountsHandler.HandleGetAllBases))
	http.HandleFunc("/api/accounts/delete", middleware.CORS(accountsHandler.HandleDeleteBase))
	http.HandleFunc("/api/accounts/edit", middleware.CORS(accountsHandler.HandleEditAccount))
	http.HandleFunc("/api/accounts/delete-account", middleware.CORS(accountsHandler.HandleDeleteAccount))

	http.HandleFunc("/api/config", middleware.CORS(accountsHandler.HandleGetConfig))
	http.HandleFunc("/api/config/update", middleware.CORS(accountsHandler.HandleUpdateConfig))

	http.HandleFunc("/api/scraper-config", middleware.CORS(accountsHandler.HandleGetScraperConfig))
	http.HandleFunc("/api/scraper-config/update", middleware.CORS(accountsHandler.HandleUpdateScraperConfig))

	log.Printf("Server starting on port %s", port)
	return http.ListenAndServe(":"+port, nil)
}
