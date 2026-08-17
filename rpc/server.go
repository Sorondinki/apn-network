package rpc

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Sorondinki/apn-network/core"
)

// RPCServer handles external HTTP API queries
type RPCServer struct {
	Port  string
	Chain *core.Blockchain
}

// NewRPCServer initializes a new RPC Server instance
func NewRPCServer(port string, chain *core.Blockchain) *RPCServer {
	return &RPCServer{
		Port:  port,
		Chain: chain,
	}
}

// Start launches the HTTP RPC server
func (s *RPCServer) Start() error {
	http.HandleFunc("/chain", s.handleGetChain)
	http.HandleFunc("/status", s.handleStatus)

	fmt.Printf("[*] JSON-RPC Server active and listening on HTTP port :%s\n", s.Port)
	return http.ListenAndServe(":"+s.Port, nil)
}

func (s *RPCServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := map[string]interface{}{
		"status":      "online",
		"network":     "Alpha Proficiency Network Mainnet",
		"blockHeight": len(s.Chain.Blocks) - 1,
	}
	json.NewEncoder(w).Encode(response)
}

func (s *RPCServer) handleGetChain(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.Chain.Blocks)
}
