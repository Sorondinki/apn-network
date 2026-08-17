package core

import (
	"fmt"
)

// Blockchain represents the chain of blocks and ledger state
type Blockchain struct {
	Blocks []*Block
}

// InitBlockchain initializes a new blockchain starting with the Genesis Block
func InitBlockchain() *Blockchain {
	return &Blockchain{
		Blocks: []*Block{NewGenesisBlock()},
	}
}

// AddBlock appends a new block containing transactions to the chain
func (bc *Blockchain) AddBlock(transactions [][]byte) {
	prevBlock := bc.Blocks[len(bc.Blocks)-1]
	newBlock := NewBlock(transactions, prevBlock.Hash, int64(len(bc.Blocks)))
	bc.Blocks = append(bc.Blocks, newBlock)
}

// DisplayChainLogs outputs the full blockchain ledger to the terminal
func (bc *Blockchain) DisplayChainLogs() {
	fmt.Println("\n==================================================")
	fmt.Println("       ALPHA PROFICIENCY NETWORK - LEDGER         ")
	fmt.Println("==================================================")
	for _, block := range bc.Blocks {
		block.DisplayBlockInfo()
		fmt.Println()
	}
}