import { useRef, useCallback, useEffect } from 'react';
import {
  createPeerConnection,
  addLocalTracks,
  createOffer,
  handleOffer as handleOfferUtil,
  handleAnswer as handleAnswerUtil,
  addIceCandidate,
  destroyPeerConnection,
} from '../lib/webrtc';
import useChatStore from '../store/chatStore';

/**
 * useWebRTC — Full WebRTC lifecycle management.
 *
 * This hook orchestrates:
 * 1. PeerConnection creation and teardown
 * 2. Offer/Answer exchange via Socket.IO
 * 3. ICE candidate buffering and relay
 * 4. Remote stream attachment
 * 5. Connection state monitoring
 * 6. Safe cleanup on skip/disconnect
 *
 * ICE Candidate Buffering:
 * - Candidates can arrive BEFORE setRemoteDescription completes.
 * - We buffer them and flush after the remote description is set.
 * - This prevents the "Failed to add ICE candidate" race condition.
 *
 * @param {Function} getSocket - returns the Socket.IO client instance
 */
export function useWebRTC(getSocket) {
  const pcRef = useRef(null);
  const iceCandidateBuffer = useRef([]);
  const peerIdRef = useRef(null);
  const isInitiatorRef = useRef(false);

  const {
    localStream,
    setRemoteStream,
    setChatState,
    setPartnerId,
  } = useChatStore();

  /**
   * Flush buffered ICE candidates after remote description is set.
   */
  const flushIceCandidates = useCallback(() => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;

    while (iceCandidateBuffer.current.length > 0) {
      const candidate = iceCandidateBuffer.current.shift();
      addIceCandidate(pc, candidate);
    }
  }, []);

  /**
   * Destroy current peer connection and clean up state.
   * Called on skip, partner disconnect, or component unmount.
   */
  const destroy = useCallback(() => {
    destroyPeerConnection(pcRef.current);
    pcRef.current = null;
    peerIdRef.current = null;
    isInitiatorRef.current = false;
    iceCandidateBuffer.current = [];
    setRemoteStream(null);
    setPartnerId(null);
  }, [setRemoteStream, setPartnerId]);

  /**
   * Initialize a new peer connection for a match.
   *
   * @param {string} peerId - partner's socket ID
   * @param {boolean} initiator - whether this client sends the offer
   */
  const startConnection = useCallback(
    async (peerId, initiator) => {
      const socket = getSocket();
      if (!socket) {
        console.error('[WebRTC] No socket available');
        return;
      }

      // Clean up any existing connection first
      destroy();

      setChatState('connecting');
      peerIdRef.current = peerId;
      isInitiatorRef.current = initiator;

      // Create new peer connection
      const pc = createPeerConnection();
      pcRef.current = pc;

      // Add local tracks BEFORE creating offer (prevents one-way audio/video)
      if (localStream) {
        addLocalTracks(pc, localStream);
      }

      // ── Handle remote tracks ──
      pc.ontrack = (event) => {
        console.log('[WebRTC] Remote track received:', event.track.kind);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setChatState('connected');
          setPartnerId(peerId);
        }
      };

      // ── Handle ICE candidates ──
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            to: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // ── Monitor connection state ──
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log('[WebRTC] Connection state:', state);

        switch (state) {
          case 'connected':
            setChatState('connected');
            break;
          case 'disconnected':
          case 'failed':
            console.warn('[WebRTC] Connection failed/disconnected');
            // Don't auto-requeue here — partner_left event handles that
            break;
          case 'closed':
            break;
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          // Attempt ICE restart
          if (initiator && pc.signalingState !== 'closed') {
            console.log('[WebRTC] Attempting ICE restart...');
            pc.restartIce();
          }
        }
      };

      // ── If initiator, create and send offer ──
      if (initiator) {
        try {
          const offer = await createOffer(pc);
          socket.emit('offer', { to: peerId, sdp: offer });
          console.log('[WebRTC] Offer sent to:', peerId);
        } catch (err) {
          console.error('[WebRTC] Failed to create offer:', err);
        }
      }
    },
    [localStream, getSocket, destroy, setChatState, setRemoteStream, setPartnerId],
  );

  /**
   * Handle incoming offer (for responder).
   */
  const onOffer = useCallback(
    async ({ from, sdp }) => {
      const pc = pcRef.current;
      if (!pc) {
        console.warn('[WebRTC] No peer connection for offer');
        return;
      }

      try {
        const answer = await handleOfferUtil(pc, sdp);
        const socket = getSocket();
        if (socket) {
          socket.emit('answer', { to: from, sdp: answer });
          console.log('[WebRTC] Answer sent to:', from);
        }
        // Flush any buffered ICE candidates now that remote desc is set
        flushIceCandidates();
      } catch (err) {
        console.error('[WebRTC] Failed to handle offer:', err);
      }
    },
    [getSocket, flushIceCandidates],
  );

  /**
   * Handle incoming answer (for initiator).
   */
  const onAnswer = useCallback(
    async ({ from, sdp }) => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        await handleAnswerUtil(pc, sdp);
        console.log('[WebRTC] Remote answer set from:', from);
        // Flush any buffered ICE candidates
        flushIceCandidates();
      } catch (err) {
        console.error('[WebRTC] Failed to handle answer:', err);
      }
    },
    [flushIceCandidates],
  );

  /**
   * Handle incoming ICE candidate.
   */
  const onIceCandidate = useCallback(
    async ({ from, candidate }) => {
      const pc = pcRef.current;
      if (!pc) return;

      // Buffer if remote description not yet set
      if (!pc.remoteDescription) {
        iceCandidateBuffer.current.push(candidate);
        return;
      }

      await addIceCandidate(pc, candidate);
    },
    [],
  );

  /**
   * Replace the outgoing video track without rebuilding the PeerConnection.
   * Used for mobile camera flipping (front/rear) during an active session.
   */
  const replaceOutgoingVideoTrack = useCallback(async (track) => {
    const pc = pcRef.current;
    if (!pc || !track) return;

    const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
    if (!sender) return;

    try {
      await sender.replaceTrack(track);
    } catch (err) {
      console.error('[WebRTC] Failed to replace outgoing video track:', err);
    }
  }, []);

  /**
   * Register socket event listeners.
   * These are registered once and cleaned up on unmount.
   */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice_candidate', onIceCandidate);

    return () => {
      socket.off('offer', onOffer);
      socket.off('answer', onAnswer);
      socket.off('ice_candidate', onIceCandidate);
    };
  }, [getSocket, onOffer, onAnswer, onIceCandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return {
    startConnection,
    destroy,
    replaceOutgoingVideoTrack,
    pcRef,
  };
}
