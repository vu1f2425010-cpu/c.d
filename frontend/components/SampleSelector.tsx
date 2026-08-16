"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, AlertTriangle, FileSpreadsheet, Sparkles } from "lucide-react";

interface SampleItem {
  id: string;
  title: string;
  institution: string;
  type: string;
  description: string;
  filename: string;
}

interface SampleSelectorProps {
  onSelectSample: (sampleKey: string) => void;
  isScanning: boolean;
}

export default function SampleSelector({ onSelectSample, isScanning }: SampleSelectorProps) {
  const [samples, setSamples] = useState<SampleItem[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/samples")
      .then((res) => res.json())
      .then((data) => setSamples(data.samples || []))
      .catch(() => {
        // Fallback static samples if API unavailable
        setSamples([
          {
            id: "priyal_shukla_verified",
            title: "Priyal Shukla (Verified Scholar)",
            institution: "National Accreditation Board",
            type: "AUTHENTIC",
            description: "Accredited scholar record in central registry. 100% genuine verified certificate.",
            filename: "priyal_shukla_verified.png"
          },
          {
            id: "authentic_harvard",
            title: "Harvard (Unverified Person)",
            institution: "Harvard University",
            type: "FORGED",
            description: "Failed database check: Recipient name is not whitelisted in the admin panel. Classified as FAKE.",
            filename: "authentic_harvard.png"
          },
          {
            id: "forged_mit_grade",
            title: "Grade Tampering (Text Splicing)",
            institution: "MIT",
            type: "FORGED",
            description: "Failed database check: Recipient name is not whitelisted in the admin panel. Classified as FAKE.",
            filename: "forged_mit_grade.png"
          },
          {
            id: "tampered_oxford_seal",
            title: "Seal Forgery (Emblem Splicing)",
            institution: "University of Oxford",
            type: "FORGED",
            description: "Failed database check: Recipient name is not whitelisted in the admin panel. Classified as FAKE.",
            filename: "tampered_oxford_seal.png"
          }
        ]);
      });
  }, []);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
            Or Test With 1-Click Synthetic Sample Suite:
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {samples.map((s) => {
          const isAuthentic = s.type === "AUTHENTIC";
          return (
            <button
              key={s.id}
              onClick={() => !isScanning && onSelectSample(s.id)}
              disabled={isScanning}
              className={`p-3.5 rounded-xl text-left transition-all duration-300 border flex flex-col justify-between ${
                isAuthentic
                  ? "bg-slate-900/80 hover:bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400 cyber-glow-emerald"
                  : "bg-slate-900/80 hover:bg-rose-950/40 border-rose-500/30 hover:border-rose-400 cyber-glow-crimson"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-slate-200">{s.institution}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                      isAuthentic
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {s.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-snug line-clamp-2">{s.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                <span>Load & Run Audit</span>
                <span>→</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
