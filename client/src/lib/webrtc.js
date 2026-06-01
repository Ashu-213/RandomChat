/**
 * WebRTC peer connection factory and helpers.
 *
 * ICE server configuration:
 * - Google STUN servers handle ~85% of connections (both peers on simple NAT)
 * - TURN server required for symmetric NAT / corporate firewalls (~15%)
 */

const getIceServers = () => {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  // Add TURN server if configured
  const turnUrl = import.meta.env.VITE_TURN_URL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME || '',
      credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
    });
  }

  return servers;
};

/**
 * Creates a new RTCPeerConnection with proper configuration.
 */
export const createPeerConnection = () => {
  const pc = new RTCPeerConnection({
    iceServers: getIceServers(),
    iceCandidatePoolSize: 10,
  });
  return pc;
};

/**
 * Adds all tracks from a local MediaStream to the peer connection.
 * MUST be called before createOffer to avoid one-way audio/video.
 */
export const addLocalTracks = (pc, localStream) => {
  if (!localStream) return;
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });
};

/**
 * Creates an SDP offer.
 */
export const createOffer = async (pc) => {
  const offer = await pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  });
  await pc.setLocalDescription(offer);
  return offer;
};

/**
 * Handles an incoming SDP offer and creates an answer.
 */
export const handleOffer = async (pc, sdp) => {
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
};

/**
 * Handles an incoming SDP answer.
 */
export const handleAnswer = async (pc, sdp) => {
  // Guard: only set remote description if we're in the right signaling state
  if (pc.signalingState === 'have-local-offer' || pc.signalingState === 'have-remote-pranswer') {
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  } else {
    console.warn('[WebRTC] Unexpected signaling state for answer:', pc.signalingState);
  }
};

/**
 * Adds a buffered or live ICE candidate.
 */
export const addIceCandidate = async (pc, candidate) => {
  try {
    if (pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (err) {
    // Non-fatal: some candidates are naturally rejected
    console.warn('[WebRTC] Failed to add ICE candidate:', err.message);
  }
};

/**
 * Safely close and cleanup a peer connection.
 */
export const destroyPeerConnection = (pc) => {
  if (!pc) return;
  try {
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.oniceconnectionstatechange = null;
    pc.onconnectionstatechange = null;
    pc.onnegotiationneeded = null;
    pc.getSenders().forEach((sender) => {
      try { pc.removeTrack(sender); } catch (e) { /* already removed */ }
    });
    pc.close();
  } catch (err) {
    console.warn('[WebRTC] Error during cleanup:', err.message);
  }
};
