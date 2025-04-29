# VirtualHQ Backend Server

A real-time communication server using WebSocket and WebRTC for room-based video/audio chat.

## Features

- Room-based communication
- WebRTC peer-to-peer connections
- Real-time signaling using Socket.IO
- Cross-origin resource sharing (CORS) enabled

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:
```
PORT=3000
NODE_ENV=development
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

The server runs on `http://localhost:3000` by default.

### WebSocket Events

- `join-room`: Join a room with a user ID
- `offer`: Send WebRTC offer
- `answer`: Send WebRTC answer
- `ice-candidate`: Send ICE candidate
- `user-joined`: Notify when a user joins
- `user-left`: Notify when a user leaves
- `room-users`: Get list of users in a room

## WebRTC Signaling

The server handles WebRTC signaling through Socket.IO events:

1. When a user joins a room, they receive a list of existing users
2. Users can exchange WebRTC offers, answers, and ICE candidates
3. The server manages room membership and notifies users of changes 