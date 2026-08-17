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

	// 2. Initialize DPoS Consensus & Register Genesis Validator
	fmt.Println("\n[*] Initializing DPoS Consensus Mechanism...")
	dpos := consensus.NewDPoSEngine()

	initialStake := big.NewInt(10000000)
	dpos.RegisterValidator(founderWallet.Address, initialStake)

	// 3. Initialize Blockchain Ledger
	chain := core.InitBlockchain()

	// Propose Block #1
	proposer := dpos.SelectProposer(1)
	fmt.Printf("\n[*] Block #1 Proposed By Validator: %s\n", proposer)

	chain.AddBlock([][]byte{
		[]byte("TX: System Mint Reward to Genesis Validator"),
	})

	// 4. Start P2P TCP Server on Port 8089 in Background
	fmt.Println("\n[*] Launching P2P Peer Discovery Service...")
	p2pServer := p2p.NewP2PNode("8089")
	go p2pServer.StartServer()

	// 5. Start RPC HTTP API Server on Port 8545
	rpcServer := rpc.NewRPCServer("8545", chain)
	err := rpcServer.Start()
	if err != nil {
		fmt.Printf("[!] Failed to start RPC Server: %v\n", err)
	}
}
