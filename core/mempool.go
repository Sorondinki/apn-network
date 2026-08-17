package core

import (
	"fmt"
	"sync"
)

// MemoryPool stores pending transactions before they are mined into a block
type MemoryPool struct {
	PendingTXs [][]byte
	mu         sync.Mutex
}

// NewMemoryPool initializes an empty memory pool
func NewMemoryPool() *MemoryPool {
	return &MemoryPool{
		PendingTXs: make([][]byte, 0),
	}
}

// AddTransaction adds a new incoming transaction to the pool
func (mp *MemoryPool) AddTransaction(tx []byte) {
	mp.mu.Lock()
	defer mp.mu.Unlock()

	mp.PendingTXs = append(mp.PendingTXs, tx)
	fmt.Printf("[+] Transaction added to Mempool: %s\n", string(tx))
}

// FlushTransactions retrieves all pending transactions and clears the pool
func (mp *MemoryPool) FlushTransactions() [][]byte {
	mp.mu.Lock()
	defer mp.mu.Unlock()

	txs := mp.PendingTXs
	mp.PendingTXs = make([][]byte, 0)
	return txs
}
