# 👾♟️ Knightmare - Trash-Talking Chess Bot 

Knightmare is a physical chess-playing robot that combines strategic gameplay with AI-powered trash talk, drawing inspiration from iconic movie and series villains. It's not just a formidable opponent; it's designed to challenge and taunt you with style!

## Features

- **Physical Gameplay**: Engages users with a tangible chess-playing robot.
- **AI-Powered Trash Talk** (yet to be implemented): Utilizes artificial intelligence to deliver dynamic and context-aware taunts during gameplay.
- **Multilingual Support**: Offers trash-talking capabilities in multiple languages for a global experience.
- **Adaptive Difficulty**: Adjusts the level of challenge based on the player's skill, ensuring an engaging experience for beginners and experts alike.

## System Architecture

Knightmare is structured with a microservices approach, comprising:

- **Backend Service**: Developed using NestJS, it manages game logic, player interactions, and system integrations.
- **Frontend Interface**: Built with Next.js, it provides users with an intuitive and responsive interface to interact with the chess bot.
- **Chess Engine Service**: Implemented in Python, this service leverages the Stockfish engine to determine optimal moves and strategies.

## Installation (outdated)

To set up the Knightmare project locally, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Abhinav-Prajapati/Knightmare.git
   cd Knightmare
   ```

2. **Ensure you have Docker installed**, as the project utilizes Docker for containerization.

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and define necessary environment variables as specified in `.env.example`.

4. **Build and Run Services**:
   Use Docker Compose to build and start all services:
   ```bash
   docker-compose up --build
   ```
   This command initializes the backend, frontend, and chess engine services.

5. **Access the Application**:
   Once the services are running, navigate to http://localhost:8080 in your browser to interact with Knightmare.

## Usage

After accessing the application:

1. **Start a Game**: Initiate a new game session through the user-friendly interface.
2. **Engage with Knightmare**: Play chess against the bot, experiencing real-time AI-powered trash talk.
3. **Adjust Settings**: Customize language preferences and difficulty levels to tailor your experience.