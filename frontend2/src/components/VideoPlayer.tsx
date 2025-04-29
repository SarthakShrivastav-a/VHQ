import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream, isLocal }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Paper
      elevation={3}
      sx={{
        width: 300,
        height: 225,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000'
      }}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}
        >
          {isLocal ? (
            <VideocamOffIcon sx={{ fontSize: 48, mb: 1 }} />
          ) : (
            <VideocamIcon sx={{ fontSize: 48, mb: 1 }} />
          )}
          <Typography variant="body1">
            {isLocal ? 'Local Camera' : 'Remote User'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default VideoPlayer; 