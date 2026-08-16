"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import Dropzone from "../components/Dropzone";
import SampleSelector from "../components/SampleSelector";
import ScanHUD from "../components/ScanHUD";
import InspectionViewer from "../components/InspectionViewer";
import TrustGauge from "../components/TrustGauge";
import DiagnosticCards from "../components/DiagnosticCards";
import ReportExport from "../components/ReportExport";
import DualCrossVerifier from "../components/DualCrossVerifier";
import { ShieldCheck, RefreshCw, Cpu, Sparkles, AlertTriangle, Scale, Scan } from "lucide-react";

export default function Home() {
  const [activeMode, setActiveMode] = useState<"single" | "dual">("single");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sampleKey, setSampleKey] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trigger Forensic Audit API
  const runAudit = async (file: File | null, key: string | null) => {
    setIsScanning(true);
    setErrorMsg(null);
    setReport(null);

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    } else if (key) {
      formData.append("sample_key", key);
    }

    try {
      // Simulate HUD scanning latency for visual polish
      const startTime = Date.now();
      const res = await fetch("http://127.0.0.1:8000/api/verify", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      
      // Ensure HUD scan animation completes smoothly (at least 2.5s)
      const elapsed = Date.now() - startTime;
      const minDuration = 2500;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      setReport(data);
    } catch (err: any) {
      console.error("Audit error:", err);
      setErrorMsg("Failed to run forensic audit: " + (err.message || err));
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSampleKey(null);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    runAudit(file, null);
  };

  const handleSampleSelect = (key: string) => {
    setSampleKey(key);
    setSelectedFile(null);
    const samplePreviewUrl = `http://127.0.0.1:8000/api/sample_image/${key}.png`;
    setImagePreviewUrl(samplePreviewUrl);
    runAudit(null, key);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSampleKey(null);
    setImagePreviewUrl(null);
    setReport(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-cyber-grid bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Header Navigation */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Mode Selector Tabs (Single Scan vs Dual Cross-Verifier) */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-lg">
            <button
              onClick={() => setActiveMode("single")}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                activeMode === "single"
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-black shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Single Certificate Scanner (ELA & DB)</span>
            </button>
            <button
              onClick={() => setActiveMode("dual")}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                activeMode === "dual"
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-black shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Dual Cross-Verification (Real vs Test Design)</span>
            </button>
          </div>
        </div>

        {/* DUAL CROSS-VERIFICATION MODE */}
        {activeMode === "dual" ? (
          <DualCrossVerifier />
        ) : (
          /* SINGLE CERTIFICATE FORENSIC SCANNER MODE */
          <div className="space-y-8">
            {/* Futuristic Hero Banner */}
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono cyber-glow-cyan">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>AI MULTI-SPECTRAL COMPRESSION & REGISTRY FORENSICS</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-200 to-emerald-400 text-glow-cyan">
                AUTHENTICATE CREDENTIALS IN SECONDS
              </h1>
              <p className="text-sm sm:text-base text-slate-400 font-mono">
                Upload paper or digital certificates to detect sub-surface Error Level Analysis (ELA) anomalies, text splicing, font baseline tilt, and seal forgery.
              </p>
            </div>

            {/* Upload & Sample Selector Section */}
            <div className="space-y-6">
              <Dropzone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClearFile={handleReset}
                isScanning={isScanning}
              />

              <SampleSelector onSelectSample={handleSampleSelect} isScanning={isScanning} />
            </div>

            {/* Live HUD Scan Overlay */}
            <ScanHUD isScanning={isScanning} imagePreviewUrl={imagePreviewUrl} />

            {/* Error Notification */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 font-mono text-sm flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Forensic Audit Results Dashboard */}
            {report && !isScanning && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Action Bar (Reset / Export) */}
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <h2 className="font-mono text-lg font-bold text-slate-200 uppercase tracking-wider">
                      FORENSIC AUDIT DASHBOARD
                    </h2>
                  </div>
                  <button
                    onClick={handleReset}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs transition-all"
                  >
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                    <span>Inspect New File</span>
                  </button>
                </div>

                {/* Top Row: Radial Trust Score & Verdict + Interactive Inspection Suite */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Left Column: Radial Score Gauge & Verdict */}
                  <div className="lg:col-span-1 space-y-6">
                    <TrustGauge
                      score={report.trust_score}
                      verdict={report.verdict}
                      verdictColor={report.verdict_color}
                      summary={report.summary}
                    />

                    <ReportExport reportData={report} />
                  </div>

                  {/* Right Column: ELA Heatmap Inspector Slider */}
                  <div className="lg:col-span-2">
                    <InspectionViewer
                      originalImage={imagePreviewUrl || `http://127.0.0.1:8000/api/sample_image/${sampleKey}.png`}
                      elaHeatmap={report.ela_heatmap}
                      anomalyBoxes={report.anomaly_boxes || []}
                    />
                  </div>

                </div>

                {/* Bottom Row: Granular Diagnostic Cards */}
                <DiagnosticCards diagnostics={report.diagnostics} />

              </div>
            )}
          </div>
        )}

      </main>

      {/* Futuristic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>VERIFEYE CYBER-FORENSICS ENGINE v1.0</span>
          </div>
          <div>POWERED BY FASTAPI • OPENCV • SCIPY • ELA HEATMAP • NEXT.JS 14</div>
        </div>
      </footer>

    </div>
  );
}
