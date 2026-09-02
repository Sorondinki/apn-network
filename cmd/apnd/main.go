package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/Sorondinki/apn-network/consensus"
	"github.com/Sorondinki/apn-network/core"
	"github.com/Sorondinki/apn-network/p2p"
	"github.com/Sorondinki/apn-network/rpc"

	_ "modernc.org/sqlite"
)

type UserAccount struct {
	Email         string  `json:"email"`
	Password      string  `json:"password"`
	WalletAddress string  `json:"wallet"`
	MinedBalance  float64 `json:"balance"`
	MiningEndTime int64   `json:"mining_end_time"`
}

var (
	db       *sql.DB
	mu       sync.Mutex
	APNChain *core.Blockchain
	APNState *core.AccountState
	APNDPoS  *consensus.DPoSEngine
	APNNode  *p2p.P2PNode
)

func initDB() {
	var err error
	db, err = sql.Open("sqlite", "./apn_network.db")
	if err != nil {
		log.Fatalf("Failed to connect to SQLite DB: %v", err)
	}

	// Amfani da ainihin sunan Teburinki: "User" (Asali)
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS User (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		wallet_address TEXT UNIQUE NOT NULL,
		mined_balance REAL DEFAULT 0.0,
		mining_end_time INTEGER DEFAULT 0
	);`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatalf("Failed to create User table: %v", err)
	}
	fmt.Println("DATABASE: SQLite Database connected & User table initialized successfully!")
}

func hashPassword(p string) string {
	h := sha256.Sum256([]byte(p))
	return hex.EncodeToString(h[:])
}

func generateWallet() string {
	h := sha256.Sum256([]byte(fmt.Sprintf("%d", time.Now().UnixNano())))
	return "0x" + hex.EncodeToString(h[:])[:40]
}

// CORS Middleware to automatically wrap all HTTP routes
func enableCORSMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req struct{ Email, Password string }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" || req.Password == "" {
		http.Error(w, `{"error": "Invalid input details"}`, http.StatusBadRequest)
		return
	}

	wallet := generateWallet()
	passHash := hashPassword(req.Password)

	// An maida query zuwa teburin User
	_, err := db.Exec("INSERT INTO User (email, password_hash, wallet_address) VALUES (?, ?, ?)", req.Email, passHash, wallet)
	if err != nil {
		http.Error(w, `{"error": "Email already exists"}`, http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "User registered successfully",
		"wallet":  wallet,
	})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req struct{ Email, Password string }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid payload"}`, http.StatusBadRequest)
		return
	}

	var u UserAccount
	var passHash string
	// An maida query zuwa teburin User
	err := db.QueryRow("SELECT email, password_hash, wallet_address, mined_balance, mining_end_time FROM User WHERE email = ?", req.Email).Scan(&u.Email, &passHash, &u.WalletAddress, &u.MinedBalance, &u.MiningEndTime)

	if err != nil || passHash != hashPassword(req.Password) {
		http.Error(w, `{"error": "Invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"user": map[string]interface{}{
			"email":           u.Email,
			"wallet":          u.WalletAddress,
			"balance":         u.MinedBalance,
			"mining_end_time": u.MiningEndTime,
		},
	})
}

func startMiningHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	now := time.Now().Unix()
	newEndTime := now + (24 * 60 * 60) // 24-Hour Mining Session

	// An maida query zuwa teburin User
	_, err := db.Exec("UPDATE User SET mining_end_time = ? WHERE email = ?", newEndTime, req.Email)
	if err != nil {
		http.Error(w, `{"error": "Failed to activate 24-hour mining session"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          "success",
		"message":         "Mining session activated for 24 hours",
		"mining_end_time": newEndTime,
	})
}

func syncBalanceHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Email   string  `json:"email"`
		Balance float64 `json:"balance"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		http.Error(w, `{"error": "Invalid sync request"}`, http.StatusBadRequest)
		return
	}

	// An maida query zuwa teburin User
	_, err := db.Exec("UPDATE User SET mined_balance = ? WHERE email = ?", req.Balance, req.Email)
	if err != nil {
		http.Error(w, `{"error": "Balance sync failed"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Balance synchronized successfully",
	})
}

func main() {
	initDB()

	// 1. Kaddamar da Core Blockchain Engines
	APNState = core.NewAccountState()
	APNChain = core.NewBlockchain(APNState)
	APNDPoS = consensus.NewDPoSEngine()

	// 2. Kaddamar da P2P Node (Port 6000)
	APNNode = p2p.NewP2PNode("6000")
	go APNNode.StartServer()

	// 3. Kaddamar da JSON-RPC Server (Port 8545)
	rpcServer := rpc.NewRPCServer("8545", APNChain, APNState, APNDPoS)
	go func() {
		if err := rpcServer.Start(); err != nil {
			log.Printf("RPC Server Error: %v\n", err)
		}
	}()

	// 4. REST API Routes don Frontend
	http.HandleFunc("/api/register", enableCORSMiddleware(registerHandler))
	http.HandleFunc("/api/login", enableCORSMiddleware(loginHandler))
	http.HandleFunc("/api/start-mining", enableCORSMiddleware(startMiningHandler))
	http.HandleFunc("/api/mine/start", enableCORSMiddleware(startMiningHandler))
	http.HandleFunc("/api/sync-balance", enableCORSMiddleware(syncBalanceHandler))

	fmt.Println("🚀 APN API Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
