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
  'http://localhost:5174',
  'http://localhost:5175'
];
const COMMUNICATION_RANGE = process.env.COMMUNICATION_RANGE ? parseInt(process.env.COMMUNICATION_RANGE, 10) : 250; // Increased for better proximity detection

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

// Store WebRTC signaling offers
const webRTCOffers = new Map();

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
      // Store the previous position for comparison
      const prevPosition = { ...user.position };
      
      // Update position
      user.position = position;
      users.set(socket.id, user);
      
      // Calculate who is in range and should receive messages
      const inRangeUsers = findUsersInRange(user);
      console.log(`User ${socket.id} moved to (${position.x}, ${position.y}). Users in range: ${inRangeUsers.length}`);
      
      // Broadcast the updated position to all other users
      socket.broadcast.emit('user-moved', {
        id: socket.id,
        position,
        inRange: inRangeUsers.map(u => u.id)
      });
      
      // Send the current list of users to everyone to ensure sync
      if (Math.abs(prevPosition.x - position.x) > 50 || Math.abs(prevPosition.y - position.y) > 50) {
        io.emit('users', Array.from(users.values()));
      }
    }
  });

  // Handle requests for updated user list
  socket.on('get-users', () => {
    socket.emit('users', Array.from(users.values()));
  });

  // Handle chat messages
  socket.on('message', (messageData) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    
    const message = {
      id: generateId(),
      sender: sender.name,
      senderId: socket.id,
      text: messageData.text,
      timestamp: Date.now()
    };
    
    // Find users in communication range
    const inRangeUsers = findUsersInRange(sender);
    
    // Send message to the sender
    socket.emit('message', message);
    
    // Send message to users in range
    inRangeUsers.forEach(user => {
      io.to(user.id).emit('message', message);
    });
  });
  
  // WebRTC Signaling
  socket.on('webrtc-offer', (data) => {
    const { to, offer } = data;
    const from = socket.id;
    
    // Store the offer
    webRTCOffers.set(`${from}-${to}`, offer);
    
    // Send to the target user
    io.to(to).emit('webrtc-offer', { from, offer });
  });
  
  socket.on('webrtc-get-offer', (data) => {
    const { from } = data;
    const to = socket.id;
    
    // Retrieve stored offer
    const offer = webRTCOffers.get(`${from}-${to}`);
    
    if (offer) {
      socket.emit('webrtc-offer-details', { offer });
    }
  });
  
  socket.on('webrtc-answer', (data) => {
    const { to, answer } = data;
    const from = socket.id;
    
    // Send to the target user
    io.to(to).emit('webrtc-answer', { from, answer });
  });
  
  socket.on('webrtc-candidate', (data) => {
    const { to, candidate } = data;
    
    // Send to the target user
    io.to(to).emit('webrtc-candidate', { from: socket.id, candidate });
  });
  
  socket.on('webrtc-hangup', (data) => {
    const { to } = data;
    
    // Clear any stored offers
    webRTCOffers.delete(`${socket.id}-${to}`);
    webRTCOffers.delete(`${to}-${socket.id}`);
    
    // Notify the other user
    io.to(to).emit('webrtc-hangup', socket.id);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    users.delete(socket.id);
    
    // Clean up WebRTC offers
    for (const key of webRTCOffers.keys()) {
      if (key.startsWith(`${socket.id}-`) || key.endsWith(`-${socket.id}`)) {
        webRTCOffers.delete(key);
      }
    }
    
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

// Generate random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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