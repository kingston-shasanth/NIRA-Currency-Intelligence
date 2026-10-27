import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'streaming'
  | 'stopped'
  | 'insecure_context'
  | 'permission_denied'
  | 'not_found'
  | 'unsupported'
  | 'error';

export interface UseCameraReturn {
  status: CameraStatus;
  isActive: boolean;
  errorMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  setVideoRef: (el: HTMLVideoElement | null) => void;
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  captureFrame: () => { blob: Blob; dataUrl: string; width: number; height: number } | null;
  isSecure: boolean;
  isInsecureLanHttp: boolean;
  stream: MediaStream | null;
  hasTorch: boolean;
  isTorchOn: boolean;
  toggleTorch: () => Promise<boolean>;
}

export function useCamera(): UseCameraReturn {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Check secure context requirements
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]');

  const isSecure = typeof window !== 'undefined' && (Boolean(window.isSecureContext) || isLocalhost);
  const isInsecureLanHttp = !isSecure && !isLocalhost;

  // Stop all camera tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    setStatus('stopped');
  }, []);

  // Attach stream to video element safely
  const attachStreamToVideo = useCallback((video: HTMLVideoElement, stream: MediaStream) => {
    try {
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
      video.play().catch((err) => {
        console.warn('Video auto-playback deferred:', err);
      });
    } catch (err) {
      console.warn('Failed to attach stream to video element:', err);
    }
  }, []);

  // Callback ref handler to fix the black screen bug when element mounts
  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoElementRef.current = el;
      if (el && streamRef.current) {
        attachStreamToVideo(el, streamRef.current);
      }
    },
    [attachStreamToVideo]
  );

  // Start live camera stream
  const startCamera = useCallback(async (): Promise<boolean> => {
    setErrorMessage(null);

    // Modern browsers strictly disable getUserMedia on non-localhost HTTP
    if (isInsecureLanHttp) {
      const msg =
        'Live camera streaming requires an HTTPS connection or localhost. Mobile browsers disable live camera over local Wi-Fi HTTP for security. Please use the "Snap Rear Camera" button below, which uses native mobile capture.';
      setStatus('insecure_context');
      setErrorMessage(msg);
      return false;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      const msg = 'Camera streaming is not supported in this browser. Please use the camera capture button below.';
      setStatus('unsupported');
      setErrorMessage(msg);
      return false;
    }

    setStatus('requesting');

    try {
      // First attempt: Prefer rear camera (environment) with HD resolution
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
        });
      } catch {
        // Fallback: any available video device
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      streamRef.current = stream;
      setStatus('streaming');

      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          setHasTorch(Boolean(caps.torch));
        } catch {
          setHasTorch(false);
        }
      }

      if (videoElementRef.current) {
        attachStreamToVideo(videoElementRef.current, stream);
      }

      return true;
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let errorMsg = 'Could not access camera.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus('permission_denied');
        errorMsg = 'Camera permission was denied. Please allow camera access in browser permissions.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setStatus('not_found');
        errorMsg = 'No camera device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setStatus('error');
        errorMsg = 'Camera is currently in use by another application.';
      } else {
        setStatus('error');
        errorMsg = err.message || 'Camera initialization failed.';
      }

      setErrorMessage(errorMsg);
      return false;
    }
  }, [isInsecureLanHttp, attachStreamToVideo]);

  // Toggle hardware torch / flashlight if supported
  const toggleTorch = useCallback(async (): Promise<boolean> => {
    if (!streamRef.current) return false;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return false;
    try {
      const nextTorch = !isTorchOn;
      await (track.applyConstraints as any)({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
      return nextTorch;
    } catch (err) {
      console.warn('Torch constraint error:', err);
      return false;
    }
  }, [isTorchOn]);

  // Capture current video frame to JPEG Blob
  const captureFrame = useCallback((): {
    blob: Blob;
    dataUrl: string;
    width: number;
    height: number;
  } | null => {
    const video = videoElementRef.current;
    if (!video || !streamRef.current || video.readyState < 2) {
      return null;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Convert data URL to binary Blob synchronously
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/jpeg' });

    return { blob, dataUrl, width, height };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return useMemo(
    () => ({
      status,
      isActive: status === 'streaming',
      errorMessage,
      videoRef: videoElementRef,
      setVideoRef,
      startCamera,
      stopCamera,
      captureFrame,
      isSecure,
      isInsecureLanHttp,
      stream: streamRef.current,
      hasTorch,
      isTorchOn,
      toggleTorch,
    }),
    [
      status,
      errorMessage,
      setVideoRef,
      startCamera,
      stopCamera,
      captureFrame,
      isSecure,
      isInsecureLanHttp,
      hasTorch,
      isTorchOn,
      toggleTorch,
    ]
  );
}
