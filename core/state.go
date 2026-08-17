package core

import (
	"fmt"
	"sync"
)

// AccountState manages wallet balances across the network
type AccountState struct {
	Balances map[string]int64
	mu       sync.Mutex
}

// NewAccountState initializes the global ledger state
func NewAccountState() *AccountState {
	return &AccountState{
		Balances: make(map[string]int64),
	}
}

// MintInitialTokens assigns genesis supply to founder/validators
func (state *AccountState) MintInitialTokens(address string, amount int64) {
	state.mu.Lock()
	defer state.mu.Unlock()

	state.Balances[address] = amount
	fmt.Printf("[+] Minted Genesis Allocation: %d APN -> Address: %s\n", amount, address)
}

// GetBalance retrieves current token balance of an address
func (state *AccountState) GetBalance(address string) int64 {
	state.mu.Lock()
	defer state.mu.Unlock()

	return state.Balances[address]
}

// ApplyTransaction verifies balance sufficiency and updates state balances
func (state *AccountState) ApplyTransaction(tx *Transaction) error {
	state.mu.Lock()
	defer state.mu.Unlock()

	senderBalance := state.Balances[tx.Sender]

	// Insufficient balance validation
	if senderBalance < tx.Amount {
		return fmt.Errorf("insufficient balance: sender has %d APN, trying to send %d APN", senderBalance, tx.Amount)
	}

	// State balance updates
	state.Balances[tx.Sender] -= tx.Amount
	state.Balances[tx.Recipient] += tx.Amount

	fmt.Printf("[✓] State Updated: %s (-%d APN) | %s (+%d APN)\n",
		tx.Sender[:10], tx.Amount, tx.Recipient[:10], tx.Amount)

	return nil
}
