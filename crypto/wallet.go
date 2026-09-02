package crypto

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
)

type APNWallet struct {
	PrivateKey *ecdsa.PrivateKey
	PublicKey  []byte
	Address    string
}

func NewWallet() *APNWallet {
	curve := elliptic.P256()

	privateKey, err := ecdsa.GenerateKey(curve, rand.Reader)
	if err != nil {
		log.Panic("Kuskure wajen samar da Private Key: ", err)
	}

	pubKey := elliptic.Marshal(curve, privateKey.PublicKey.X, privateKey.PublicKey.Y)

	// Hash ɗin Public Key don cire Wallet Address (Ethereum-style 20 bytes)
	hash := sha256.Sum256(pubKey)
	addressBytes := hash[12:] // Ɗauko 20 bytes na ƙarshe
	address := "0x" + hex.EncodeToString(addressBytes)

	return &APNWallet{
		PrivateKey: privateKey,
		PublicKey:  pubKey,
		Address:    address,
	}
}

func (w *APNWallet) GetPrivateKeyHex() string {
	dBytes := make([]byte, 32)
	w.PrivateKey.D.FillBytes(dBytes)
	return hex.EncodeToString(dBytes)
}

func (w *APNWallet) DisplayWalletInfo() {
	fmt.Println("--------------------------------------------------")
	fmt.Println("         APN NETWORK WALLET GENERATOR             ")
	fmt.Println("--------------------------------------------------")
	fmt.Printf("PRIVATE KEY : %s\n", w.GetPrivateKeyHex())
	fmt.Printf("PUBLIC KEY  : %s\n", hex.EncodeToString(w.PublicKey))
	fmt.Printf("APN ADDRESS : %s\n", w.Address)
	fmt.Println("--------------------------------------------------")
}
