package consensus

import (
	"fmt"
	"math/big"
	"sync"
)

type Validator struct {
	Address      string
	StakedAmount *big.Int
	IsActive     bool
	Jailed       bool
}

type DPoSEngine struct {
	mu         sync.RWMutx
	Validators map[string]*Validator
}

func NewDPoSEngine() *DPoSEngine {
	return &DPoSEngine{
		Validators: make(map[string]*Validator),
	}
}

func (d *DPoSEngine) RegisterValidator(address string, stake *big.Int) {
	d.mu.Lock()
	defer d.mu.Unlock()

	d.Validators[address] = &Validator{
		Address:      address,
		StakedAmount: stake,
		IsActive:     true,
		Jailed:       false,
	}
}

// SlashValidator slashes a validator's stake and jails them for malicious acts
func (d *DPoSEngine) SlashValidator(address string, penaltyPercentage int64) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	v, exists := d.Validators[address]
	if !exists {
		return fmt.Errorf("validator %s not found", address)
	}

	if v.Jailed {
		return fmt.Errorf("validator %s is already jailed", address)
	}

	// Calculate slash amount
	penalty := new(big.Int).Mul(v.StakedAmount, big.NewInt(penaltyPercentage))
	penalty.Div(penalty, big.NewInt(100))

	v.StakedAmount.Sub(v.StakedAmount, penalty)
	v.IsActive = false
	v.Jailed = true

	fmt.Printf("[⚠️ SLASHING ALERT] Validator %s slashed by %d%% (%s APN). Jailed status: true\n",
		address, penaltyPercentage, penalty.String())

	return nil
}
