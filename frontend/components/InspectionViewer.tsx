"use client";

import React, { useState } from "react";
import { Eye, Sliders, AlertTriangle, Layers, Layers3 } from "lucide-react";

interface AnomalyBox {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  label: string;
}

interface InspectionViewerProps {
  originalImage: string;
  elaHeatmap: string;
  anomalyBoxes: AnomalyBox[];
}

export default function InspectionViewer({ originalImage, elaHeatmap, anomalyBoxes }: InspectionViewerProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100
  const [viewMode, setViewMode] = useState<"split" | "overlay">("split");
  const [heatmapOpacity, setHeatmapOpacity] = useState(80);
  const [hoveredBox, setHoveredBox] = useState<AnomalyBox | null>(null);

  return (
    <div className="w-full cyber-glass rounded-2xl p-6 border border-cyan-500/30 space-y-4">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-base font-bold text-slate-200">
              Interactive ELA Heatmap & Tamper Anomaly Inspector
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Error Level Analysis highlights compression gradient variance. Hot regions indicate spliced content.
          </p>
        </div>

        {/* View mode toggles */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              viewMode === "split"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 cyber-glow-cyan"
                : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Compare Slider</span>
          </button>

          <button
            onClick={() => setViewMode("overlay")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              viewMode === "overlay"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 cyber-glow-cyan"
                : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Heatmap Overlay</span>
          </button>
        </div>
      </div>

      {/* Heatmap opacity control for Overlay mode */}
      {viewMode === "overlay" && (
        <div className="flex items-center space-x-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono text-xs">
          <span className="text-slate-300">HEATMAP OPACITY:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={heatmapOpacity}
            onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
            className="w-48 accent-cyan-400 cursor-pointer"
          />
          <span className="text-cyan-400 font-bold">{heatmapOpacity}%</span>
        </div>
      )}

      {/* Image inspection container */}
      <div className="relative w-full aspect-[4/3] max-h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-cyan-500/30 select-none group">
        
        {viewMode === "split" ? (
          /* Split slider view */
          <div className="relative w-full h-full">
            {/* Background image (ELA Heatmap) */}
            <img src={elaHeatmap} alt="ELA Heatmap" className="absolute inset-0 w-full h-full object-contain" />
            
            {/* Foreground image (Original) clipped by slider */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img src={originalImage} alt="Original Certificate" className="w-full h-full object-contain max-w-none" style={{ width: '100%', height: '100%' }} />
            </div>

            {/* Drag handle line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize cyber-glow-cyan z-30"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg border border-white">
                ↔
              </div>
            </div>

            {/* Slider input control */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize z-40 w-full h-full"
            />
          </div>
        ) : (
          /* Overlay view */
          <div className="relative w-full h-full">
            <img src={originalImage} alt="Original Certificate" className="absolute inset-0 w-full h-full object-contain" />
            <img
              src={elaHeatmap}
              alt="ELA Heatmap Overlay"
              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-200"
              style={{ opacity: heatmapOpacity / 100 }}
            />
          </div>
        )}

        {/* Anomaly Bounding Box SVG Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet">
          {anomalyBoxes.map((box, idx) => {
            const isHighRisk = box.score > 90;
            return (
              <g key={idx} className="pointer-events-auto cursor-pointer" onMouseEnter={() => setHoveredBox(box)} onMouseLeave={() => setHoveredBox(null)}>
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  fill={isHighRisk ? "rgba(255, 0, 85, 0.25)" : "rgba(245, 158, 11, 0.25)"}
                  stroke={isHighRisk ? "#FF0055" : "#F59E0B"}
                  strokeWidth="3"
                  strokeDasharray="6 3"
                  className="animate-pulse"
                />
                <text
                  x={box.x}
                  y={Math.max(box.y - 8, 20)}
                  fill={isHighRisk ? "#FF0055" : "#F59E0B"}
                  fontSize="14"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {box.label} ({box.score})
                </text>
              </g>
            );
          })}
        </svg>

        {/* Labels on corners */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-slate-300 font-mono text-[11px] pointer-events-none z-20">
          {viewMode === "split" ? "LEFT: ORIGINAL | RIGHT: ELA HEATMAP" : "HEATMAP OVERLAY ACTIVE"}
        </div>
      </div>

      {/* Detected Anomaly Details Banner */}
      {anomalyBoxes.length > 0 ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 space-y-2 font-mono text-xs">
          <div className="flex items-center space-x-2 font-bold text-rose-400">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
            <span>DETECTED {anomalyBoxes.length} HIGH-VARIANCE COMPRESSION ANOMALIES:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {anomalyBoxes.map((box, i) => (
              <div key={i} className="p-2 rounded-lg bg-rose-900/40 border border-rose-500/30 flex items-center justify-between">
                <span>• {box.label}</span>
                <span className="font-bold text-rose-300">Score: {box.score}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center space-x-2">
          <Layers3 className="w-4 h-4 text-emerald-400" />
          <span>No compression variance anomalies detected. Uniform digital signature structure.</span>
        </div>
      )}
    </div>
  );
}
