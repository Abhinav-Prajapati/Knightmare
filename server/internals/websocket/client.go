package websocket

import (
	"log"

	"github.com/gorilla/websocket"
)

type Message struct {
	Content string `json:"content"`
}

type Client struct {
	conn     *websocket.Conn
	clientId string
	gameId   string
	Message  chan string
}

func (c *Client) writeMessage() {
	defer func() {
		c.conn.Close()
	}()

	for {
		message, ok := <-c.Message
		if !ok {
			return
		}
		c.conn.WriteJSON(message)
	}
}

func (c *Client) readMessage() {
	// TODO: take game as input and brodcast the msg to other players
	defer func() {
		c.conn.Close()
	}()

	for {
		_, m, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error %v:", err)
			}
			break
		}
		msg := &Message{
			Content: string(m),
		}
		c.conn.WriteJSON(msg) // just echo msg to server for testing
	}
}
