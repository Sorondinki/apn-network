package core

import (
	"fmt"
	"math/big"
	"sync"
)

// AccountState manages wallet balances across the network using BigInt for 18 Decimals
type AccountState struct {
	Balances map[string]*big.Int
	mu       sync.RWMutex
}

// NewAccountState initializes the global ledger state
func NewAccountState() *AccountState {
	return &AccountState{
		Balances: make(map[string]*big.Int),
	}
}

// MintInitialTokens assigns genesis supply to founder/validators
func (state *AccountState) MintInitialTokens(address string, amount *big.Int) {
	state.mu.Lock()
	defer state.mu.Unlock()

	state.Balances[address] = new(big.Int).Set(amount)
	fmt.Printf("[+] Minted Genesis Allocation: %s $APN -> Address: %s\n", amount.String(), address)
}

// GetBalance retrieves current token balance of an address
func (state *AccountState) GetBalance(address string) *big.Int {
	state.mu.RLock()
	defer state.mu.RUnlock()

	if bal, exists := state.Balances[address]; exists {
		return new(big.Int).Set(bal)
	}
	return big.NewInt(0)
}

// ApplyTransaction verifies balance sufficiency and updates state balances
func (state *AccountState) ApplyTransaction(tx *Transaction) error {
	state.mu.Lock()
	defer state.mu.Unlock()

	senderBal, exists := state.Balances[tx.Sender]
	if !exists {
		senderBal = big.NewInt(0)
	}

	// Insufficient balance validation
	if senderBal.Cmp(tx.Amount) < 0 {
		return fmt.Errorf("insufficient balance: sender has %s $APN, trying to send %s $APN", senderBal.String(), tx.Amount.String())
	}

	// State balance updates
	state.Balances[tx.Sender] = new(big.Int).Sub(senderBal, tx.Amount)

	recipBal, exists := state.Balances[tx.Recipient]
	if !exists {
		recipBal = big.NewInt(0)
	}
	state.Balances[tx.Recipient] = new(big.Int).Add(recipBal, tx.Amount)

	senderShort := tx.Sender
	if len(tx.Sender) > 10 {
		senderShort = tx.Sender[:10]
	}
	recipShort := tx.Recipient
	if len(tx.Recipient) > 10 {
		recipShort = tx.Recipient[:10]
	}

	fmt.Printf("[✓] State Updated: %s (-%s $APN) | %s (+%s $APN)\n",
		senderShort, tx.Amount.String(), recipShort, tx.Amount.String())

	return nil
}
