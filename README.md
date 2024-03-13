# Quick Chess

Quick Chess is a simple web-based chess game server implemented in Go, using the Gin framework for HTTP routing and Gorilla WebSockets for real-time communication between clients and the server. It allows players to create and join chess games and play against each other in real-time.

## Features

- Create new chess games with unique identifiers.
- Join existing chess games as a player.
- Real-time updates of game state using WebSockets.
- Supports multiple concurrent games.

## Installation

1. Clone the repository:
```
git clone https://github.com/Abhinav-Prajapati/quick-chess
```
2. Install dependencies: 
```
go get -u github.com/gin-gonic/gin
go get -u github.com/gin-contrib/cors
go get -u github.com/gorilla/websocket
go get -u github.com/notnil/chess
```
3. Build and run the server:
```
go run main.go
```

4. Access the server at `http://localhost:8080`.

## Usage

### Creating a New Game

To create a new game, make a GET request to `/newgame/:gameid`, where `:gameid` is a unique identifier for the game. Example:

```
GET http://localhost:8080/newgame/game123
```

### Playing the Game

Once two players have joined the game, they can start playing by making WebSocket connections to the server. The server sends real-time updates of the game state using WebSockets.

## Contributing

If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

