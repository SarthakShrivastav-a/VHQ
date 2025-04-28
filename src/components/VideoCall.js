import React, { useState, useEffect, useRef } from 'react';
import { styled } from '@mui/material/styles';
import { 
  Typography, 
  IconButton as MuiIconButton, 
  CircularProgress
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import webrtcService from '../services/webrtcService';

// Styled components
const CallContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const VideoGrid = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  position: 'relative',
});

const VideoWrapper = styled('div')(({ isLocal }) => ({
  position: isLocal ? 'absolute' : 'relative',
  width: isLocal ? '30%' : '100%',
  height: isLocal ? '30%' : '100%',
  right: isLocal ? '16px' : 'auto',
  bottom: isLocal ? '16px' : 'auto',
  zIndex: isLocal ? 2 : 1,
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#000',
  boxShadow: isLocal ? '0 4px 8px rgba(0, 0, 0, 0.3)' : 'none',
}));

const Video = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transform: 'scaleX(-1)', // Mirror video for selfie view
});

const Controls = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  padding: '12px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 3,
});

const StatusOverlay = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  zIndex: 4,
  color: '#fff',
});

const IconButton = styled(MuiIconButton)(({ theme }) => ({
  margin: '0 8px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  color: '#fff',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
}));

const EndCallButton = styled(IconButton)({
  backgroundColor: '#f44336',
  '&:hover': {
    backgroundColor: '#d32f2f',
  },
});

/**
 * VideoCall component for handling real-time video calls
 */
const VideoCall = ({ recipientId, onEndCall }) => {
  const [status, setStatus] = useState('idle'); // idle, connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize media stream on component mount
  useEffect(() => {
    const getLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Set the local stream in the WebRTC service
        webrtcService.setLocalStream(stream);
        
        // Set up call event listeners
        webrtcService.onCallStarted = (userId, stream) => {
          setRemoteStream(stream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          setStatus('connected');
        };
        
        webrtcService.onCallEnded = () => {
          setStatus('ended');
          setTimeout(() => {
            if (onEndCall) onEndCall();
          }, 2000);
        };
        
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setStatus('error');
      }
    };

    getLocalMedia();

    // Clean up when component unmounts
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      webrtcService.endCall(recipientId);
    };
  }, [recipientId, onEndCall]);

  // Auto-start call when recipientId is available and local stream is ready
  useEffect(() => {
    if (recipientId && localStream && status === 'idle') {
      startCall();
    }
  }, [recipientId, localStream, status]);

  // Update remote video when remote stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const startCall = async () => {
    try {
      setStatus('connecting');
      await webrtcService.startCall(recipientId);
      // Status will be updated to 'connected' by the onCallStarted callback
    } catch (error) {
      console.error('Failed to start call:', error);
      setStatus('error');
    }
  };

  const endCall = () => {
    webrtcService.endCall(recipientId);
    setStatus('ended');
    
    if (onEndCall) {
      setTimeout(onEndCall, 1000);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Effect to listen for fullscreen changes from browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <CallContainer ref={containerRef}>
      {status === 'connecting' && (
        <StatusOverlay>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Connecting...
          </Typography>
        </StatusOverlay>
      )}

      {status === 'ended' && (
        <StatusOverlay>
          <Typography variant="h6">
            Call Ended
          </Typography>
        </StatusOverlay>
      )}

      {status === 'error' && (
        <StatusOverlay>
          <Typography variant="h6" color="error">
            Error connecting
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please check your camera and microphone permissions
          </Typography>
        </StatusOverlay>
      )}

      <VideoGrid>
        {/* Remote video (main) */}
        <VideoWrapper>
          <Video
            ref={remoteVideoRef}
            autoPlay
            playsInline
          />
        </VideoWrapper>

        {/* Local video (picture-in-picture) */}
        {localStream && (
          <VideoWrapper isLocal>
            <Video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted // Always mute local video to prevent feedback
            />
          </VideoWrapper>
        )}
      </VideoGrid>

      <Controls>
        <IconButton onClick={toggleMute}>
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
        <EndCallButton onClick={endCall}>
          <CallEndIcon />
        </EndCallButton>
        <IconButton onClick={toggleVideo}>
          {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
        <IconButton onClick={toggleFullscreen}>
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </Controls>
    </CallContainer>
  );
};

export default VideoCall; 