package rpc

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Sorondinki/apn-network/core"
)

type RPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
	ID      int           `json:"id"`
}

type RPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	Result  interface{} `json:"result,omitempty"`
	Error   interface{} `json:"error,omitempty"`
	ID      int         `json:"id"`
}

type RPCServer struct {
	Port  string
	Chain *core.Blockchain
	State *core.AccountState
}

func NewRPCServer(port string, chain *core.Blockchain, state *core.AccountState) *RPCServer {
	return &RPCServer{
		Port:  port,
		Chain: chain,
		State: state,
	}
}

func (server *RPCServer) Start() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", server.handleRequest)

	fmt.Printf("[*] JSON-RPC Server active and listening on HTTP port :%s\n", server.Port)
	return http.ListenAndServe(":"+server.Port, mux)
}

func (server *RPCServer) handleRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		return
	}

	var req RPCRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(RPCResponse{
			JSONRPC: "2.0",
			Error:   map[string]string{"message": "Invalid JSON-RPC Payload"},
			ID:      0,
		})
		return
	}

	res := RPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
	}

	switch req.Method {
	case "eth_blockNumber", "apn_getChainHeight":
		res.Result = fmt.Sprintf("0x%x", len(server.Chain.Blocks)-1)

	case "apn_getLatestBlockHash":
		if len(server.Chain.Blocks) > 0 {
			latestBlock := server.Chain.Blocks[len(server.Chain.Blocks)-1]
			res.Result = latestBlock.Header.BlockHash
		} else {
			res.Error = map[string]string{"message": "No blocks available in chain"}
		}

	case "apn_getBalance", "eth_getBalance":
		if len(req.Params) > 0 {
			address, ok := req.Params[0].(string)
			if ok && server.State != nil {
				balance := server.State.GetBalance(address)
				res.Result = fmt.Sprintf("0x%x", balance)
			} else {
				res.Error = map[string]string{"message": "Invalid address parameter or state uninitialized"}
			}
		} else {
			res.Error = map[string]string{"message": "Missing address parameter"}
		}

	case "apn_callContract":
		if len(req.Params) > 0 {
			code, ok := req.Params[0].(string)
			if ok {
				vm := core.NewAPNVirtualMachine()
				err := vm.Execute(code)
				if err != nil {
					res.Error = map[string]string{"message": fmt.Sprintf("VM Error: %v", err)}
				} else {
					res.Result = vm.Storage
				}
			} else {
				res.Error = map[string]string{"message": "Invalid bytecode parameter"}
			}
		} else {
			res.Error = map[string]string{"message": "Missing contract code parameter"}
		}

	default:
		res.Error = map[string]string{"message": "Method not found"}
	}

	json.NewEncoder(w).Encode(res)
}
