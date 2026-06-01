import { create } from 'zustand';

/**
 * Central state store for the chat session.
 *
 * Design decisions:
 * - Zustand over Context: prevents re-renders on unrelated state changes.
 * - Flat structure: no nested objects means shallow equality checks work.
 * - MediaStreams stored as refs (not serializable, but Zustand handles it fine).
 *
 * State machine:
 *   idle → requesting_media → searching → connecting → connected
 *                ↓
 *         permission_denied (terminal)
 *
 * On "skip": connected → searching (loop back)
 */
const useChatStore = create((set, get) => ({
  // ── Chat state machine ──
  chatState: 'idle', // idle | requesting_media | searching | connecting | connected | permission_denied
  setChatState: (state) => set({ chatState: state }),

  // ── Media streams ──
  localStream: null,
  remoteStream: null,
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),

  // ── Media controls ──
  isMuted: false,
  isCamOff: false,

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // toggle: if muted, enable; if not, disable
      });
    }
    set({ isMuted: !isMuted });
  },

  toggleCamera: () => {
    const { localStream, isCamOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isCamOff; // toggle
      });
    }
    set({ isCamOff: !isCamOff });
  },

  // ── Partner info ──
  partnerId: null,
  setPartnerId: (id) => set({ partnerId: id }),

  // ── Socket connection status ──
  isSocketConnected: false,
  setSocketConnected: (val) => set({ isSocketConnected: val }),

  // ── Error state ──
  error: null,
  setError: (err) => set({ error: err }),
  clearError: () => set({ error: null }),

  // ── Reset to initial state ──
  reset: () => {
    const { localStream } = get();
    // Stop all local tracks to release camera
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    set({
      chatState: 'idle',
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isCamOff: false,
      partnerId: null,
      error: null,
    });
  },
}));

export default useChatStore;
