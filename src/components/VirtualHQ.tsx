import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ConnectionStatus from './ConnectionStatus';

interface User {
  id: string;
  name: string;
  position: { x: number; y: number };
  avatar: string;
  inRange?: string[];
}

interface Message {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

const VirtualHQ: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const hqRef = useRef<HTMLDivElement>(null);

  // Connect to socket server
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('users', (usersList: User[]) => {
      setUsers(usersList);
    });

    newSocket.on('user-joined', (user: User) => {
      setUsers(prev => [...prev, user]);
    });

    newSocket.on('user-left', (userId: string) => {
      setUsers(prev => prev.filter(user => user.id !== userId));
    });

    newSocket.on('user-moved', (userData: User) => {
      setUsers(prev => 
        prev.map(user => 
          user.id === userData.id 
            ? { ...user, position: userData.position, inRange: userData.inRange } 
            : user
        )
      );
    });

    newSocket.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle join HQ
  const handleJoin = () => {
    if (!username.trim() || !socket) return;
    
    const newUser: User = {
      id: socket.id,
      name: username,
      position: { x: 100, y: 100 },
      avatar: 'default'
    };
    
    setCurrentUser(newUser);
    socket.emit('join', newUser);
    setIsConnected(true);
  };

  // Handle movement
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hqRef.current || !currentUser || !socket) return;
    
    const rect = hqRef.current.getBoundingClientRect();
    const newPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Update local state
    setCurrentUser(prev => prev ? { ...prev, position: newPosition } : null);
    
    // Update server
    socket.emit('move', newPosition);
  };

  // Send message
  const sendMessage = () => {
    if (!inputMessage.trim() || !socket || !currentUser) return;
    
    socket.emit('message', { text: inputMessage });
    setInputMessage('');
  };

  // Find if a user is in range
  const isUserInRange = (userId: string): boolean => {
    if (!currentUser) return false;
    const user = users.find(u => u.id === userId);
    return user?.inRange?.includes(currentUser.id) || false;
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Join Virtual HQ</h2>
        <input
          type="text"
          placeholder="Enter your name"
          className="border p-2 mb-4 w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button 
          className="bg-blue-600 text-white py-2 px-4 rounded"
          onClick={handleJoin}
        >
          Join
        </button>
        <ConnectionStatus 
          isConnected={isConnected} 
          usersCount={users.length} 
        />
      </div>
    );
  }

  return (
    <div className="flex w-full h-[600px]">
      <div 
        ref={hqRef}
        className="flex-grow relative bg-gray-100 border" 
        onClick={handleMove}
      >
        {/* Virtual space */}
        <div className="absolute top-2 left-2 bg-white p-2 rounded shadow z-10">
          <p className="text-sm">Click anywhere to move</p>
          <p className="text-xs text-gray-500">Users in range can see your messages</p>
        </div>
        
        {/* Render all users */}
        {users.map(user => (
          <div 
            key={user.id}
            className={`absolute w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              user.id === currentUser?.id ? 'bg-blue-500' : 'bg-gray-400'
            } ${isUserInRange(user.id) ? 'ring-2 ring-green-500' : ''}`}
            style={{ 
              left: `${user.position.x}px`, 
              top: `${user.position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="text-white text-xs">{user.name.substring(0, 2).toUpperCase()}</span>
            <div className="absolute -bottom-5 whitespace-nowrap text-xs font-medium">
              {user.name}
            </div>
          </div>
        ))}

        <ConnectionStatus 
          isConnected={isConnected} 
          socketId={socket?.id}
          usersCount={users.length} 
        />
      </div>
      
      {/* Chat panel */}
      <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
        <div className="p-3 border-b font-medium">Chat</div>
        <div className="flex-grow p-3 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className={`mb-2 ${message.senderId === currentUser?.id ? 'text-right' : ''}`}>
              <div className={`inline-block p-2 rounded ${
                message.senderId === currentUser?.id 
                  ? 'bg-blue-100' 
                  : 'bg-gray-100'
              }`}>
                <div className="text-xs font-medium text-gray-600">{message.senderName}</div>
                <div>{message.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t flex">
          <input
            type="text"
            className="flex-grow border rounded-l p-2"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button 
            className="bg-blue-600 text-white px-3 rounded-r"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualHQ; 