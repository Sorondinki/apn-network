package core

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// Block yana wakiltar kunshiyar block guda daya a APN Network
type Block struct {
	Timestamp     int64    // Lokacin da aka kera block din (Unix Timestamp)
	Transactions  [][]byte // Jerin transactions da ke cikin block
	PrevBlockHash []byte   // Hash din block din da ya gabata
	Hash          []byte   // Hash din wannan block din
	Nonce         int      // Lambar tabbatar da ma'amala
	Height        int64    // Lambar tsayin block (Block Height/Number)
}

// CalculateHash yana lissafa Hash din wannan block din ta amfani da SHA-256
func (b *Block) CalculateHash() []byte {
	timestamp := []byte(fmt.Sprintf("%d", b.Timestamp))
	headers := bytes.Join([][]byte{b.PrevBlockHash, bytes.Join(b.Transactions, []byte{}), timestamp, []byte(fmt.Sprintf("%d", b.Nonce))}, []byte{})
	hash := sha256.Sum256(headers)
	return hash[:]
}

// NewBlock yana kera sabon Block da ke dauke da Transactions
func NewBlock(transactions [][]byte, prevBlockHash []byte, height int64) *Block {
	block := &Block{
		Timestamp:     time.Now().Unix(),
		Transactions:  transactions,
		PrevBlockHash: prevBlockHash,
		Hash:          []byte{},
		Nonce:         0,
		Height:        height,
	}
	block.Hash = block.CalculateHash()
	return block
}

// NewGenesisBlock yana kera Block na Farko (#0) na APN Network
func NewGenesisBlock() *Block {
	genesisData := [][]byte{[]byte("APN Network Genesis Block - Alpha Proficiency Tech 2026")}
	return NewBlock(genesisData, []byte{}, 0)
}

// DisplayBlockInfo yana nuna bayanan Block a Terminal
func (b *Block) DisplayBlockInfo() {
	fmt.Println("==================================================")
	fmt.Printf("BLOCK HEIGHT   : #%d\n", b.Height)
	fmt.Printf("TIMESTAMP      : %s\n", time.Unix(b.Timestamp, 0).Format(time.RFC1123))
	fmt.Printf("PREVIOUS HASH  : %s\n", hex.EncodeToString(b.PrevBlockHash))
	fmt.Printf("CURRENT HASH   : %s\n", hex.EncodeToString(b.Hash))
	fmt.Printf("TRANSACTIONS   : %d TX(s)\n", len(b.Transactions))
	fmt.Println("==================================================")
}