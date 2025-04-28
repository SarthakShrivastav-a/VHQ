import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper
} from '@mui/material';
import VideoCall from '../components/VideoCall';
import webrtcService from '../services/webrtcService';

const CallPage = () => {
  const { userId } = useParams(); // Get the userId from the URL
  const navigate = useNavigate();
  
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerId, setCallerId] = useState(null);
  
  // Set up listeners for incoming calls
  useEffect(() => {
    // This is a simplified example. In a real app, you'd have a signaling server
    // that would notify users of incoming calls
    
    // Mock listener for incoming calls
    const mockIncomingCall = () => {
      // Simulate an incoming call after 3 seconds if not already in a call
      if (!callActive && !incomingCall) {
        const timer = setTimeout(() => {
          // For demo purposes, we'll simulate a call from a random user
          // In a real app, this would come from your signaling server
          const simulatedCallerId = 'user-' + Math.floor(Math.random() * 1000);
          setCallerId(simulatedCallerId);
          setIncomingCall(true);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    };
    
    // Only set up mock incoming call if we're not already calling someone
    if (!userId) {
      mockIncomingCall();
    } else {
      // If we have a userId in the URL, we're initiating the call
      setCallActive(true);
    }
    
    // Clean up on component unmount
    return () => {
      if (callActive) {
        webrtcService.endCall(userId || callerId);
      }
    };
  }, [userId, callActive, incomingCall]);
  
  const handleAcceptCall = () => {
    setCallActive(true);
    setIncomingCall(false);
  };
  
  const handleRejectCall = () => {
    setIncomingCall(false);
    setCallerId(null);
  };
  
  const handleEndCall = () => {
    setCallActive(false);
    navigate('/');
  };
  
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default' 
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">
          Virtual HQ - Video Call
        </Typography>
        
        {!callActive && !incomingCall && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        )}
      </Box>
      
      {/* Main content */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {callActive ? (
          <Box sx={{ width: '100%', height: '100%', maxWidth: '1200px', maxHeight: '800px' }}>
            <VideoCall 
              recipientId={userId || callerId}
              onEndCall={handleEndCall}
            />
          </Box>
        ) : (
          <Paper elevation={3} sx={{ p: 4, maxWidth: '600px', textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              {incomingCall ? 'Incoming Call' : 'No Active Call'}
            </Typography>
            
            {!incomingCall && (
              <Typography variant="body1" sx={{ mb: 3 }}>
                Start a call by navigating to /call/[userId] or wait for an incoming call.
              </Typography>
            )}
            
            {!incomingCall && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate(`/call/demo-user-${Math.floor(Math.random() * 1000)}`)}
              >
                Start Demo Call
              </Button>
            )}
          </Paper>
        )}
      </Box>
      
      {/* Incoming call dialog */}
      <Dialog
        open={incomingCall}
        onClose={handleRejectCall}
      >
        <DialogTitle>Incoming Call</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have an incoming call from {callerId || 'Unknown User'}.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCall} color="error">
            Decline
          </Button>
          <Button onClick={handleAcceptCall} color="primary" variant="contained">
            Accept
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CallPage; 