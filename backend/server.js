import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Environment variables
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
// Allow multiple frontend URLs for development
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174'
];
const COMMUNICATION_RANGE = process.env.COMMUNICATION_RANGE ? parseInt(process.env.COMMUNICATION_RANGE, 10) : 200;

// Create Socket.IO server with CORS config
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS
}));
app.use(express.json());

// Store connected users
const users = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins with their position
  socket.on('join', (userData) => {
    console.log(`User ${socket.id} joined with name: ${userData.name}`);
    users.set(socket.id, {
      id: socket.id,
      name: userData.name,
      position: userData.position || { x: 0, y: 0 },
      avatar: userData.avatar || 'default'
    });
    
    // Send the current users list to the new user
    socket.emit('users', Array.from(users.values()));
    
    // Broadcast the new user to everyone else
    socket.broadcast.emit('user-joined', users.get(socket.id));
  });

  // User updates their position
  socket.on('move', (position) => {
    const user = users.get(socket.id);
    if (user) {
      user.position = position;
      users.set(socket.id, user);
      
      // Calculate who is in range and should receive messages
      const inRangeUsers = findUsersInRange(user);
      
      // Broadcast the updated position to all other users
      socket.broadcast.emit('user-moved', {
        id: socket.id,
        position,
        inRange: inRangeUsers.map(u => u.id)
      });
    }
  });

  // Handle chat messages
  socket.on('message', (messageData) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    
    // Find users in communication range
    const inRangeUsers = findUsersInRange(sender);
    
    // Send message only to users in range
    inRangeUsers.forEach(user => {
      io.to(user.id).emit('message', {
        senderId: socket.id,
        senderName: sender.name,
        text: messageData.text,
        timestamp: Date.now()
      });
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    users.delete(socket.id);
    io.emit('user-left', socket.id);
  });
});

// Helper function to find users in range
function findUsersInRange(user) {
  const inRangeUsers = [];
  
  users.forEach((otherUser) => {
    if (otherUser.id !== user.id) {
      const distance = calculateDistance(
        user.position.x, 
        user.position.y, 
        otherUser.position.x, 
        otherUser.position.y
      );
      
      if (distance <= COMMUNICATION_RANGE) {
        inRangeUsers.push(otherUser);
      }
    }
  });
  
  return inRangeUsers;
}

// Calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now() });
});

app.get('/api/users', (req, res) => {
  res.json(Array.from(users.values()));
});

app.get('/api/config', (req, res) => {
  res.json({
    communicationRange: COMMUNICATION_RANGE
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Communication range: ${COMMUNICATION_RANGE} pixels`);
}); 