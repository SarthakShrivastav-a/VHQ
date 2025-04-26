# Virtual HQ Backend

This is the backend server for the Virtual HQ application, built with Express and Socket.IO.

## Features

- Real-time user position tracking
- Proximity-based communication
- User management (join/leave)
- Chat messaging between users in range

## API Endpoints

- `GET /api/health` - Check server health
- `GET /api/users` - Get all connected users
- `GET /api/config` - Get server configuration

## Socket.IO Events

### Client to Server

- `join` - User joins the virtual HQ
- `move` - User moves to a new position
- `message` - User sends a chat message

### Server to Client

- `users` - List of all connected users
- `user-joined` - New user joined
- `user-left` - User disconnected
- `user-moved` - User moved to a new position
- `message` - Chat message received

## Environment Variables

- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `COMMUNICATION_RANGE` - Maximum distance for users to communicate (default: 200 pixels)

## Running the Server

```bash
# Install dependencies
npm install

# Start server in development mode
npm run dev

# Start server in production mode
npm start
``` 