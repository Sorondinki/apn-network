package core

import (
	"fmt"
	"sync"
	"time"
)

type Blockchain struct {
	Blocks []*Block
	State  *AccountState
	mu     sync.RWMutex
}

// InitBlockchain don buɗe chain ba tare da state ba
func InitBlockchain() *Blockchain {
	genesisBlock := GenesisBlock()
	return &Blockchain{
		Blocks: []*Block{genesisBlock},
	}
}

// NewBlockchain yana haɗa State da InitBlockchain don kada main.go ya sami kuskure
func NewBlockchain(state *AccountState) *Blockchain {
	bc := InitBlockchain()
	bc.State = state
	return bc
}

func (bc *Blockchain) AddBlock(transactions [][]byte) (*Block, error) {
	bc.mu.Lock()
	defer bc.mu.Unlock()

	prevBlock := bc.Blocks[len(bc.Blocks)-1]

	newBlock := &Block{
		Header: BlockHeader{
			Height:        prevBlock.Header.Height + 1,
			PrevBlockHash: prevBlock.Header.BlockHash,
			Timestamp:     time.Now().Unix(),
		},
		Transactions: transactions,
	}

	newBlock.Header.BlockHash = newBlock.CalculateHash()

	// VALIDATION STEP: Bincika ingancin Block kafin adanawa
	if err := newBlock.ValidateBlock(prevBlock); err != nil {
		fmt.Printf("[x] Block Validation Failed: %v\n", err)
		return nil, err
	}

	bc.Blocks = append(bc.Blocks, newBlock)
	fmt.Printf("[✓] Block #%d Successfully Validated & Added to Chain!\n", newBlock.Header.Height)
	return newBlock, nil
}

func (bc *Blockchain) DisplayChainLogs() {
	bc.mu.RLock()
	defer bc.mu.RUnlock()

	fmt.Println("\n==================================================")
	fmt.Println("     ALPHA PROFICIENCY NETWORK - LEDGER         ")
	fmt.Println("==================================================")
	for _, block := range bc.Blocks {
		fmt.Println("==================================================")
		fmt.Printf("BLOCK HEIGHT   : #%d\n", block.Header.Height)
		fmt.Printf("TIMESTAMP      : %s\n", time.Unix(block.Header.Timestamp, 0).Format(time.RFC1123))
		fmt.Printf("PREVIOUS HASH  : %s\n", block.Header.PrevBlockHash)
		fmt.Printf("CURRENT HASH   : %s\n", block.Header.BlockHash)
		fmt.Printf("TRANSACTIONS   : %d TX(s)\n", len(block.Transactions))
		fmt.Println("==================================================")
	}
}
