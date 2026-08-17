package main

import (
	"fmt"
	"math/big"

	"github.com/Sorondinki/apn-network/consensus"
	"github.com/Sorondinki/apn-network/core"
	"github.com/Sorondinki/apn-network/crypto"
	"github.com/Sorondinki/apn-network/p2p"
	"github.com/Sorondinki/apn-network/rpc"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("  INITIALIZING APN NETWORK NODE CORE ENGINE...   ")
	fmt.Println("==================================================")

	// 1. Generate Founder & User Wallets
	founderWallet := crypto.NewWallet()
	userWallet := crypto.NewWallet()

	founderWallet.DisplayWalletInfo()

	// 2. Initialize Account State
	fmt.Println("\n[*] Initializing APN Account State Engine...")
	state := core.NewAccountState()

	// A. MINTING INITIAL TOKENS (Ka Minting Miliyan 200 da farko)
	state.MintInitialTokens(founderWallet.Address, 200000000)

	// B. BONUS MINTING (Ka kara wa kanka Miliyan 50 APN!)
	fmt.Println("[+] BONUS: Minting 50,000,000 extra APN to Founder Wallet...")
	state.MintInitialTokens(founderWallet.Address, state.GetBalance(founderWallet.Address)+50000000)

	// 3. Initialize Consensus & Blockchain
	dpos := consensus.NewDPoSEngine()
	dpos.RegisterValidator(founderWallet.Address, big.NewInt(10000000))

	chain := core.InitBlockchain()
	mempool := core.NewMemoryPool()

	// ------------------------------------------------------------------
	// TX 1: Founder sends 50,000 APN to User
	// ------------------------------------------------------------------
	fmt.Println("\n[*] TX 1: Founder sending 50,000 APN to User...")
	tx1 := core.NewTransaction(founderWallet.Address, userWallet.Address, 50000)
	_ = tx1.Sign(founderWallet.PrivateKey)

	if tx1.VerifySignature(founderWallet.PublicKey) {
		_ = state.ApplyTransaction(tx1)
		mempool.AddTransaction([]byte(tx1.String()))
	}

	// ------------------------------------------------------------------
	// TX 2: User RETURNS 50,000 APN BACK to Founder!
	// ------------------------------------------------------------------
	fmt.Println("\n[*] TX 2: User RETURNING 50,000 APN BACK to Founder!...")
	tx2 := core.NewTransaction(userWallet.Address, founderWallet.Address, 50000)
	_ = tx2.Sign(userWallet.PrivateKey) // User signs with his own private key

	if tx2.VerifySignature(userWallet.PublicKey) {
		err := state.ApplyTransaction(tx2)
		if err == nil {
			mempool.AddTransaction([]byte(tx2.String()))
		}
	}

	// Print Final Wallet Balances
	fmt.Println("\n==================================================")
	fmt.Println("            FINAL APN WALLET BALANCES             ")
	fmt.Println("==================================================")
	fmt.Printf("Founder Balance : %d APN (Full Refund + Bonus Received!)\n", state.GetBalance(founderWallet.Address))
	fmt.Printf("User Balance    : %d APN (Empty Balance)\n", state.GetBalance(userWallet.Address))
	fmt.Println("==================================================")

	// 4. Mine Block #1 with Pending Transactions
	pendingTxs := mempool.FlushTransactions()
	proposer := dpos.SelectProposer(1)
	fmt.Printf("\n[*] Block #1 Proposed By Validator: %s\n", proposer)
	chain.AddBlock(pendingTxs)

	chain.DisplayChainLogs()

	// 5. Launch Network Services
	fmt.Println("\n[*] Launching Network Services...")
	p2pServer := p2p.NewP2PNode("8089")
	go p2pServer.StartServer()

	rpcServer := rpc.NewRPCServer("8545", chain)
	err := rpcServer.Start()
	if err != nil {
		fmt.Printf("[!] Failed to start RPC Server: %v\n", err)
	}
}
