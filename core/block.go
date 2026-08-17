package core

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"
)

// BlockHeader holds metadata about a block
type BlockHeader struct {
	Height        int64
	PrevBlockHash string
	BlockHash     string
	Timestamp     int64
}

// Block represents a single block in the APN blockchain
type Block struct {
	Header       BlockHeader
	Transactions [][]byte
}

// GenesisBlock creates the initial block of the network
func GenesisBlock() *Block {
	genesis := &Block{
		Header: BlockHeader{
			Height:        0,
			PrevBlockHash: "",
			Timestamp:     time.Now().Unix(),
		},
		Transactions: [][]byte{[]byte("APN Network Genesis Block - Alpha Proficiency")},
	}
	genesis.Header.BlockHash = genesis.CalculateHash()
	return genesis
}

// ValidateBlock verifies block integrity against previous block
func (b *Block) ValidateBlock(prevBlock *Block) error {
	if prevBlock != nil {
		if b.Header.PrevBlockHash != prevBlock.Header.BlockHash {
			return errors.New("invalid previous block hash match")
		}

		if b.Header.Height != prevBlock.Header.Height+1 {
			return errors.New("invalid block height sequence")
		}
	}

	calculatedHash := b.CalculateHash()
	if b.Header.BlockHash != calculatedHash {
		return errors.New("block hash mismatch - data integrity compromised")
	}

	return nil
}

// CalculateHash recalculates SHA-256 hash of block
func (b *Block) CalculateHash() string {
	var txHashes []byte
	for _, tx := range b.Transactions {
		txHashes = append(txHashes, tx...)
	}

	record := fmt.Sprintf("%d%s%x%d",
		b.Header.Height,
		b.Header.PrevBlockHash,
		txHashes,
		b.Header.Timestamp,
	)

	h := sha256.New()
	h.Write([]byte(record))
	return hex.EncodeToString(h.Sum(nil))
}
