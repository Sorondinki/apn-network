package p2p

import (
	"bufio"
	"fmt"
	"net"
	"sync"
)

const (
	MessageTypeTx    = "NEW_TX"
	MessageTypeBlock = "NEW_BLOCK"
)

type P2PNode struct {
	Port    string
	Peers   map[string]net.Conn
	mu      sync.Mutex
	MsgChan chan string
}

func NewP2PNode(port string) *P2PNode {
	return &P2PNode{
		Port:    port,
		Peers:   make(map[string]net.Conn),
		MsgChan: make(chan string, 100),
	}
}

func (node *P2PNode) StartServer() {
	listener, err := net.Listen("tcp", ":"+node.Port)
	if err != nil {
		fmt.Printf("[!] P2P Server Error on port %s: %v\n", node.Port, err)
		return
	}
	defer listener.Close()

	fmt.Printf("[*] P2P Network Node Active & Listening on TCP Port :%s\n", node.Port)

	for {
		conn, err := listener.Accept()
		if err != nil {
			continue
		}
		node.mu.Lock()
		node.Peers[conn.RemoteAddr().String()] = conn
		node.mu.Unlock()

		go node.handlePeerConnection(conn)
	}
}

func (node *P2PNode) ConnectToPeer(address string) error {
	conn, err := net.Dial("tcp", address)
	if err != nil {
		return fmt.Errorf("failed to connect to peer %s: %v", address, err)
	}

	node.mu.Lock()
	node.Peers[address] = conn
	node.mu.Unlock()

	fmt.Printf("[+] Successfully Connected to Peer Node: %s\n", address)
	go node.handlePeerConnection(conn)
	return nil
}

func (node *P2PNode) BroadcastMessage(msgType string, payload string) {
	node.mu.Lock()
	defer node.mu.Unlock()

	formattedMsg := fmt.Sprintf("%s|%s\n", msgType, payload)

	for addr, conn := range node.Peers {
		_, err := conn.Write([]byte(formattedMsg))
		if err != nil {
			fmt.Printf("[!] Failed to gossip to peer %s: %v\n", addr, err)
			conn.Close()
			delete(node.Peers, addr)
		} else {
			fmt.Printf("[>>>] Gossiped %s to Peer [%s]\n", msgType, addr)
		}
	}
}

func (node *P2PNode) handlePeerConnection(conn net.Conn) {
	defer conn.Close()
	scanner := bufio.NewScanner(conn)

	for scanner.Scan() {
		msg := scanner.Text()
		fmt.Printf("[<<<] P2P Message Received: %s\n", msg)
		node.MsgChan <- msg
	}
}
