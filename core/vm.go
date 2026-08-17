package core

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// Opcode constants for APN VM
const (
	OpPUSH  = "PUSH"  // Push value to stack
	OpADD   = "ADD"   // Add top two stack values
	OpSUB   = "SUB"   // Subtract top two stack values
	OpSTORE = "STORE" // Store value to state key
	OpLOAD  = "LOAD"  // Load value from state key
)

type APNVirtualMachine struct {
	Stack   []int
	Storage map[string]int
}

func NewAPNVirtualMachine() *APNVirtualMachine {
	return &APNVirtualMachine{
		Stack:   make([]int, 0),
		Storage: make(map[string]int),
	}
}

func (vm *APNVirtualMachine) Execute(code string) error {
	instructions := strings.Split(code, "\n")

	for _, line := range instructions {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "//") {
			continue
		}

		parts := strings.Fields(line)
		op := parts[0]

		switch op {
		case OpPUSH:
			if len(parts) < 2 {
				return errors.New("PUSH requires a numeric value")
			}
			val, err := strconv.Atoi(parts[1])
			if err != nil {
				return fmt.Errorf("invalid PUSH value: %v", err)
			}
			vm.Stack = append(vm.Stack, val)

		case OpADD:
			if len(vm.Stack) < 2 {
				return errors.New("stack underflow on ADD")
			}
			a := vm.Stack[len(vm.Stack)-1]
			b := vm.Stack[len(vm.Stack)-2]
			vm.Stack = vm.Stack[:len(vm.Stack)-2]
			vm.Stack = append(vm.Stack, a+b)

		case OpSUB:
			if len(vm.Stack) < 2 {
				return errors.New("stack underflow on SUB")
			}
			a := vm.Stack[len(vm.Stack)-1]
			b := vm.Stack[len(vm.Stack)-2]
			vm.Stack = vm.Stack[:len(vm.Stack)-2]
			vm.Stack = append(vm.Stack, b-a)

		case OpSTORE:
			if len(parts) < 2 {
				return errors.New("STORE requires a key name")
			}
			if len(vm.Stack) < 1 {
				return errors.New("stack underflow on STORE")
			}
			val := vm.Stack[len(vm.Stack)-1]
			vm.Stack = vm.Stack[:len(vm.Stack)-1]
			vm.Storage[parts[1]] = val

		case OpLOAD:
			if len(parts) < 2 {
				return errors.New("LOAD requires a key name")
			}
			val, exists := vm.Storage[parts[1]]
			if !exists {
				val = 0
			}
			vm.Stack = append(vm.Stack, val)

		default:
			return fmt.Errorf("unknown opcode: %s", op)
		}
	}

	return nil
}
