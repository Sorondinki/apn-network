package core

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
)

type Transaction struct {
	Sender    string
	Recipient string
	Amount    int64
	Signature []byte
	TxHash    []byte
}

func NewTransaction(sender, recipient string, amount int64) *Transaction {
	tx := &Transaction{
		Sender:    sender,
		Recipient: recipient,
		Amount:    amount,
	}
	tx.TxHash = tx.CalculateHash()
	return tx
}

func (tx *Transaction) CalculateHash() []byte {
	record := fmt.Sprintf("%s%s%d", tx.Sender, tx.Recipient, tx.Amount)
	hash := sha256.Sum256([]byte(record))
	return hash[:]
}

func (tx *Transaction) Sign(privKey *ecdsa.PrivateKey) error {
	r, s, err := ecdsa.Sign(rand.Reader, privKey, tx.TxHash)
	if err != nil {
		return err
	}
	tx.Signature = append(r.Bytes(), s.Bytes()...)
	return nil
}

func (tx *Transaction) VerifySignature(pubKeyBytes []byte) bool {
	if len(tx.Signature) < 64 {
		return false
	}

	curve := elliptic.P256()

	// Ensure correct uncompressed point format prefix (0x04) if needed
	formattedPubKey := pubKeyBytes
	if len(pubKeyBytes) == 64 {
		formattedPubKey = append([]byte{0x04}, pubKeyBytes...)
	}

	x, y := elliptic.Unmarshal(curve, formattedPubKey)
	if x == nil || y == nil {
		return false
	}

	pubKey := ecdsa.PublicKey{Curve: curve, X: x, Y: y}
	r := new(big.Int).SetBytes(tx.Signature[:32])
	s := new(big.Int).SetBytes(tx.Signature[32:])

	return ecdsa.Verify(&pubKey, tx.TxHash, r, s)
}

func (tx *Transaction) String() string {
	return fmt.Sprintf("TX [%s...] From: %s -> To: %s | Amount: %d APN",
		hex.EncodeToString(tx.TxHash)[:8], tx.Sender[:10], tx.Recipient[:10], tx.Amount)
}
