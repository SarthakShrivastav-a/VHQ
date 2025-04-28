import React, { useState, useEffect, useRef } from 'react';
import webrtcService from '../services/webrtcService';
import { Button, Box, Typography, Avatar, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const CallContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  width: '100%',
  maxWidth: 400,
  margin: '0 auto',
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 100,
  height: 100,
  margin: theme.spacing(2),
}));

const CallControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: theme.spacing(3),
  gap: theme.spacing(2),
}));

const StatusText = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(2, 0),
}));

const IconButton = styled(Button)(({ theme }) => ({
  borderRadius: '50%',
  minWidth: 56,
  width: 56,
  height: 56,
}));

const EndCallButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
  },
}));

/**
 * AudioCall component for handling real-time audio calls
 */
const AudioCall = ({ userId, userName, userAvatar, onEndCall, isIncoming = false }) => {
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);
  const remoteAudioRef = useRef(null);
  const localAudioRef = useRef(null);

  useEffect(() => {
    const handleCallStarted = (calledUserId, stream) => {
      if (calledUserId === userId && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        setCallStatus('connected');
      }
    };

    const handleCallEnded = (endedUserId) => {
      if (endedUserId === userId) {
        handleEndCall();
      }
    };

    webrtcService.onCallStarted = handleCallStarted;
    webrtcService.onCallEnded = handleCallEnded;

    if (!isIncoming) {
      // Initiate call if we're the caller
      startCall();
    } else {
      setCallStatus('incoming');
    }

    return () => {
      // Cleanup on component unmount
      if (webrtcService.isCallActive(userId)) {
        webrtcService.endCall(userId);
      }
    };
  }, [userId, isIncoming]);

  const startCall = async () => {
    try {
      setCallStatus('connecting');
      await webrtcService.startCall(userId);
    } catch (error) {
      console.error("Failed to start call:", error);
      setCallStatus('failed');
    }
  };

  const handleEndCall = () => {
    webrtcService.endCall(userId);
    
    // Stop local audio
    if (localAudioRef.current && localAudioRef.current.srcObject) {
      localAudioRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    
    // Stop remote audio
    if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
      remoteAudioRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    
    if (onEndCall) {
      onEndCall();
    }
  };

  const toggleMute = () => {
    const connection = webrtcService.getActiveConnections().get(userId);
    if (connection && connection.stream) {
      const audioTracks = connection.stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleRemoteAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsRemoteAudioEnabled(!isRemoteAudioEnabled);
    }
  };

  const acceptIncomingCall = () => {
    setCallStatus('connected');
    // The call is already established at this point through the webrtcService
  };

  const rejectIncomingCall = () => {
    handleEndCall();
  };

  return (
    <CallContainer>
      <UserAvatar src={userAvatar} alt={userName}>
        {!userAvatar && userName ? userName.charAt(0).toUpperCase() : null}
      </UserAvatar>
      
      <Typography variant="h6">{userName}</Typography>
      
      <StatusText variant="body1">
        {callStatus === 'connecting' && 'Connecting...'}
        {callStatus === 'connected' && 'Connected'}
        {callStatus === 'incoming' && 'Incoming call...'}
        {callStatus === 'failed' && 'Call failed'}
      </StatusText>
      
      {callStatus === 'connecting' && <CircularProgress size={24} />}

      {callStatus === 'incoming' && (
        <CallControls>
          <EndCallButton 
            variant="contained"
            onClick={rejectIncomingCall}
          >
            <CallEndIcon />
          </EndCallButton>
          <Button 
            variant="contained" 
            color="primary"
            onClick={acceptIncomingCall}
          >
            Answer
          </Button>
        </CallControls>
      )}

      {(callStatus === 'connected' || callStatus === 'connecting') && (
        <CallControls>
          <IconButton 
            variant="contained" 
            color="primary"
            onClick={toggleMute}
          >
            {isMuted ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
          
          <EndCallButton 
            variant="contained"
            onClick={handleEndCall}
          >
            <CallEndIcon />
          </EndCallButton>
          
          <IconButton 
            variant="contained" 
            color="primary"
            onClick={toggleRemoteAudio}
          >
            {isRemoteAudioEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </CallControls>
      )}

      {/* Hidden audio elements for streams */}
      <audio ref={remoteAudioRef} autoPlay />
      <audio ref={localAudioRef} muted />
    </CallContainer>
  );
};

export default AudioCall; 