package p2p

import (
	"fmt"
	"net"
)

// P2PNode represents a local network node listener
type P2PNode struct {
	Port     string
	Listener net.Listener
}

// NewP2PNode initializes a new P2P Network Node
func NewP2PNode(port string) *P2PNode {
	return &P2PNode{Port: port}
}

// StartServer starts listening for incoming peer connections
func (node *P2PNode) StartServer() error {
	listener, err := net.Listen("tcp", ":"+node.Port)
	if err != nil {
		return err
	}
	node.Listener = listener
	fmt.Printf("[*] P2P Network Node active and listening on TCP port :%s\n", node.Port)

	go func() {
		for {
			conn, err := node.Listener.Accept()
			if err != nil {
				continue
			}
			go node.handleConnection(conn)
		}
	}()

	return nil
}

// handleConnection manages incoming data from peer nodes
func (node *P2PNode) handleConnection(conn net.Conn) {
	defer conn.Close()
	fmt.Printf("[+] New Peer Connected from Remote Address: %s\n", conn.RemoteAddr().String())
}
