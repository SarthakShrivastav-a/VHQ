/**
 * WebRTC utility functions for handling peer connections
 */

// Configuration for WebRTC connections
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

/**
 * Creates a new RTCPeerConnection with the specified configuration
 * @returns {RTCPeerConnection} The new peer connection
 */
export const createPeerConnection = () => {
  return new RTCPeerConnection(rtcConfig);
};

/**
 * Creates an offer for a WebRTC connection
 * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection to create an offer for
 * @returns {Promise<RTCSessionDescriptionInit>} The created offer
 */
export const createOffer = async (peerConnection) => {
  try {
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    });
    await peerConnection.setLocalDescription(offer);
    return offer;
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
};

/**
 * Creates an answer for a WebRTC connection
 * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection to create an answer for
 * @param {RTCSessionDescriptionInit} offer - The received offer
 * @returns {Promise<RTCSessionDescriptionInit>} The created answer
 */
export const createAnswer = async (peerConnection, offer) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  } catch (error) {
    console.error('Error creating answer:', error);
    throw error;
  }
};

/**
 * Adds an ICE candidate to a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection to add the candidate to
 * @param {RTCIceCandidateInit} candidate - The ICE candidate to add
 */
export const addIceCandidate = async (peerConnection, candidate) => {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
  }
};

/**
 * Sets up event listeners for a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection to set up
 * @param {Object} handlers - Object containing event handlers
 * @param {Function} handlers.onIceCandidate - Handler for ICE candidate events
 * @param {Function} handlers.onTrack - Handler for track events
 * @param {Function} handlers.onConnectionStateChange - Handler for connection state changes
 */
export const setupPeerConnectionListeners = (peerConnection, handlers) => {
  const { onIceCandidate, onTrack, onConnectionStateChange } = handlers;

  if (onIceCandidate) {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };
  }

  if (onTrack) {
    peerConnection.ontrack = (event) => {
      onTrack(event.streams[0]);
    };
  }

  if (onConnectionStateChange) {
    peerConnection.onconnectionstatechange = () => {
      onConnectionStateChange(peerConnection.connectionState);
    };
  }
};

/**
 * Adds a local audio stream to a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection to add the stream to
 * @returns {Promise<MediaStream>} The local audio stream
 */
export const addLocalAudioStream = async (peerConnection) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: false 
    });
    
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });
    
    return stream;
  } catch (error) {
    console.error('Error getting local audio stream:', error);
    throw error;
  }
};

/**
 * Handles an incoming WebRTC offer
 * @param {RTCPeerConnection} peerConnection - The peer connection to handle the offer with
 * @param {RTCSessionDescriptionInit} offer - The received offer
 * @returns {Promise<RTCSessionDescriptionInit>} The created answer
 */
export const handleOffer = async (peerConnection, offer) => {
  try {
    await addLocalAudioStream(peerConnection);
    return await createAnswer(peerConnection, offer);
  } catch (error) {
    console.error('Error handling offer:', error);
    throw error;
  }
};

/**
 * Initiates a call to another user
 * @param {RTCPeerConnection} peerConnection - The peer connection to initiate the call with
 * @returns {Promise<{peerConnection: RTCPeerConnection, stream: MediaStream, offer: RTCSessionDescriptionInit}>}
 */
export const initiateCall = async (peerConnection) => {
  try {
    const stream = await addLocalAudioStream(peerConnection);
    const offer = await createOffer(peerConnection);
    return { peerConnection, stream, offer };
  } catch (error) {
    console.error('Error initiating call:', error);
    throw error;
  }
};

/**
 * Terminates a WebRTC connection
 * @param {RTCPeerConnection} peerConnection - The peer connection to terminate
 * @param {MediaStream} localStream - The local media stream to stop
 */
export const terminateCall = (peerConnection, localStream) => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  if (peerConnection) {
    peerConnection.close();
  }
}; 