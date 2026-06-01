import { useCallback } from 'react';
import useChatStore from '../store/chatStore';

/**
 * useMediaStream — Handles camera/mic acquisition.
 *
 * Key engineering decisions:
 * - getUserMedia is called ONCE, stream is stored in Zustand.
 * - Avoids re-acquiring on every component re-render.
 * - Properly handles permission denied state.
 * - Stops tracks on release to turn off camera LED.
 * - Mobile constraints: facingMode 'user' for front camera.
 */
export function useMediaStream() {
  const { setLocalStream, setChatState, setError, localStream } = useChatStore();

  const acquireMedia = useCallback(async () => {
    // Don't re-acquire if we already have an active stream
    if (localStream && localStream.active) {
      return localStream;
    }

    setChatState('requesting_media');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user', // Front camera on mobile
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('[Media] getUserMedia failed:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setChatState('permission_denied');
        setError('Camera/microphone permission denied. Please allow access and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setChatState('permission_denied');
        setError('No camera or microphone found. Please connect a device and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setChatState('permission_denied');
        setError('Camera is in use by another application. Please close it and try again.');
      } else {
        setChatState('permission_denied');
        setError('Failed to access camera/microphone. Please check your settings.');
      }

      return null;
    }
  }, [localStream, setLocalStream, setChatState, setError]);

  const releaseMedia = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(null);
    }
  }, [localStream, setLocalStream]);

  return { acquireMedia, releaseMedia };
}
