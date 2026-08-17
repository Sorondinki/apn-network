package main

import (
	"fmt"
	"math/big"
	"time"

	"github.com/Sorondinki/apn-network/consensus"
	"github.com/Sorondinki/apn-network/core"
	"github.com/Sorondinki/apn-network/crypto"
	"github.com/Sorondinki/apn-network/p2p"
	"github.com/Sorondinki/apn-network/rpc"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("  INITIALIZING APN P2P GOSSIP NETWORK ENGINE...  ")
	fmt.Println("==================================================")

	founderWallet := crypto.NewWallet()
	userWallet := crypto.NewWallet()

	state := core.NewAccountState()
	state.MintInitialTokens(founderWallet.Address, 250000000)

	chain := core.InitBlockchain()
	mempool := core.NewMemoryPool()

	dpos := consensus.NewDPoSEngine()
	dpos.RegisterValidator(founderWallet.Address, big.NewInt(10000000))

	// Test Slashing mechanism (50% penalty for double signing)
	_ = dpos.SlashValidator(founderWallet.Address, 50)

	// 1. Launch Nodes
	node1 := p2p.NewP2PNode("8089")
	go node1.StartServer()

	node2 := p2p.NewP2PNode("8090")
	go node2.StartServer()

	time.Sleep(500 * time.Millisecond)
	_ = node2.ConnectToPeer("127.0.0.1:8089")

	// 2. Transaction Execution
	tx1 := core.NewTransaction(founderWallet.Address, userWallet.Address, 10000)
	_ = tx1.Sign(founderWallet.PrivateKey)

	if tx1.VerifySignature(founderWallet.PublicKey) {
		_ = state.ApplyTransaction(tx1)
		mempool.AddTransaction([]byte(tx1.String()))
		node1.BroadcastMessage(p2p.MessageTypeTx, tx1.String())
	}

	fmt.Printf("\n[*] Live Founder Wallet: %s\n", founderWallet.Address)
	fmt.Printf("[*] Live User Wallet:    %s\n\n", userWallet.Address)

	// Launch RPC Server
	rpcServer := rpc.NewRPCServer("8545", chain, state)
	_ = rpcServer.Start()
}
