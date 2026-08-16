"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Scale,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
  Compass,
  Maximize2,
  FileCheck,
  UploadCloud,
  ChevronRight
} from "lucide-react";

export default function DualCrossVerifier() {
  const [realFile, setRealFile] = useState<File | null>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [realPreview, setRealPreview] = useState<string | null>(null);
  const [testPreview, setTestPreview] = useState<string | null>(null);
  const [realSampleKey, setRealSampleKey] = useState<string | null>(null);
  const [testSampleKey, setTestSampleKey] = useState<string | null>(null);

  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeVisualTab, setActiveVisualTab] = useState<"circled" | "heatmap" | "keypoints">("circled");

  const handleRealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRealFile(file);
      setRealSampleKey(null);
      setRealPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleTestUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTestFile(file);
      setTestSampleKey(null);
      setTestPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleLoadPreset = (realKey: string, testKey: string) => {
    setRealFile(null);
    setTestFile(null);
    setRealSampleKey(realKey);
    setTestSampleKey(testKey);
    setRealPreview(`http://127.0.0.1:8000/api/sample_image/${realKey}.png`);
    setTestPreview(`http://127.0.0.1:8000/api/sample_image/${testKey}.png`);
    setResult(null);
    runCrossVerification(null, null, realKey, testKey);
  };

  const runCrossVerification = async (
    rFile: File | null = realFile,
    tFile: File | null = testFile,
    rKey: string | null = realSampleKey,
    tKey: string | null = testSampleKey
  ) => {
    if (!rFile && !rKey) {
      setErrorMsg("Please upload or select the Authentic Reference Certificate (Left).");
      return;
    }
    if (!tFile && !tKey) {
      setErrorMsg("Please upload or select the Candidate Certificate to Test (Right).");
      return;
    }

    setIsComparing(true);
    setErrorMsg(null);
    setResult(null);

    const formData = new FormData();
    if (rFile) formData.append("real_file", rFile);
    if (tFile) formData.append("test_file", tFile);
    if (rKey) formData.append("real_sample_key", rKey);
    if (tKey) formData.append("test_sample_key", tKey);

    try {
      const startTime = Date.now();
      const res = await fetch("http://127.0.0.1:8000/api/cross-verify", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const elapsed = Date.now() - startTime;
      const minDuration = 1800; // Polish latency animation
      if (elapsed < minDuration) {
        await new Promise((r) => setTimeout(r, minDuration - elapsed));
      }

      setResult(data);
    } catch (err: any) {
      console.error("Cross-verify error:", err);
      setErrorMsg("Cross-verification failed: " + (err.message || err));
    } finally {
      setIsComparing(false);
    }
  };

  const handleReset = () => {
    setRealFile(null);
    setTestFile(null);
    setRealPreview(null);
    setTestPreview(null);
    setRealSampleKey(null);
    setTestSampleKey(null);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Feature Intro Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-xs font-mono">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>GEOMETRIC & DESIGN TEMPLATE CROSS-MATCHER</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
              Dual Certificate Alignment & Measurement Cross-Check
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              Upload the original authentic certificate on the left, and the test certificate on the right. Our algorithm masks dynamic names/text to purely compare structural design, border alignments, seal coordinates, guilloché curves, and dimensional measurements.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Both</span>
            </button>
          </div>
        </div>

        {/* 1-Click Presets */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 font-semibold flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>1-Click Test Scenarios:</span>
          </span>
          <button
            onClick={() => handleLoadPreset("authentic_harvard", "priyal_shukla_verified")}
            disabled={isComparing}
            className="px-3 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 transition-all text-[11px]"
          >
            ✓ Harvard vs Priyal Shukla (Same Layout Frame)
          </button>
          <button
            onClick={() => handleLoadPreset("authentic_harvard", "tampered_oxford_seal")}
            disabled={isComparing}
            className="px-3 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 transition-all text-[11px]"
          >
            ✕ Harvard vs Oxford Seal Splicing (Design Mismatch)
          </button>
        </div>
      </div>

      {/* Dual Upload Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Left Column: Authentic Ground Truth */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border-2 border-emerald-500/40 hover:border-emerald-400/80 transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                1
              </span>
              <span className="font-mono text-sm font-bold text-slate-100 uppercase">
                Original Real Certificate (Ground Truth)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              REFERENCE
            </span>
          </div>

          {realPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group">
              <img
                src={realPreview}
                alt="Reference Authentic Certificate"
                className="w-full h-64 object-contain"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-500 text-black font-mono font-bold text-xs">
                  Change Reference File
                  <input type="file" accept="image/*" onChange={handleRealUpload} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            <label className="flex-1 min-h-[220px] rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-400/60 bg-slate-950/60 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all space-y-3">
              <UploadCloud className="w-10 h-10 text-emerald-400/70 animate-bounce" />
              <div>
                <div className="font-mono text-xs font-bold text-slate-200 uppercase">
                  Upload Authentic Reference File
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Drag & drop original high-resolution certificate template (PNG, JPG, PDF)
                </p>
              </div>
              <input type="file" accept="image/*" onChange={handleRealUpload} className="hidden" />
            </label>
          )}

          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Ground truth reference baseline</span>
            {realFile && <span className="text-emerald-400 truncate max-w-[160px]">{realFile.name}</span>}
          </div>
        </div>

        {/* Right Column: Candidate Certificate to Test */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border-2 border-cyan-500/40 hover:border-cyan-400/80 transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center border border-cyan-500/40">
                2
              </span>
              <span className="font-mono text-sm font-bold text-slate-100 uppercase">
                Candidate Certificate (To Test)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              TARGET
            </span>
          </div>

          {testPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group">
              <img
                src={testPreview}
                alt="Candidate Certificate to Test"
                className="w-full h-64 object-contain"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-cyan-500 text-black font-mono font-bold text-xs">
                  Change Candidate File
                  <input type="file" accept="image/*" onChange={handleTestUpload} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            <label className="flex-1 min-h-[220px] rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-400/60 bg-slate-950/60 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all space-y-3">
              <UploadCloud className="w-10 h-10 text-cyan-400/70 animate-bounce" />
              <div>
                <div className="font-mono text-xs font-bold text-slate-200 uppercase">
                  Upload Candidate Certificate
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Upload certificate to measure geometric & structural congruence against reference
                </p>
              </div>
              <input type="file" accept="image/*" onChange={handleTestUpload} className="hidden" />
            </label>
          )}

          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Candidate document to cross-examine</span>
            {testFile && <span className="text-cyan-400 truncate max-w-[160px]">{testFile.name}</span>}
          </div>
        </div>

      </div>

      {/* Main Execution Button */}
      <div className="text-center">
        <button
          onClick={() => runCrossVerification()}
          disabled={isComparing || (!realPreview && !realSampleKey) || (!testPreview && !testSampleKey)}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-mono font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-xl shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center space-x-3"
        >
          {isComparing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Aligning Geometric Homography & Measuring Templates...</span>
            </>
          ) : (
            <>
              <Scale className="w-5 h-5" />
              <span>Execute Design Cross-Verification</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 font-mono text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Cross-Verification Results Dashboard */}
      {result && !isComparing && (
        <div className="space-y-8 animate-fadeIn pt-4 border-t border-slate-800">
          
          {/* Header Verdict Card */}
          <div
            className="p-6 rounded-2xl border backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
            style={{
              borderColor: `${result.verdict_color}60`,
              backgroundColor: `${result.verdict_color}10`,
            }}
          >
            <div className="flex items-start space-x-4">
              <div
                className="p-3.5 rounded-2xl border flex-shrink-0"
                style={{
                  backgroundColor: `${result.verdict_color}20`,
                  borderColor: result.verdict_color,
                }}
              >
                <ShieldCheck className="w-8 h-8" style={{ color: result.verdict_color }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md uppercase"
                    style={{
                      backgroundColor: `${result.verdict_color}30`,
                      color: result.verdict_color,
                    }}
                  >
                    {result.verdict_title}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({result.execution_time_ms}ms)
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-mono">
                  {result.summary}
                </h3>
              </div>
            </div>

            {/* Big Radial Score */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex-shrink-0 min-w-[170px]">
              <div className="text-4xl font-black font-mono" style={{ color: result.verdict_color }}>
                {result.similarity_score}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">
                Design Similarity
              </div>
            </div>
          </div>

          {/* Measurements Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Metric 1: SSIM Structure */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{result.measurements.ssim_structure.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.measurements.ssim_structure.status === "PASS" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                  {result.measurements.ssim_structure.status}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-100">
                {result.measurements.ssim_structure.score}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Structural luminance & contrast correlation across design frame (text masked).
              </p>
            </div>

            {/* Metric 2: Border Precision */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{result.measurements.border_geometry.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.measurements.border_geometry.status === "PASS" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                  {result.measurements.border_geometry.status}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-100">
                {result.measurements.border_geometry.score}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Avg margin offset: <span className="text-cyan-400 font-bold">{result.measurements.border_geometry.avg_margin_delta_px}px</span> delta across 4 frame borders.
              </p>
            </div>

            {/* Metric 3: Seal Coordinates */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{result.measurements.seal_emblem_placement.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.measurements.seal_emblem_placement.status === "PASS" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                  {result.measurements.seal_emblem_placement.status}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-100">
                {result.measurements.seal_emblem_placement.score}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Seal coordinate shift: <span className="text-cyan-400 font-bold">{result.measurements.seal_emblem_placement.pos_delta_px}px</span> (Radius delta: {result.measurements.seal_emblem_placement.radius_delta_px}px).
              </p>
            </div>

            {/* Metric 4: Keypoint Homography */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{result.measurements.keypoint_alignment.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.measurements.keypoint_alignment.status === "PASS" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                  {result.measurements.keypoint_alignment.status}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-100">
                {result.measurements.keypoint_alignment.score}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Matched features: <span className="text-cyan-400 font-bold">{result.measurements.keypoint_alignment.matched_features}</span> landmarks (Rotation: {result.measurements.keypoint_alignment.rotation_degrees}°).
              </p>
            </div>

            {/* Metric 5: Edge Guilloché */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{result.measurements.edge_guilloche.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.measurements.edge_guilloche.status === "PASS" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                  {result.measurements.edge_guilloche.status}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-100">
                {result.measurements.edge_guilloche.score}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Guilloché security curve & border corner stroke coherence.
              </p>
            </div>

            {/* Metric 6: Aspect Ratio */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{result.measurements.aspect_ratio.label}</span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Δ {result.measurements.aspect_ratio.delta}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-100">
                {result.measurements.aspect_ratio.score}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Reference ratio: {result.measurements.aspect_ratio.real_ratio} vs Candidate: {result.measurements.aspect_ratio.test_ratio}
              </p>
            </div>

          </div>

          {/* Visual Alignment Inspector (Circled Discrepancies, Heatmap & Keypoint Matches) */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h4 className="font-mono text-sm font-bold text-slate-200 uppercase">
                  Multi-Spectral Template Alignment Visualizer
                </h4>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActiveVisualTab("circled")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeVisualTab === "circled"
                      ? "bg-rose-500 text-white font-bold shadow-sm shadow-rose-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ⭕ Circled Differences ({result.mismatch_regions_count})
                </button>
                <button
                  onClick={() => setActiveVisualTab("heatmap")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeVisualTab === "heatmap"
                      ? "bg-cyan-500 text-black font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Layout Diff Heatmap
                </button>
                <button
                  onClick={() => setActiveVisualTab("keypoints")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeVisualTab === "keypoints"
                      ? "bg-cyan-500 text-black font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Keypoint Matrix
                </button>
              </div>
            </div>

            {/* Visual Canvas */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
              {activeVisualTab === "circled" ? (
                <div className="space-y-3">
                  <div className="relative">
                    <img
                      src={result.circled_anomalies_img}
                      alt="Circled Differences on Candidate Certificate"
                      className="w-full max-h-[520px] object-contain mx-auto rounded-lg"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 font-mono px-2 gap-2 border-t border-slate-800/80 pt-2">
                    <span className="flex items-center space-x-2 text-rose-400 font-bold">
                      <span className="w-3 h-3 rounded-full bg-rose-500 inline-block animate-ping" />
                      <span>{result.mismatch_regions_count} Discrepancy Zones Circled in Red (Exceeds 1.0% Threshold)</span>
                    </span>
                    <span className="text-slate-500">
                      Evaluated on 1000x700 Standardized Geometric Canvas
                    </span>
                  </div>

                  {/* List of Circled Discrepancies */}
                  {result.mismatch_circles && result.mismatch_circles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                      {result.mismatch_circles.map((mc: any) => (
                        <div
                          key={mc.id}
                          className="px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center space-x-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-rose-500/30 text-rose-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                            #{mc.id}
                          </span>
                          <span className="truncate">{mc.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeVisualTab === "heatmap" ? (
                <div className="space-y-2">
                  <img
                    src={result.diff_heatmap}
                    alt="Structural Layout Difference Heatmap"
                    className="w-full max-h-[500px] object-contain mx-auto rounded-lg"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-2">
                    <span className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                      <span>Blue = Congruent Alignment</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                      <span>Red = Geometric Discrepancy Zone</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <img
                    src={result.keypoint_matches_img}
                    alt="Keypoint Homography Match Lines"
                    className="w-full max-h-[500px] object-contain mx-auto rounded-lg"
                  />
                  <div className="text-[11px] text-slate-400 font-mono text-center">
                    Left: Reference Ground Truth • Right: Candidate Test Certificate • Colored Lines: Matching ORB Landmark Vectors
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
