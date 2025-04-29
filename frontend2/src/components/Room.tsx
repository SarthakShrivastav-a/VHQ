import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { VideoPlayer } from './VideoPlayer';

const Room: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peers, setPeers] = useState<{ [key: string]: RTCPeerConnection }>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  const [isJoined, setIsJoined] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3000');
    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = async () => {
    if (!roomId || !userId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }

      socketRef.current?.emit('join-room', { roomId, userId });
      setIsJoined(true);

      socketRef.current?.on('user-joined', handleUserJoined);
      socketRef.current?.on('user-left', handleUserLeft);
      socketRef.current?.on('offer', handleReceiveOffer);
      socketRef.current?.on('answer', handleReceiveAnswer);
      socketRef.current?.on('ice-candidate', handleReceiveIceCandidate);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const handleUserJoined = async ({ userId: remoteUserId }: { userId: string }) => {
    const peerConnection = createPeerConnection(remoteUserId);
    peersRef.current[remoteUserId] = peerConnection;

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socketRef.current?.emit('offer', { offer, roomId, userId: remoteUserId });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleUserLeft = ({ userId: remoteUserId }: { userId: string }) => {
    if (peersRef.current[remoteUserId]) {
      peersRef.current[remoteUserId].close();
      delete peersRef.current[remoteUserId];
      setPeers(peersRef.current);
    }
  };

  const handleReceiveOffer = async ({ offer, userId: remoteUserId }: { offer: RTCSessionDescriptionInit, userId: string }) => {
    const peerConnection = createPeerConnection(remoteUserId);
    peersRef.current[remoteUserId] = peerConnection;

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socketRef.current?.emit('answer', { answer, roomId, userId: remoteUserId });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleReceiveAnswer = async ({ answer, userId: remoteUserId }: { answer: RTCSessionDescriptionInit, userId: string }) => {
    if (peersRef.current[remoteUserId]) {
      try {
        await peersRef.current[remoteUserId].setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleReceiveIceCandidate = async ({ candidate, userId: remoteUserId }: { candidate: RTCIceCandidateInit, userId: string }) => {
    if (peersRef.current[remoteUserId]) {
      try {
        await peersRef.current[remoteUserId].addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    }
  };

  const createPeerConnection = (remoteUserId: string) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    peerConnection.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [remoteUserId]: event.streams[0]
      }));
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', {
          candidate: event.candidate,
          roomId,
          userId: remoteUserId
        });
      }
    };

    return peerConnection;
  };

  if (!isJoined) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 3 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Join Room
          </Typography>
          <TextField
            fullWidth
            label="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            margin="normal"
          />
          <Button
            fullWidth
            variant="contained"
            onClick={joinRoom}
            sx={{ mt: 2 }}
          >
            Join
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <VideoPlayer stream={localStream} isLocal={true} />
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <VideoPlayer key={userId} stream={stream} isLocal={false} />
        ))}
      </Box>
    </Box>
  );
};

export default Room; 