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

// APNWallet yana ɗauke da mabuɗan sirri da na fili tare da adireshin walat
type APNWallet struct {
	PrivateKey *ecdsa.PrivateKey
	PublicKey  []byte
	Address    string
}

// NewWallet yana ƙirƙirar sabon walat na APN ta hanyar amfani da ECDSA
func NewWallet() *APNWallet {
	curve := elliptic.P256()

	privateKey, err := ecdsa.GenerateKey(curve, rand.Reader)
	if err != nil {
		log.Panic("Kuskure wajen samar da Private Key: ", err)
	}

	pubKey := append(privateKey.PublicKey.X.Bytes(), privateKey.PublicKey.Y.Bytes()...)

	// Hash ɗin Public Key don cire Wallet Address
	hash := sha256.Sum256(pubKey)
	addressBytes := hash[12:] // Ɗauko 20 bytes na ƙarshe
	address := "0x" + hex.EncodeToString(addressBytes)

	return &APNWallet{
		PrivateKey: privateKey,
		PublicKey:  pubKey,
		Address:    address,
	}
}

// GetPrivateKeyHex yana maida Private Key zuwa string mai sauƙin karantawa
func (w *APNWallet) GetPrivateKeyHex() string {
	return hex.EncodeToString(w.PrivateKey.D.Bytes())
}

// DisplayWalletInfo yana nuna bayanan walat a Terminal
func (w *APNWallet) DisplayWalletInfo() {
	fmt.Println("--------------------------------------------------")
	fmt.Println("         APN NETWORK WALLET GENERATOR             ")
	fmt.Println("--------------------------------------------------")
	fmt.Printf("PRIVATE KEY : %s\n", w.GetPrivateKeyHex())
	fmt.Printf("PUBLIC KEY  : %s\n", hex.EncodeToString(w.PublicKey))
	fmt.Printf("APN ADDRESS : %s\n", w.Address)
	fmt.Println("--------------------------------------------------")
}