package consensus

import (
	"fmt"
	"math/big"
)

// Validator represents an active node operator staking APN tokens
type Validator struct {
	Address     string
	StakedAmount *big.Int
	IsActive    bool
}

// DPoSEngine manages the voting and validator selection
type DPoSEngine struct {
	Validators map[string]*Validator
	ActivePool []string
}

// NewDPoSEngine initializes the DPoS Consensus System
func NewDPoSEngine() *DPoSEngine {
	return &DPoSEngine{
		Validators: make(map[string]*Validator),
		ActivePool: make([]string, 0),
	}
}

// RegisterValidator adds a new validator candidate with staked APN tokens
func (d *DPoSEngine) RegisterValidator(address string, amount *big.Int) {
	d.Validators[address] = &Validator{
		Address:     address,
		StakedAmount: amount,
		IsActive:    true,
	}
	d.ActivePool = append(d.ActivePool, address)
	fmt.Printf("[+] Registered Active Validator: %s | Staked: %s APN\n", address, amount.String())
}

// SelectProposer chooses a validator block proposer for the current round
func (d *DPoSEngine) SelectProposer(slot int64) string {
	if len(d.ActivePool) == 0 {
		return "0x0000000000000000000000000000000000000000"
	}
	selectedIndex := int(slot) % len(d.ActivePool)
	return d.ActivePool[selectedIndex]
}