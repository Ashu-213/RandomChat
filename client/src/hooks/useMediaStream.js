import { useCallback, useRef, useState } from 'react';
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
  const { setLocalStream, setChatState, setError, localStream, isCamOff } = useChatStore();
  const [cameraFacing, setCameraFacing] = useState('user');
  const [canFlipCamera, setCanFlipCamera] = useState(false);
  const [isFlippingCamera, setIsFlippingCamera] = useState(false);
  const devicesRef = useRef([]);

  const refreshVideoInputs = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      devicesRef.current = videoInputs;
      setCanFlipCamera(videoInputs.length > 1);
    } catch (err) {
      console.warn('[Media] enumerateDevices failed:', err);
    }
  }, []);

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
      setCameraFacing('user');
      await refreshVideoInputs();
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
  }, [localStream, setLocalStream, setChatState, setError, refreshVideoInputs]);

  const switchCamera = useCallback(async (replaceOutgoingVideoTrack) => {
    if (!localStream || !navigator.mediaDevices?.getUserMedia || !canFlipCamera || isFlippingCamera) {
      return localStream;
    }

    setIsFlippingCamera(true);
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';

    try {
      const oldVideoTracks = localStream.getVideoTracks();
      const oldVideoTrack = oldVideoTracks[0];

      let replacementVideoTrack = null;

      try {
        const switched = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
            facingMode: { exact: nextFacing },
          },
          audio: false,
        });
        replacementVideoTrack = switched.getVideoTracks()[0];
      } catch {
        await refreshVideoInputs();
        const currentDeviceId = oldVideoTrack?.getSettings?.().deviceId;
        const index = devicesRef.current.findIndex((d) => d.deviceId === currentDeviceId);
        const nextIndex = index >= 0 ? (index + 1) % devicesRef.current.length : 0;
        const nextDevice = devicesRef.current[nextIndex];

        if (!nextDevice) throw new Error('No alternate camera device found');

        const switched = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: nextDevice.deviceId },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });
        replacementVideoTrack = switched.getVideoTracks()[0];
      }

      if (!replacementVideoTrack) throw new Error('Camera switch failed');

      if (isCamOff) {
        replacementVideoTrack.enabled = false;
      }

      if (typeof replaceOutgoingVideoTrack === 'function') {
        await replaceOutgoingVideoTrack(replacementVideoTrack);
      }

      const audioTracks = localStream.getAudioTracks();
      const updatedStream = new MediaStream([...audioTracks, replacementVideoTrack]);

      oldVideoTracks.forEach((track) => track.stop());
      setLocalStream(updatedStream);
      setCameraFacing(nextFacing);
      return updatedStream;
    } catch (err) {
      console.error('[Media] Failed to switch camera:', err);
      setError('Unable to switch camera on this device.');
      return localStream;
    } finally {
      setIsFlippingCamera(false);
    }
  }, [localStream, canFlipCamera, isFlippingCamera, cameraFacing, isCamOff, setLocalStream, setError, refreshVideoInputs]);

  const releaseMedia = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(null);
    }
  }, [localStream, setLocalStream]);

  return {
    acquireMedia,
    releaseMedia,
    switchCamera,
    canFlipCamera,
    isFlippingCamera,
    cameraFacing,
  };
}
