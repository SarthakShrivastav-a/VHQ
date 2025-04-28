import React, { useEffect, useRef, useState } from 'react';
import Game, { gameConfig } from '../game/PhaserGame';
import { io, Socket } from 'socket.io-client';
import '../styles/GameChat.css';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface User {
  id: string;
  name: string;
  position: { x: number; y: number };
  avatar: string;
}

const OfficeGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<User[]>([]);
  const [calling, setCalling] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  
  // Initialize game and socket connection
  useEffect(() => {
    console.log('OfficeGame component mounted');
    
    // Initialize Socket.IO connection
    socketRef.current = io('http://localhost:3001');
    
    // Setup Socket.IO listeners
    setupSocketListeners();
    
    // Initialize WebRTC
    initializeWebRTC();
    
    // Create Phaser game
    if (containerRef.current && !gameRef.current) {
      try {
        console.log('Creating Phaser game with config:', gameConfig);
        
        // Add debug event listeners
        const debugGame = () => {
          window.addEventListener('phaser-created', () => console.log('Phaser game created event'));
          window.addEventListener('phaser-boot', () => console.log('Boot scene started'));
          window.addEventListener('phaser-character-select', () => console.log('Character select scene started'));
          window.addEventListener('phaser-office', () => console.log('Office scene started'));
        };
        debugGame();
        
        gameRef.current = new Game({
          ...gameConfig,
          parent: containerRef.current
        });
        
        // Set global references for the game to communicate with React
        (window as any).sendChatMessage = sendMessage;
        (window as any).updateNearbyUsers = updateNearbyUsers;
        console.log('Global function updateNearbyUsers registered on window');
        
        console.log('Phaser game created successfully');
      } catch (error) {
        console.error('Error creating Phaser game:', error);
      }
    }

    return () => {
      console.log('OfficeGame component unmounting');
      
      // Clean up WebRTC
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      // Destroy Phaser game
      if (gameRef.current) {
        try {
          gameRef.current.destroy(true);
          console.log('Phaser game destroyed successfully');
          gameRef.current = null;
        } catch (error) {
          console.error('Error destroying Phaser game:', error);
        }
      }
    };
  }, []);
  
  const setupSocketListeners = () => {
    if (!socketRef.current) return;
    
    // When users list is received
    socketRef.current.on('users', (usersList: User[]) => {
      console.log('React: Received users list from server:', usersList);
      setUsers(usersList);
    });
    
    // Add new event for requesting users
    socketRef.current.on('get-users', () => {
      socketRef.current?.emit('users');
    });
    
    // When a new user joins
    socketRef.current.on('user-joined', (user: User) => {
      setUsers(prev => [...prev, user]);
    });
    
    // When a user leaves
    socketRef.current.on('user-left', (userId: string) => {
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      // Close any active call with this user
      if (activeCall === userId) {
        endCall(userId);
      }
    });
    
    // When receiving a chat message
    socketRef.current.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });
    
    // WebRTC signaling
    socketRef.current.on('webrtc-offer', async (data: { from: string, offer: RTCSessionDescriptionInit }) => {
      setIncomingCall(data.from);
      const caller = users.find(user => user.id === data.from);
      console.log(`Received call offer from ${caller?.name || data.from}`);
    });
    
    socketRef.current.on('webrtc-answer', async (data: { from: string, answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionsRef.current[data.from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('Call answered, connection established');
      }
    });
    
    socketRef.current.on('webrtc-candidate', async (data: { from: string, candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionsRef.current[data.from];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });
    
    socketRef.current.on('webrtc-hangup', (userId: string) => {
      if (activeCall === userId) {
        endCall(userId);
      }
    });
  };
  
  const initializeWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      console.log('Local audio stream initialized');
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
    }
  };
  
  // Function to update nearby users (called from the game)
  const updateNearbyUsers = (userIds: string[]) => {
    console.log('React: updateNearbyUsers called with IDs:', userIds);
    // Make sure we have the latest users data
    if (socketRef.current) {
      socketRef.current.emit('get-users');
    }
    
    const nearby = users.filter(user => userIds.includes(user.id));
    console.log('React: Filtered nearby users:', nearby);
    
    // Only update state if the nearby users have actually changed
    setNearbyUsers(prev => {
      const prevIds = new Set(prev.map(u => u.id));
      const newIds = new Set(nearby.map(u => u.id));
      
      // Check if the sets are different
      const hasChanged = 
        prevIds.size !== newIds.size || 
        [...prevIds].some(id => !newIds.has(id)) ||
        [...newIds].some(id => !prevIds.has(id));
      
      if (hasChanged) {
        console.log('React: Updating nearby users state');
        return nearby;
      }
      return prev;
    });
  };
  
  // Send a chat message
  const sendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current) return;
    
    const messageData = {
      text: inputMessage
    };
    
    socketRef.current.emit('message', messageData);
    setInputMessage('');
  };
  
  // Initiate a call to another user
  const startCall = async (userId: string) => {
    if (!localStreamRef.current || !socketRef.current) return;
    
    try {
      // Create new RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      // Add local stream
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          pc.addTrack(track, localStreamRef.current);
        }
      });
      
      // Handle ICE candidates
      pc.onicecandidate = event => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc-candidate', {
            to: userId,
            candidate: event.candidate
          });
        }
      };
      
      // Handle incoming tracks
      pc.ontrack = event => {
        const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
        if (remoteAudio && event.streams[0]) {
          remoteAudio.srcObject = event.streams[0];
        }
      };
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socketRef.current.emit('webrtc-offer', {
        to: userId,
        offer: pc.localDescription
      });
      
      // Store the peer connection
      peerConnectionsRef.current[userId] = pc;
      setCalling(userId);
      
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };
  
  // Answer an incoming call
  const answerCall = async (userId: string) => {
    if (!localStreamRef.current || !socketRef.current || !incomingCall) return;
    
    try {
      // Create new RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      // Add local stream
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          pc.addTrack(track, localStreamRef.current);
        }
      });
      
      // Handle ICE candidates
      pc.onicecandidate = event => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc-candidate', {
            to: userId,
            candidate: event.candidate
          });
        }
      };
      
      // Handle incoming tracks
      pc.ontrack = event => {
        const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
        if (remoteAudio && event.streams[0]) {
          remoteAudio.srcObject = event.streams[0];
        }
      };
      
      // Get the offer from the signaling server
      socketRef.current.once('webrtc-offer-details', async (data: { offer: RTCSessionDescriptionInit }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socketRef.current?.emit('webrtc-answer', {
          to: userId,
          answer: pc.localDescription
        });
      });
      
      // Request offer details
      socketRef.current.emit('webrtc-get-offer', { from: userId });
      
      // Store the peer connection
      peerConnectionsRef.current[userId] = pc;
      setActiveCall(userId);
      setIncomingCall(null);
      
    } catch (error) {
      console.error('Error answering call:', error);
    }
  };
  
  // End an active call
  const endCall = (userId: string) => {
    const pc = peerConnectionsRef.current[userId];
    if (pc) {
      pc.close();
      delete peerConnectionsRef.current[userId];
    }
    
    // Notify the other user
    socketRef.current?.emit('webrtc-hangup', { to: userId });
    
    setActiveCall(null);
    setCalling(null);
    
    // Reset remote audio
    const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
    if (remoteAudio) {
      remoteAudio.srcObject = null;
    }
  };
  
  // Function to manually refresh nearby users
  const refreshNearbyUsers = () => {
    console.log('React: Manual refresh of nearby users requested');
    if (socketRef.current) {
      socketRef.current.emit('get-users');
    }
    // Force the game to check proximity if it exists
    if (gameRef.current) {
      // Try to access the active scene (OfficeScene) and call checkNearbyPlayers
      try {
        const scene = gameRef.current.scene.getScene('OfficeScene');
        if (scene) {
          console.log('React: Forcing game scene to check nearby players');
          // Cast to any to bypass TypeScript type checking
          (scene as any).checkNearbyPlayers();
        }
      } catch (error) {
        console.error('Error forcing proximity check:', error);
      }
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="game-container">
      {/* Game canvas */}
      <div className="game-canvas">
        <div 
          ref={containerRef} 
          id="game-container" 
          className="phaser-container"
        />
      </div>
      
      {/* Chat and call overlay */}
      <div className="overlay-panel">
        <div className="chat-container">
          <h3>Chat</h3>
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                <span className="sender">{msg.sender}: </span>
                <span className="text">{msg.text}</span>
              </div>
            ))}
          </div>
          <div className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="message-input"
            />
            <button onClick={sendMessage} className="send-button">Send</button>
          </div>
        </div>
        
        <div className="nearby-users">
          <div className="nearby-header">
            <h3>Nearby Players ({nearbyUsers.length})</h3>
            <button 
              onClick={refreshNearbyUsers}
              className="refresh-button"
              title="Refresh nearby players"
            >
              ⟳
            </button>
          </div>
          {nearbyUsers.length > 0 ? (
            <ul className="users-list">
              {nearbyUsers.map(user => (
                <li key={user.id} className="user-item">
                  <span className="user-name">{user.name}</span>
                  {!activeCall && !calling && (
                    <button 
                      onClick={() => startCall(user.id)}
                      className="call-button"
                    >
                      Call
                    </button>
                  )}
                  {calling === user.id && (
                    <button 
                      onClick={() => endCall(user.id)}
                      className="end-button"
                    >
                      Cancel
                    </button>
                  )}
                  {activeCall === user.id && (
                    <button 
                      onClick={() => endCall(user.id)}
                      className="end-button"
                    >
                      End
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-users-container">
              <p className="no-users">No players nearby<br/>Move closer to someone!</p>
              <p className="hint">Try moving within the green circle around other players</p>
            </div>
          )}
        </div>
        
        {/* Call controls */}
        {activeCall && (
          <div className="call-controls">
            <p>In call with {users.find(u => u.id === activeCall)?.name || 'Unknown'}</p>
            <button 
              onClick={() => endCall(activeCall)}
              className="end-call-button"
            >
              End Call
            </button>
          </div>
        )}
        
        {/* Incoming call notification */}
        {incomingCall && (
          <div className="incoming-call">
            <p>Incoming call from {users.find(u => u.id === incomingCall)?.name || 'Unknown'}</p>
            <div className="call-buttons">
              <button 
                onClick={() => answerCall(incomingCall)}
                className="answer-button"
              >
                Answer
              </button>
              <button 
                onClick={() => setIncomingCall(null)}
                className="decline-button"
              >
                Decline
              </button>
            </div>
          </div>
        )}
        
        {/* Hidden audio element for remote stream */}
        <audio id="remote-audio" autoPlay />
      </div>
    </div>
  );
};

export default OfficeGame;