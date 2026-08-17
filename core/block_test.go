package core

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"testing"
	"time"
)

func generateTestKeyPair(t *testing.T) (*ecdsa.PrivateKey, []byte) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("Failed to generate test key pair: %v", err)
	}
	pubBytes := elliptic.Marshal(elliptic.P256(), priv.PublicKey.X, priv.PublicKey.Y)
	return priv, pubBytes
}

func TestTamperedTransactionRejection(t *testing.T) {
	senderPriv, senderPub := generateTestKeyPair(t)
	_, receiverPub := generateTestKeyPair(t)

	senderAddr := "0x" + string(senderPub[:10])
	receiverAddr := "0x" + string(receiverPub[:10])

	tx := NewTransaction(senderAddr, receiverAddr, 100)

	err := tx.Sign(senderPriv)
	if err != nil {
		t.Fatalf("Transaction signing failed: %v", err)
	}

	if !tx.VerifySignature(senderPub) {
		t.Errorf("FAIL: Valid transaction signature was rejected!")
	}

	// ATTACK SIMULATION: Tamper amount from 100 to 50,000 APN
	tx.Amount = 50000

	if tx.VerifySignature(senderPub) {
		t.Errorf("SECURITY FAILURE: Validation engine accepted a tampered transaction!")
	} else {
		t.Logf("SUCCESS: Tampered transaction strictly rejected by validation engine.")
	}
}

func TestInvalidBlockHashRejection(t *testing.T) {
	genesis := GenesisBlock()

	fakeBlock := &Block{
		Header: BlockHeader{
			Height:        1,
			PrevBlockHash: "0xBAD_FAKE_PREVIOUS_HASH_00000000000000000000000000000000",
			Timestamp:     time.Now().Unix(),
		},
		Transactions: [][]byte{[]byte("fake_transaction_data")},
	}
	fakeBlock.Header.BlockHash = fakeBlock.CalculateHash()

	err := fakeBlock.ValidateBlock(genesis)
	if err == nil {
		t.Errorf("SECURITY FAILURE: Validation engine accepted block with fake PrevBlockHash!")
	} else {
		t.Logf("SUCCESS: Invalid block rejected with error: %v", err)
	}
}

func TestValidBlockValidation(t *testing.T) {
	genesis := GenesisBlock()

	validBlock := &Block{
		Header: BlockHeader{
			Height:        1,
			PrevBlockHash: genesis.Header.BlockHash,
			Timestamp:     time.Now().Unix(),
		},
		Transactions: [][]byte{[]byte("valid_transaction_data")},
	}
	validBlock.Header.BlockHash = validBlock.CalculateHash()

	err := validBlock.ValidateBlock(genesis)
	if err != nil {
		t.Errorf("FAIL: Valid block was rejected by engine: %v", err)
	} else {
		t.Logf("SUCCESS: Valid block successfully passed validation engine.")
	}
}
