import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active rooms
const rooms = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room
  socket.on('join-room', ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(userId);

    // Notify others in the room
    socket.to(roomId).emit('user-joined', { userId });

    // Send list of users in the room
    io.to(roomId).emit('room-users', {
      roomId,
      users: Array.from(rooms.get(roomId))
    });
  });

  // WebRTC signaling
  socket.on('offer', ({ offer, roomId, userId }) => {
    socket.to(roomId).emit('offer', { offer, userId });
  });

  socket.on('answer', ({ answer, roomId, userId }) => {
    socket.to(roomId).emit('answer', { answer, userId });
  });

  socket.on('ice-candidate', ({ candidate, roomId, userId }) => {
    socket.to(roomId).emit('ice-candidate', { candidate, userId });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all rooms
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(roomId).emit('user-left', { userId: socket.id });
        io.to(roomId).emit('room-users', {
          roomId,
          users: Array.from(users)
        });
        
        // Clean up empty rooms
        if (users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 