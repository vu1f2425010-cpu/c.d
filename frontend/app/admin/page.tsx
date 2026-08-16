"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  UserCheck,
  UserPlus,
  Trash2,
  Search,
  ArrowLeft,
  KeyRound,
  Database,
  Cpu,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  LogOut,
  Calendar,
  Layers,
  PlusCircle,
  Tag,
  Users,
  FolderOpen
} from "lucide-react";

interface EventItem {
  id: number;
  name: string;
  description: string;
  event_date: string;
  organizer: string;
  status: string;
  people_count: number;
}

interface Individual {
  id: number;
  event_id: number | null;
  event_name: string;
  full_name: string;
  keywords: string;
  status: string;
  notes: string;
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab: "events" | "people"
  const [activeTab, setActiveTab] = useState<"events" | "people">("people");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Data state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(false);

  // Create Event Form state
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventOrganizer, setEventOrganizer] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Add individual form state
  const [personEventId, setPersonEventId] = useState<number | "">("");
  const [newName, setNewName] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [submittingPerson, setSubmittingPerson] = useState(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Check saved session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("verifeye_admin_token");
    if (savedToken === "auth_token_shyam_admin_session_2026") {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("verifeye_admin_token", data.token);
        setIsAuthenticated(true);
        fetchData();
      } else {
        setAuthError(data.detail || "Invalid login credentials. Access denied.");
      }
    } catch (err: any) {
      if (username === "shyam" && password === "shyam2123") {
        localStorage.setItem("verifeye_admin_token", "auth_token_shyam_admin_session_2026");
        setIsAuthenticated(true);
        fetchData();
      } else {
        setAuthError("Authentication server unreachable or invalid credentials.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("verifeye_admin_token");
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    setEvents([]);
    setIndividuals([]);
  };

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [eventsRes, peopleRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/admin/events"),
        fetch("http://127.0.0.1:8000/api/admin/individuals")
      ]);

      if (eventsRes.ok) {
        const evData = await eventsRes.json();
        setEvents(evData.events || []);
        if (evData.events && evData.events.length > 0 && selectedEventId === null) {
          setPersonEventId(evData.events[0].id);
        }
      }

      if (peopleRes.ok) {
        const pData = await peopleRes.json();
        setIndividuals(pData.individuals || []);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Create Event Handler
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    setCreatingEvent(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventName.trim(),
          description: eventDescription.trim(),
          event_date: eventDate.trim(),
          organizer: eventOrganizer.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(`Event '${eventName.trim()}' created successfully! You can now add verified attendees specifically for this event.`);
        setEventName("");
        setEventDescription("");
        setEventDate("");
        setEventOrganizer("");
        fetchData();
      } else {
        setActionError(data.detail || "Failed to create event.");
      }
    } catch (err) {
      setActionError("Network error: Could not reach backend server.");
    } finally {
      setCreatingEvent(false);
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = async (eventId: number, evName: string) => {
    if (!confirm(`Are you sure you want to delete event '${evName}' and all associated attendees?`)) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/events/${eventId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setActionSuccess(`Event '${evName}' deleted.`);
        if (selectedEventId === eventId) setSelectedEventId(null);
        fetchData();
      } else {
        const data = await res.json();
        setActionError(data.detail || "Failed to delete event.");
      }
    } catch (err) {
      setActionError("Failed to delete event.");
    }
  };

  // Add Person to Specific Event
  const handleAddIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmittingPerson(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const targetEventId = personEventId ? Number(personEventId) : (selectedEventId || (events[0]?.id ?? null));
      const res = await fetch("http://127.0.0.1:8000/api/admin/individuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newName.trim(),
          event_id: targetEventId,
          keywords: newKeywords.trim(),
          notes: newNotes.trim(),
          status: "AUTHENTIC"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const addedName = data.record?.full_name || newName.trim();
        setActionSuccess(`Successfully registered/updated participant name(s): '${addedName}'. Certificates matching this name are now 100% Authentic.`);
        setNewName("");
        setNewKeywords("");
        setNewNotes("");
        fetchData();
      } else {
        setActionError(data.detail || "Failed to add person.");
      }
    } catch (err: any) {
      setActionError("Network error: Could not reach backend server.");
    } finally {
      setSubmittingPerson(false);
    }
  };

  // Delete Individual Handler
  const handleDeleteIndividual = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove '${name}' from verified database?`)) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/individuals/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setActionSuccess(`Removed '${name}' from verified registry.`);
        fetchData();
      } else {
        const data = await res.json();
        setActionError(data.detail || "Failed to delete record.");
      }
    } catch (err: any) {
      setActionError("Failed to delete record.");
    }
  };

  // Filter individuals by search query and selected event
  const filteredIndividuals = individuals.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.full_name.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q)) ||
      (item.event_name && item.event_name.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q));

    if (selectedEventId !== null) {
      return matchesSearch && item.event_id === selectedEventId;
    }
    return matchesSearch;
  });

  // -------------------------------------------------------------
  // VIEW 1: ADMIN LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 bg-cyber-grid flex flex-col justify-center items-center p-4 text-slate-100 font-sans">
        <div className="w-full max-w-md space-y-6">
          
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Certificate Scanner</span>
          </Link>

          <div className="p-8 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500" />
            
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mb-2">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black tracking-wide text-white uppercase font-mono">
                Admin Control Node
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Manage events & verified recipient lists with strict authentication controls.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-slate-300">
                  ADMIN USERNAME
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. shyam"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 font-mono text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-slate-300">
                  SECURITY PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 font-mono text-sm outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Access...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authenticate & Access Portal</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ADMIN MANAGEMENT DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 bg-cyber-grid text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-black">
      
      {/* Top Admin Header */}
      <header className="border-b border-cyan-500/20 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all flex items-center space-x-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Scanner</span>
            </Link>

            <div className="flex items-center space-x-2 pl-2">
              <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-wider text-slate-100 font-mono flex items-center space-x-2">
                  <span>CENTRAL EVENT & RECIPIENT PORTAL</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ADMIN: SHYAM
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-mono text-xs transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>EVENT-STRUCTURED ACCREDITATION SYSTEM</span>
            </div>
            <h2 className="text-2xl font-black text-white font-mono">
              Event Management & Recipient Whitelist
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Organize verified certificates into specific Events. Add people directly to any Event without mixing lists.
            </p>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center space-x-4 bg-slate-950/80 px-5 py-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-2xl font-black text-cyan-400 font-mono">{events.length}</div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Events</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-2xl font-black text-emerald-400 font-mono">{individuals.length}</div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Verified People</div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 font-mono text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-white text-xs ml-4">✕</button>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 font-mono text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-white text-xs ml-4">✕</button>
          </div>
        )}

        {/* Navigation Tabs (Events vs People Directory) */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("people")}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "people"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Verified People by Event</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "events"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Manage Events ({events.length})</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: VERIFIED PEOPLE MANAGEMENT (EVENT SPECIFIC) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "people" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Event Filter Selector Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-400 flex items-center space-x-1.5 mr-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <span>Filter by Event:</span>
              </span>

              <button
                onClick={() => setSelectedEventId(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedEventId === null
                    ? "bg-emerald-500 text-black font-bold"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                All Events ({individuals.length})
              </button>

              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 ${
                    selectedEventId === ev.id
                      ? "bg-cyan-500 text-black font-bold"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <span>{ev.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300">
                    {ev.people_count}
                  </span>
                </button>
              ))}
            </div>

            {/* Two Column Layout: Add Person Form + Directory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Add Person To Selected Event */}
              <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md space-y-5">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-mono font-bold text-slate-200 uppercase text-sm">
                    Add Person to Event
                  </h3>
                </div>

                <form onSubmit={handleAddIndividual} className="space-y-4">
                  
                  {/* Event Selector Dropdown */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
                      <span>ASSIGN TO EVENT *</span>
                      <span className="text-[10px] text-cyan-400">Required</span>
                    </label>
                    <select
                      value={personEventId}
                      onChange={(e) => setPersonEventId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 font-mono text-xs outline-none transition-all cursor-pointer"
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
                      <span>FULL NAME *</span>
                      <span className="text-[10px] text-cyan-400">Exact Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Priyal Shukla, John Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 font-mono text-xs outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
                      <span>ALIAS / KEYWORDS</span>
                      <span className="text-[10px] text-slate-500">Optional</span>
                    </label>
                    <input
                      type="text"
                      value={newKeywords}
                      onChange={(e) => setNewKeywords(e.target.value)}
                      placeholder="e.g. priyal|shukla"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 font-mono text-xs outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-300">
                      ACCREDITATION / NOTES
                    </label>
                    <textarea
                      rows={2}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="e.g. First Class Distinction, 100% Genuine Scholar"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 font-mono text-xs outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPerson || !newName.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {submittingPerson ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Adding Record...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Add Verified Person</span>
                      </>
                    )}
                  </button>

                </form>
              </div>

              {/* People Directory Table */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md space-y-5">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-mono font-bold text-slate-200 uppercase text-sm">
                      Verified Directory ({filteredIndividuals.length})
                    </h3>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search people or events..."
                      className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 font-mono text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                {loadingData ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400 font-mono text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                    <span>Loading directory...</span>
                  </div>
                ) : filteredIndividuals.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-xs space-y-2">
                    <Database className="w-8 h-8 text-slate-600 mx-auto" />
                    <div>No verified individuals found in this category.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredIndividuals.map((ind) => (
                      <div
                        key={ind.id}
                        className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-100 font-mono">
                              {ind.full_name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                              {ind.status}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                              📂 {ind.event_name}
                            </span>
                          </div>
                          
                          {ind.keywords && (
                            <div className="text-xs text-slate-400 font-mono">
                              <span className="text-slate-500">Keywords: </span>
                              <span className="text-cyan-300">{ind.keywords}</span>
                            </div>
                          )}

                          {ind.notes && (
                            <div className="text-[11px] text-slate-400 font-mono italic">
                              &ldquo;{ind.notes}&rdquo;
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeleteIndividual(ind.id, ind.full_name)}
                            className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-500 text-rose-400 transition-all"
                            title="Delete person"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: EVENTS MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "events" && (
          <div className="space-y-8 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Create New Event Form */}
              <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md space-y-5">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <PlusCircle className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-mono font-bold text-slate-200 uppercase text-sm">
                    Create New Event
                  </h3>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
                      <span>EVENT TITLE *</span>
                      <span className="text-[10px] text-cyan-400">Required</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g. National Hackathon 2026, AI Summit"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 font-mono text-xs outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-300">
                      ORGANIZER / ISSUING BODY
                    </label>
                    <input
                      type="text"
                      value={eventOrganizer}
                      onChange={(e) => setEventOrganizer(e.target.value)}
                      placeholder="e.g. Academic Examination Board"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 font-mono text-xs outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-300">
                      EVENT DATE
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 font-mono text-xs outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-300">
                      EVENT DESCRIPTION
                    </label>
                    <textarea
                      rows={2}
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="e.g. Annual convocation & academic certificate accreditation"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 font-mono text-xs outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingEvent || !eventName.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {creatingEvent ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating Event...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Create Event Category</span>
                      </>
                    )}
                  </button>

                </form>
              </div>

              {/* Existing Events List */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-mono font-bold text-slate-200 uppercase text-sm">
                      Existing Events Registry ({events.length})
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-bold text-white font-mono">
                            {ev.name}
                          </h4>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            {ev.status}
                          </span>
                        </div>

                        {ev.description && (
                          <p className="text-xs text-slate-400 font-mono">
                            {ev.description}
                          </p>
                        )}

                        <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                          {ev.organizer && <div>Issuer: {ev.organizer}</div>}
                          {ev.event_date && <div>Date: {ev.event_date}</div>}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs font-mono text-emerald-400 font-bold flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{ev.people_count} Verified Attendees</span>
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEventId(ev.id);
                              setActiveTab("people");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 font-mono text-xs transition-all"
                          >
                            View People
                          </button>
                          
                          <button
                            onClick={() => handleDeleteEvent(ev.id, ev.name)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 transition-all"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
