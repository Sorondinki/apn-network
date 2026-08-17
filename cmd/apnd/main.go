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

	// 1. Launch Node #1 (Primary Node on Port 8089)
	node1 := p2p.NewP2PNode("8089")
	go node1.StartServer()

	// 2. Launch Node #2 (Peer Node on Port 8090)
	node2 := p2p.NewP2PNode("8090")
	go node2.StartServer()

	time.Sleep(500 * time.Millisecond) // Allow listeners to initialize

	// 3. Connect Node #2 to Node #1
	err := node2.ConnectToPeer("127.0.0.1:8089")
	if err != nil {
		fmt.Printf("[!] Peer Connection Error: %v\n", err)
	}

	// 4. Create & Sign Real Transaction
	tx1 := core.NewTransaction(founderWallet.Address, userWallet.Address, 10000)
	_ = tx1.Sign(founderWallet.PrivateKey)

	if tx1.VerifySignature(founderWallet.PublicKey) {
		_ = state.ApplyTransaction(tx1)
		mempool.AddTransaction([]byte(tx1.String()))

		// Broadcast transaction across P2P network!
		node1.BroadcastMessage(p2p.MessageTypeTx, tx1.String())
	}

	time.Sleep(500 * time.Millisecond)

	// Launch RPC Server on main node
	rpcServer := rpc.NewRPCServer("8545", chain)
	_ = rpcServer.Start()
}
