/**
 * WebRTC Service for handling peer-to-peer connections
 * This is a simplified version and would need to be integrated with a signaling server in production
 */

class WebRTCService {
  constructor() {
    this.peerConnections = {};
    this.localStream = null;
    this.onCallStarted = null;
    this.onCallEnded = null;
    this.onIncomingCall = null;
    
    // Configuration for STUN/TURN servers
    this.peerConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
        // Add TURN servers for production use
      ]
    };
  }

  /**
   * Set the local media stream to be used in calls
   * @param {MediaStream} stream - The local media stream
   */
  setLocalStream(stream) {
    this.localStream = stream;
  }

  /**
   * Initialize a peer connection for a specific user
   * @param {string} userId - The ID of the user to connect with
   * @returns {RTCPeerConnection} - The created peer connection
   */
  initPeerConnection(userId) {
    if (this.peerConnections[userId]) {
      return this.peerConnections[userId];
    }

    const peerConnection = new RTCPeerConnection(this.peerConfig);
    this.peerConnections[userId] = peerConnection;

    // Add local tracks to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle incoming tracks (remote stream)
    peerConnection.ontrack = (event) => {
      // Notify caller about the remote stream
      if (this.onCallStarted && event.streams && event.streams[0]) {
        this.onCallStarted(userId, event.streams[0]);
      }
    };

    // Handle connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'disconnected' || 
          peerConnection.iceConnectionState === 'failed' ||
          peerConnection.iceConnectionState === 'closed') {
        // Clean up if the connection is lost
        this.endCall(userId);
      }
    };

    return peerConnection;
  }

  /**
   * Start a call with a specific user
   * @param {string} userId - The ID of the user to call
   * @returns {Promise<void>}
   */
  async startCall(userId) {
    // In a real application, this would involve signaling to the remote peer
    // For this example, we'll simulate accepting the call automatically
    
    try {
      const peerConnection = this.initPeerConnection(userId);
      
      // Create and set the local description (offer)
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.setLocalDescription(offer);
      
      // In a real app, the offer would be sent to the remote peer through a signaling server
      // Here we're simulating the remote peer receiving and accepting the offer
      setTimeout(() => {
        this.simulateAnswerFromRemotePeer(userId, offer);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error starting call:', error);
      this.endCall(userId);
      throw error;
    }
  }

  /**
   * Simulate receiving an answer from the remote peer
   * In a real app, this would be handled by the signaling server
   * @param {string} userId - The ID of the remote user
   * @param {RTCSessionDescription} offer - The offer sent by the local peer
   */
  async simulateAnswerFromRemotePeer(userId, offer) {
    try {
      const peerConnection = this.initPeerConnection(userId);
      
      // Simulate setting the remote description (as if received from a signaling server)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create and set the local description (answer)
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Simulate setting the remote description on the original peer
      await this.peerConnections[userId].setRemoteDescription(new RTCSessionDescription(answer));
      
      // Simulate an established connection after a short delay
      setTimeout(() => {
        // Create a mock remote stream for demo purposes
        const mockRemoteStream = new MediaStream();
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            mockRemoteStream.addTrack(track.clone());
          });
        }
        
        if (this.onCallStarted) {
          this.onCallStarted(userId, mockRemoteStream);
        }
      }, 500);
    } catch (error) {
      console.error('Error handling remote answer:', error);
      this.endCall(userId);
    }
  }

  /**
   * End a call with a specific user
   * @param {string} userId - The ID of the user to end the call with
   */
  endCall(userId) {
    if (this.peerConnections[userId]) {
      this.peerConnections[userId].close();
      delete this.peerConnections[userId];
      
      if (this.onCallEnded) {
        this.onCallEnded(userId);
      }
    }
  }

  /**
   * Check if a call is active with a specific user
   * @param {string} userId - The ID of the user to check
   * @returns {boolean} - Whether the call is active
   */
  isCallActive(userId) {
    return !!this.peerConnections[userId];
  }
}

// Create a singleton instance
const webrtcService = new WebRTCService();
export default webrtcService; 