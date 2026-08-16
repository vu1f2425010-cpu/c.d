"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Camera, FileCheck, X, RefreshCw } from "lucide-react";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  isScanning: boolean;
}

export default function Dropzone({ onFileSelect, selectedFile, onClearFile, isScanning }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const startWebcam = async () => {
    try {
      setIsWebcamOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Unable to access webcam: " + err);
      setIsWebcamOpen(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
    }
    setIsWebcamOpen(false);
  };

  const captureWebcamPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "camera_credential_scan.png", { type: "image/png" });
            onFileSelect(capturedFile);
            stopWebcam();
          }
        }, "image/png");
      }
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/png, image/jpeg, image/webp, image/tiff"
        className="hidden"
      />

      {/* Main Upload Dropzone area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !isScanning && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? "border-cyan-400 bg-cyan-950/40 cyber-glow-cyan"
            : selectedFile
            ? "border-emerald-500/60 bg-emerald-950/20"
            : "border-cyan-500/30 hover:border-cyan-400/70 bg-slate-900/60 hover:bg-slate-900/90"
        }`}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 cyber-glow-emerald">
              <FileCheck className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-emerald-300 font-mono">{selectedFile.name}</p>
              <p className="text-xs text-slate-400 font-mono">
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready for Multi-Layer Forensic Audit
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFile();
                }}
                disabled={isScanning}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-mono transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 cyber-glow-cyan">
              <UploadCloud className="w-12 h-12 text-cyan-400 animate-bounce" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-200">
                Drag & Drop Certificate Image or <span className="text-cyan-400 underline">Browse File</span>
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Supports PNG, JPG, WEBP • Auto Deskew & CLAHE Contrast Enhancement
              </p>
            </div>

            {/* Camera trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startWebcam();
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition-all cyber-glow-cyan"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Scan via WebCam</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Webcam Modal */}
      {isWebcamOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cyber-glass rounded-2xl p-6 max-w-xl w-full border border-cyan-500/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <span className="font-mono text-sm font-bold text-slate-200">Live Camera Scan Capture</span>
              </div>
              <button onClick={stopWebcam} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black border border-cyan-500/30 aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-cyan-400/40 pointer-events-none rounded-xl"></div>
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-400/50"></div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={stopWebcam}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={captureWebcamPhoto}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs font-mono cyber-glow-cyan"
              >
                Capture Frame & Inspect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
