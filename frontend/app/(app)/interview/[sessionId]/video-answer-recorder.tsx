"use client";

import { AlertCircle, Circle, RotateCcw, Square, Video as VideoIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/locale-provider";

/**
 * Video Interview's recorded-answer capture. Every signal sent to the
 * backend is genuinely computed here, not simulated:
 * - Audio: the actual MediaRecorder-captured track (transcribed server-side
 *   by real Groq Whisper — see careeros_ai/capabilities/transcription.py).
 * - avgVolumeLevel: real-time RMS amplitude of the raw audio waveform
 *   (Web Audio API AnalyserNode), sampled throughout the recording.
 * - movementLevel: real-time mean pixel difference between consecutive
 *   downsampled video frames (canvas frame-differencing), sampled
 *   throughout the recording.
 *
 * Deliberately NOT implemented: eye-contact or facial-expression
 * detection — that would require a real face-landmark model this stack
 * doesn't have. `movementLevel` is a plain, honest "how much motion" signal,
 * not a proxy for attention or engagement.
 */
export function VideoAnswerRecorder({
  onSubmit,
  submitting,
}: {
  onSubmit: (audio: Blob, avgVolumeLevel: number, movementLevel: number) => void | Promise<void>;
  submitting: boolean;
}) {
  const { t } = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sampleIntervalRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const volumeSamplesRef = useRef<number[]>([]);
  const movementSamplesRef = useRef<number[]>([]);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const recordedUrlRef = useRef<string | null>(null);

  const [permission, setPermission] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
      clearIntervals();
      audioContextRef.current?.close();
      if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current);
    };
  }, []);

  function clearIntervals() {
    if (sampleIntervalRef.current !== null) window.clearInterval(sampleIntervalRef.current);
    if (timerIntervalRef.current !== null) window.clearInterval(timerIntervalRef.current);
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function requestPermission() {
    setError(null);
    setPermission("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setPermission("granted");
    } catch {
      setPermission("denied");
      setError(t("interview.video.permissionDenied"));
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    chunksRef.current = [];
    volumeSamplesRef.current = [];
    movementSamplesRef.current = [];
    prevFrameRef.current = null;
    if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setElapsedSeconds(0);
    setError(null);

    const mimeType = ["video/webm;codecs=vp8,opus", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType ?? "video/webm" });
      const url = URL.createObjectURL(blob);
      recordedUrlRef.current = url;
      setRecordedBlob(blob);
      setRecordedUrl(url);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);

    const AudioContextCtor = window.AudioContext;
    const audioContext = new AudioContextCtor();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    audioContextRef.current = audioContext;

    const timeDomainData = new Uint8Array(analyser.fftSize);
    const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true }) ?? null;
    const sampleSize = 24; // deliberately tiny — cheap frame-differencing, not image analysis

    sampleIntervalRef.current = window.setInterval(() => {
      analyser.getByteTimeDomainData(timeDomainData);
      let sumSquares = 0;
      for (let i = 0; i < timeDomainData.length; i++) {
        const normalized = (timeDomainData[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / timeDomainData.length);
      volumeSamplesRef.current.push(Math.min(1, rms * 4));

      if (ctx && videoRef.current && videoRef.current.videoWidth > 0) {
        ctx.drawImage(videoRef.current, 0, 0, sampleSize, sampleSize);
        const frame = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        if (prevFrameRef.current) {
          let diff = 0;
          for (let i = 0; i < frame.length; i += 4) {
            diff += Math.abs(frame[i] - prevFrameRef.current[i]);
          }
          movementSamplesRef.current.push(Math.min(1, (diff / (frame.length / 4) / 255) * 6));
        }
        prevFrameRef.current = new Uint8ClampedArray(frame);
      }
    }, 200);

    timerIntervalRef.current = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
    clearIntervals();
    audioContextRef.current?.close();
    audioContextRef.current = null;
  }

  function average(values: number[]): number {
    return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
  }

  async function handleSubmit() {
    if (!recordedBlob) return;
    await onSubmit(recordedBlob, average(volumeSamplesRef.current), average(movementSamplesRef.current));
  }

  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error}</p>
        </div>
      )}

      {permission !== "granted" ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-subtle bg-surface py-10 text-center">
          <VideoIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="max-w-xs text-small text-muted-foreground">{t("interview.video.permissionPrompt")}</p>
          <Button onClick={requestPermission} isLoading={permission === "requesting"}>
            {t("interview.video.enableCamera")}
          </Button>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-black">
            {recordedUrl ? (
              <video src={recordedUrl} controls className="aspect-video w-full" />
            ) : (
              <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full -scale-x-100" />
            )}
            {recording && (
              <div className="absolute end-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-caption text-white">
                <Circle className="h-2.5 w-2.5 animate-pulse fill-destructive text-destructive" aria-hidden="true" />
                {minutes}:{seconds}
              </div>
            )}
          </div>
          <canvas ref={canvasRef} width={24} height={24} className="hidden" aria-hidden="true" />

          <div className="flex flex-wrap gap-2">
            {!recording && !recordedBlob && (
              <Button onClick={startRecording}>
                <Circle className="h-4 w-4 fill-current" aria-hidden="true" />
                {t("interview.video.startRecording")}
              </Button>
            )}
            {recording && (
              <Button variant="outline" onClick={stopRecording}>
                <Square className="h-4 w-4" aria-hidden="true" />
                {t("interview.video.stopRecording")}
              </Button>
            )}
            {recordedBlob && !recording && (
              <>
                <Button onClick={handleSubmit} isLoading={submitting}>
                  {t("interview.video.submitRecording")}
                </Button>
                <Button variant="outline" onClick={startRecording} disabled={submitting}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {t("interview.video.reRecord")}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
