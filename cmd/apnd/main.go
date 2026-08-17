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

	// 2. Initialize DPoS Consensus & Ledger
	dpos := consensus.NewDPoSEngine()
	dpos.RegisterValidator(founderWallet.Address, big.NewInt(10000000))

	chain := core.InitBlockchain()
	mempool := core.NewMemoryPool()

	// 3. Create & Sign Real Transaction
	fmt.Println("\n[*] Creating & Signing Cryptographic Transaction...")
	tx1 := core.NewTransaction(founderWallet.Address, userWallet.Address, 500)

	err := tx1.Sign(founderWallet.PrivateKey)
	if err != nil {
		fmt.Printf("[!] Failed to sign transaction: %v\n", err)
	}

	// Verify Signature using raw PublicKey bytes
	isValid := tx1.VerifySignature(founderWallet.PublicKey)
	fmt.Printf("[+] Transaction Signature Validated: %v\n", isValid)

	// Add Signed TX to Mempool
	mempool.AddTransaction([]byte(tx1.String()))

	// 4. Mine Block #1
	pendingTxs := mempool.FlushTransactions()
	proposer := dpos.SelectProposer(1)
	fmt.Printf("\n[*] Block #1 Proposed By Validator: %s\n", proposer)
	chain.AddBlock(pendingTxs)

	chain.DisplayChainLogs()

	// 5. Launch P2P & RPC Servers
	fmt.Println("\n[*] Launching Network Services...")
	p2pServer := p2p.NewP2PNode("8089")
	go p2pServer.StartServer()

	rpcServer := rpc.NewRPCServer("8545", chain)
	err = rpcServer.Start()
	if err != nil {
		fmt.Printf("[!] Failed to start RPC Server: %v\n", err)
	}
}
