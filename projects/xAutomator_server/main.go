package main

import (
	"fmt"
	"log"
	"twitter/server"
)

func main() {
    srv := server.NewServer()
	
	fmt.Println("Server started")
    err := srv.Start("8080")
    if err != nil {
        log.Fatalf("Server failed to start: %v", err)
    }
}