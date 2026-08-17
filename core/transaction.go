package core

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"math/big"
)

type Transaction struct {
	Sender    string
	Recipient string
	Amount    int64
	Signature []byte
}

func NewTransaction(sender, recipient string, amount int64) *Transaction {
	return &Transaction{
		Sender:    sender,
		Recipient: recipient,
		Amount:    amount,
	}
}

// CalculateHash includes Amount so any modification invalidates signature
func (tx *Transaction) CalculateHash() []byte {
	record := fmt.Sprintf("%s:%s:%d", tx.Sender, tx.Recipient, tx.Amount)
	hash := sha256.Sum256([]byte(record))
	return hash[:]
}

func (tx *Transaction) Sign(privKey *ecdsa.PrivateKey) error {
	hash := tx.CalculateHash()
	r, s, err := ecdsa.Sign(rand.Reader, privKey, hash)
	if err != nil {
		return err
	}

	// Store 64-byte signature (R + S)
	signature := append(r.Bytes(), s.Bytes()...)
	tx.Signature = signature
	return nil
}

func (tx *Transaction) VerifySignature(pubKeyBytes []byte) bool {
	if len(tx.Signature) < 64 {
		return false
	}

	x, y := elliptic.Unmarshal(elliptic.P256(), pubKeyBytes)
	if x == nil || y == nil {
		return false
	}

	pubKey := &ecdsa.PublicKey{
		Curve: elliptic.P256(),
		X:     x,
		Y:     y,
	}

	r := new(big.Int).SetBytes(tx.Signature[:32])
	s := new(big.Int).SetBytes(tx.Signature[32:])

	hash := tx.CalculateHash()
	return ecdsa.Verify(pubKey, hash, r, s)
}

func (tx *Transaction) String() string {
	return fmt.Sprintf("TX [%s -> %s | %d APN]", tx.Sender[:10], tx.Recipient[:10], tx.Amount)
}
