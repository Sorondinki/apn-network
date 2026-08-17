package main

import (
	"fmt"
	"math/big"

	"github.com/alpha-proficiency/apn-network/consensus"
	"github.com/alpha-proficiency/apn-network/core"
	"github.com/alpha-proficiency/apn-network/crypto"
	"github.com/alpha-proficiency/apn-network/p2p"
	"github.com/alpha-proficiency/apn-network/rpc"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("  INITIALIZING APN NETWORK NODE CORE ENGINE...   ")
	fmt.Println("==================================================")

	// 1. Generate Founder Wallet
	founderWallet := crypto.NewWallet()
	founderWallet.DisplayWalletInfo()

	// 2. Initialize DPoS Consensus
	fmt.Println("\n[*] Initializing DPoS Consensus Mechanism...")
	dpos := consensus.NewDPoSEngine()
	dpos.RegisterValidator(founderWallet.Address, big.NewInt(10000000))

	// 3. Initialize Blockchain Ledger & Mempool
	chain := core.InitBlockchain()
	mempool := core.NewMemoryPool()

	// 4. Simulate Incoming Transactions to Mempool
	fmt.Println("\n[*] Receiving Pending Transactions...")
	mempool.AddTransaction([]byte("TX: Send 100 APN to 0x7e7328f98d051e2bd1c0d5bd8be99c003f8f02e1"))
	mempool.AddTransaction([]byte("TX: Send 50 APN to 0x0f5bb17c5e5719a5324be999509e05bd5f084feb"))

	// 5. Mine Pending Transactions into Block #1
	pendingTxs := mempool.FlushTransactions()
	proposer := dpos.SelectProposer(1)
	fmt.Printf("\n[*] Block #1 Proposed By Validator: %s\n", proposer)
	chain.AddBlock(pendingTxs)

	chain.DisplayChainLogs()

	// 6. Launch P2P and RPC Servers
	fmt.Println("\n[*] Launching Network Services...")
	p2pServer := p2p.NewP2PNode("8089")
	go p2pServer.StartServer()

	rpcServer := rpc.NewRPCServer("8545", chain)
	err := rpcServer.Start()
	if err != nil {
		fmt.Printf("[!] Failed to start RPC Server: %v\n", err)
	}
}
