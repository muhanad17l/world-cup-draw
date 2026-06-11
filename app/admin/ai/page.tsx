"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, doc, onSnapshot, writeBatch,
  runTransaction, setDoc, serverTimestamp, getDocs, addDoc, getDoc, updateDoc,
} from "firebase/firestore";
import {
  Trophy, Calendar, Upload, Crown, ShieldAlert,
  Plus, X, Loader2, Eye, Trash2, ChevronRight, Lock,
  Pencil, Droplets, LayoutList, Star, ChevronLeft,
  Flag, Users, Award,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   TYPES & STATIC CONFIG
═══════════════════════════════════════════════ */
const ROUND_DEFS = [
  { id: "r16",    label: "دور الـ ١٦",    slots: 16, pairs: 8  },
  { id: "qf",     label: "ربع النهائي",   slots: 8,  pairs: 4  },
  { id: "sf",     label: "نصف النهائي",   slots: 4,  pairs: 2  },
  { id: "fn",     label: "النهائي",       slots: 2,  pairs: 1  },
  { id: "winner", label: "🏆 البطل",      slots: 1,  pairs: 0  },
] as const;

const TOTAL_MATCHES = ROUND_DEFS.reduce((s, r) => s + r.slots, 0);

// Color themes
const THEMES = [
  { id: "dark",  name: "أسود", label: "B&W",  bg: "#0a0a0a", accent: "#ffffff", badge: "bg-white text-black" },
  { id: "pink",  name: "وردي", label: "P&Y",  bg: "#1a0010", accent: "#FFD700", badge: "bg-pink-500 text-white" },
  { id: "navy",  name: "نيلي", label: "N&Y",  bg: "#020d1f", accent: "#FFD700", badge: "bg-blue-900 text-yellow-400" },
] as const;

type ThemeId = typeof THEMES[number]["id"];

interface MatchDoc {
  matchId:   string;
  roundId:   string;
  slotIndex: number;
  name:      string;
  userId:    string;
  image:     string;
  winner:    boolean;
  country?:  string;
  countryName?: string;
  gender?:   string;
  score?:    number;
  scoreNote?: string;
}

interface HallEntry {
  id: string;
  winnerName: string;
  drawingUrl: string;
  year: number;
  tournamentId: string;
  country?: string;
  countryName?: string;
}

interface Round { id: string; label: string; slots: MatchDoc[] }

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
async function bootstrapTournament() {
  const batch = writeBatch(db);
  batch.set(doc(db, "tournament", "current"), { version: 2, createdAt: serverTimestamp() });
  const pSnap = await getDocs(collection(db, "tournament", "current", "participants"));
  pSnap.docs.forEach(d => batch.delete(d.ref));
  ROUND_DEFS.forEach(def => {
    for (let i = 0; i < def.slots; i++) {
      const matchId = `${def.id}_${i}`;
      batch.set(doc(db, "tournament", "current", "matches", matchId), {
        matchId, roundId: def.id, slotIndex: i,
        name: "", userId: "", image: "", winner: false, score: 0, scoreNote: "",
      });
    }
  });
  await batch.commit();
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function TournamentPage() {
  const { user, isAdmin, profile } = useAuth();

  const [matches, setMatches]           = useState<Record<string, MatchDoc>>({});
  const [loading, setLoading]           = useState(true);
  const [theme, setTheme]               = useState<ThemeId>("dark");
  const [category, setCategory]         = useState<"pencil" | "ink">("pencil");
  const [hallEntries, setHallEntries]   = useState<HallEntry[]>([]);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<HallEntry | null>(null);
  const initializingRef                 = useRef(false);

  // Registration modal
  const [regSlot, setRegSlot]           = useState<{ roundId: string; slotIndex: number } | null>(null);
  const [regPreview, setRegPreview]     = useState<string | null>(null);
  const [regBase64, setRegBase64]       = useState<string | null>(null);
  const [regUploading, setRegUploading] = useState(false);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  // Match viewer modal (click on a pair to see drawings)
  const [viewMatch, setViewMatch]       = useState<{ slot1: MatchDoc; slot2: MatchDoc } | null>(null);

  // Admin scoring modal
  const [adminSlot, setAdminSlot]       = useState<{ roundId: string; slotIndex: number } | null>(null);
  const [adminWorking, setAdminWorking] = useState(false);
  const [scoreInput, setScoreInput]     = useState(0);
  const [scoreNoteInput, setScoreNoteInput] = useState("");

  /* ── Fetch matches subcollection (live) ── */
  useEffect(() => {
    const col = collection(db, "tournament", "current", "matches");
    const unsub = onSnapshot(col, snap => {
      const map: Record<string, MatchDoc> = {};
      snap.docs.forEach(d => { map[d.id] = d.data() as MatchDoc; });
      setMatches(map);
      setLoading(false);
      if (snap.docs.length < TOTAL_MATCHES && !initializingRef.current) {
        initializingRef.current = true;
        bootstrapTournament().catch(console.error).finally(() => { initializingRef.current = false; });
      }
    }, err => { console.error(err); setLoading(false); });
    return () => unsub();
  }, []);

  /* ── Fetch Hall of Fame ── */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "hall_of_fame"), snap => {
      setHallEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })) as HallEntry[]);
    });
    return () => unsub();
  }, []);

  /* ── Build round display ── */
  const rounds = useMemo<Round[]>(() =>
    ROUND_DEFS.map(def => ({
      id:    def.id,
      label: def.label,
      slots: Array.from({ length: def.slots }, (_, i) => {
        const matchId = `${def.id}_${i}`;
        return matches[matchId] ?? { matchId, roundId: def.id, slotIndex: i, name: "", userId: "", image: "", winner: false };
      }),
    })), [matches]);

  /* ── Image compression (canvas) ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const MAX = 300;
      const r   = Math.min(MAX / img.width, MAX / img.height, 1);
      const cv  = document.createElement("canvas");
      cv.width  = Math.round(img.width * r);
      cv.height = Math.round(img.height * r);
      cv.getContext("2d")?.drawImage(img, 0, 0, cv.width, cv.height);
      const compressed = cv.toDataURL("image/jpeg", 0.65);
      setRegBase64(compressed);
      setRegPreview(compressed);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const userAlreadyEntered = () =>
    !!user && Object.values(matches).some(m => m.roundId === "r16" && m.userId === user.uid);

  /* ── Register in round of 16 ── */
  const handleRegister = async () => {
    if (!user || !regSlot || !regBase64) return;
    if (userAlreadyEntered()) { alert("تم تسجيل مشاركتك مسبقاً."); closeReg(); return; }
    setRegUploading(true);
    try {
      const { roundId, slotIndex } = regSlot;
      const matchRef       = doc(db, "tournament", "current", "matches", `${roundId}_${slotIndex}`);
      const participantRef = doc(db, "tournament", "current", "participants", user.uid);
      await runTransaction(db, async tx => {
        if ((await tx.get(participantRef)).exists()) throw new Error("DUP");
        const mData = (await tx.get(matchRef)).data() as MatchDoc | undefined;
        if (mData?.userId) throw new Error("TAKEN");
        tx.update(matchRef, {
          name:        user.displayName || "مبدع الأكاديمية",
          userId:      user.uid,
          image:       regBase64,
          winner:      false,
          country:     profile?.country || "🌍",
          countryName: profile?.countryName || "",
          gender:      profile?.gender || "male",
        });
        tx.set(participantRef, { userId: user.uid, matchId: `${roundId}_${slotIndex}`, registeredAt: serverTimestamp() });
      });
      closeReg();
    } catch (err: any) {
      alert(err.message === "DUP" ? "تم تسجيل مشاركتك مسبقاً." : err.message === "TAKEN" ? "هذا المقعد محجوز." : "خطأ في الاتصال.");
    } finally { setRegUploading(false); }
  };
  const closeReg = () => { setRegSlot(null); setRegPreview(null); setRegBase64(null); };

  /* ── Admin: Advance Winner ── */
  const advanceWinner = async () => {
    if (!isAdmin || !adminSlot) return;
    const { roundId, slotIndex } = adminSlot;
    const roundIdx = ROUND_DEFS.findIndex(r => r.id === roundId);
    const nextRound = ROUND_DEFS[roundIdx + 1];
    setAdminWorking(true);
    try {
      const currRef = doc(db, "tournament", "current", "matches", `${roundId}_${slotIndex}`);
      const nextRef = nextRound ? doc(db, "tournament", "current", "matches", `${nextRound.id}_${Math.floor(slotIndex / 2)}`) : null;
      await runTransaction(db, async tx => {
        const curr = (await tx.get(currRef)).data() as MatchDoc;
        if (!curr.userId) throw new Error("EMPTY");
        tx.update(currRef, { winner: true });
        if (nextRef) {
          const nextSnap = await tx.get(nextRef);
          const payload = { name: curr.name, userId: curr.userId, image: curr.image, winner: false, country: curr.country, countryName: curr.countryName, gender: curr.gender };
          nextSnap.exists() ? tx.update(nextRef, payload) : tx.set(nextRef, { matchId: `${nextRound!.id}_${Math.floor(slotIndex/2)}`, roundId: nextRound!.id, slotIndex: Math.floor(slotIndex/2), ...payload });
        }
        if (nextRound?.id === "winner") {
          const snap = await tx.get(currRef);
          const d = snap.data() as MatchDoc;
          await addDoc(collection(db, "hall_of_fame"), { winnerName: d.name, drawingUrl: d.image, year: new Date().getFullYear(), tournamentId: `drawing-world-cup-${new Date().getFullYear()}`, country: d.country, countryName: d.countryName, timestamp: serverTimestamp() });
        }
      });
      setAdminSlot(null);
    } catch (err: any) {
      alert(err.message === "EMPTY" ? "لا يوجد مشارك في هذا المقعد." : "خطأ في قاعدة البيانات.");
    } finally { setAdminWorking(false); }
  };

  /* ── Admin: Set Score ── */
  const setScore = async () => {
    if (!isAdmin || !adminSlot) return;
    const matchRef = doc(db, "tournament", "current", "matches", `${adminSlot.roundId}_${adminSlot.slotIndex}`);
    await updateDoc(matchRef, { score: scoreInput, scoreNote: scoreNoteInput });
    setAdminSlot(null);
  };

  /* ── Admin: Disqualify ── */
  const disqualify = async () => {
    if (!isAdmin || !adminSlot) return;
    const { roundId, slotIndex } = adminSlot;
    const matchRef = doc(db, "tournament", "current", "matches", `${roundId}_${slotIndex}`);
    setAdminWorking(true);
    try {
      await runTransaction(db, async tx => {
        const snap = await tx.get(matchRef);
        const data = snap.data() as MatchDoc;
        tx.update(matchRef, { name: "", userId: "", image: "", winner: false, score: 0 });
        if (data.userId) {
          const pRef = doc(db, "tournament", "current", "participants", data.userId);
          if ((await tx.get(pRef)).exists()) tx.delete(pRef);
        }
      });
      setAdminSlot(null);
    } catch (err) { alert("خطأ."); }
    finally { setAdminWorking(false); }
  };

  /* ── Slot click: viewer or register or admin ── */
  const handlePairClick = (slot1: MatchDoc, slot2: MatchDoc) => {
    // If both have participants → open the match viewer
    if (slot1.userId && slot2.userId) {
      setViewMatch({ slot1, slot2 });
    }
  };

  const handleSingleSlotClick = (slot: MatchDoc) => {
    if (isAdmin && slot.userId) {
      const adminSlotData = { roundId: slot.roundId, slotIndex: slot.slotIndex };
      setAdminSlot(adminSlotData);
      setScoreInput(slot.score || 0);
      setScoreNoteInput(slot.scoreNote || "");
      return;
    }
    if (slot.roundId === "r16" && !slot.userId) {
      if (userAlreadyEntered()) { alert("تم تسجيل مشاركتك مسبقاً."); return; }
      setRegSlot({ roundId: slot.roundId, slotIndex: slot.slotIndex });
    }
  };

  /* ── Derived ── */
  const adminMatchData = adminSlot ? matches[`${adminSlot.roundId}_${adminSlot.slotIndex}`] : null;
  const currentTheme   = THEMES.find(t => t.id === theme)!;

  /* ─────────────────────────────────────
     PAIR BRACKET RENDER
  ───────────────────────────────────── */
  const renderBracket = () => {
    return (
      <div className="relative overflow-x-auto pb-16">
        <div className="flex items-stretch gap-0 min-w-[1400px] relative">
          {rounds.map((round, ri) => {
            const pairs: MatchDoc[][] = [];
            for (let i = 0; i < round.slots.length; i += 2) {
              pairs.push([round.slots[i], round.slots[i + 1] ?? round.slots[i]]);
            }

            // For "winner" round, show solo slot
            if (round.id === "winner") {
              const winner = round.slots[0];
              return (
                <div key={round.id} className="flex flex-col items-center justify-center flex-1 px-2">
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-black text-yellow uppercase tracking-[6px] block mb-2">{round.label}</span>
                    <div className="h-[2px] w-10 bg-yellow/30 mx-auto rounded-full" />
                  </div>
                  {/* Trophy Card */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative rounded-[36px] border-2 border-yellow/40 overflow-hidden shadow-2xl shadow-yellow/20 bg-yellow/5 p-6 flex flex-col items-center gap-3 cursor-pointer w-44"
                    onClick={() => handleSingleSlotClick(winner)}
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-yellow/30">
                      {winner.image
                        ? <img src={winner.image} className="w-full h-full object-cover" alt="champion" />
                        : <div className="w-full h-full flex items-center justify-center bg-yellow/10"><Trophy className="w-8 h-8 text-yellow" /></div>}
                    </div>
                    <p className="font-black text-sm text-white text-center">{winner.name || "المقعد الأبطال"}</p>
                    {winner.country && <span className="text-2xl">{winner.country}</span>}
                    {winner.userId && <div className="text-[9px] bg-yellow text-black font-black px-3 py-1 rounded-full uppercase tracking-widest">بطل الموسم</div>}
                  </motion.div>
                </div>
              );
            }

            return (
              <div key={round.id} className="flex items-center flex-1">
                <div className="flex flex-col w-full gap-0 relative">
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-[6px] block mb-2">{round.label}</span>
                    <div className="h-[2px] w-10 bg-white/10 mx-auto rounded-full" />
                  </div>

                  {/* Pairs */}
                  <div className="flex flex-col" style={{ gap: `${Math.pow(2, ri) * 12}px` }}>
                    {pairs.map((pair, pi) => {
                      const [s1, s2] = pair;
                      const bothFilled = s1?.userId && s2?.userId;
                      return (
                        <div key={pi} className="flex flex-col gap-[2px]">
                          {/* Slot 1 */}
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            onClick={() => {
                              if (bothFilled) handlePairClick(s1, s2);
                              else handleSingleSlotClick(s1);
                            }}
                            className={`relative rounded-t-[24px] border-2 p-3 flex items-center gap-3 cursor-pointer transition-all overflow-hidden ${
                              s1.winner ? "bg-yellow/10 border-yellow" :
                              s1.userId ? "bg-white/5 border-white/10 hover:border-primary/30" :
                              round.id === "r16" ? "bg-white/5 border-dashed border-white/10 hover:border-primary/50" :
                              "bg-white/[0.02] border-dashed border-white/5 opacity-40 cursor-default"
                            }`}
                          >
                            {/* Thumbnail */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/30">
                              {s1.image
                                ? <img src={s1.image} className="w-full h-full object-cover" alt="p1" />
                                : <div className="w-full h-full flex items-center justify-center">
                                    {round.id === "r16" ? <Plus className="w-4 h-4 text-white/20" /> : <Lock className="w-3 h-3 text-white/10" />}
                                  </div>}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-xs truncate text-white/90">{s1.name || (round.id === "r16" ? "Available" : "—")}</p>
                              <div className="flex items-center gap-1">
                                {s1.country && <span className="text-sm">{s1.country}</span>}
                                {s1.score ? <span className="text-[9px] text-primary font-black">{s1.score}/100</span> : null}
                              </div>
                            </div>
                            {s1.winner && <Crown className="w-4 h-4 text-yellow shrink-0" />}
                            {bothFilled && <Eye className="w-3 h-3 text-white/20 shrink-0" />}
                          </motion.div>

                          {/* VS Divider */}
                          <div className="flex items-center justify-center h-5 bg-white/[0.02] border-x-2 border-white/5">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-[3px]">VS</span>
                          </div>

                          {/* Slot 2 */}
                          {s2 && (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              onClick={() => {
                                if (bothFilled) handlePairClick(s1, s2);
                                else handleSingleSlotClick(s2);
                              }}
                              className={`relative rounded-b-[24px] border-2 p-3 flex items-center gap-3 cursor-pointer transition-all overflow-hidden ${
                                s2.winner ? "bg-yellow/10 border-yellow" :
                                s2.userId ? "bg-white/5 border-white/10 hover:border-accent/30" :
                                round.id === "r16" ? "bg-white/5 border-dashed border-white/10 hover:border-primary/50" :
                                "bg-white/[0.02] border-dashed border-white/5 opacity-40 cursor-default"
                              }`}
                            >
                              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/30">
                                {s2.image
                                  ? <img src={s2.image} className="w-full h-full object-cover" alt="p2" />
                                  : <div className="w-full h-full flex items-center justify-center">
                                      {round.id === "r16" ? <Plus className="w-4 h-4 text-white/20" /> : <Lock className="w-3 h-3 text-white/10" />}
                                    </div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-xs truncate text-white/90">{s2.name || (round.id === "r16" ? "Available" : "—")}</p>
                                <div className="flex items-center gap-1">
                                  {s2.country && <span className="text-sm">{s2.country}</span>}
                                  {s2.score ? <span className="text-[9px] text-accent font-black">{s2.score}/100</span> : null}
                                </div>
                              </div>
                              {s2.winner && <Crown className="w-4 h-4 text-yellow shrink-0" />}
                              {bothFilled && <Eye className="w-3 h-3 text-white/20 shrink-0" />}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Connector */}
                {ri < rounds.length - 1 && (
                  <div className="flex items-center shrink-0 px-1 self-center">
                    <ChevronRight className="w-4 h-4 text-white/10" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════ */
  if (loading) return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-white/30 font-bold uppercase tracking-widest text-xs">جاري تحميل البطولة...</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div
          className="min-h-screen transition-colors duration-700 pb-24"
          style={{
            background: theme === "dark" ? "radial-gradient(ellipse at top, #111 0%, #000 100%)" :
                        theme === "pink" ? "radial-gradient(ellipse at top, #2a0020 0%, #0a000a 100%)" :
                        "radial-gradient(ellipse at top, #020d2e 0%, #010810 100%)",
          }}
        >
          {/* ═══════ HEADER ═══════ */}
          <div className="px-4 md:px-8 max-w-[1600px] mx-auto pt-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
              {/* Title */}
              <div className="flex items-center gap-6">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl border"
                  style={{ background: `linear-gradient(135deg, ${currentTheme.accent}22, ${currentTheme.accent}11)`, borderColor: `${currentTheme.accent}40` }}
                >
                  <Trophy className="w-10 h-10" style={{ color: currentTheme.accent }} />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white">كأس العالم للرسم</h1>
                  <p className="text-xs font-black uppercase tracking-[4px] mt-1" style={{ color: currentTheme.accent }}>Drawing World Cup · Season 2026</p>
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Timer */}
                <div className="glass-card px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/5">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">المدة المتبقية</p>
                    <p className="font-black text-sm text-white">7 أيام</p>
                  </div>
                </div>

                {/* Category Toggle */}
                <div className="glass-card flex rounded-2xl overflow-hidden border border-white/10">
                  <button
                    onClick={() => setCategory("pencil")}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase transition-all ${category === "pencil" ? "bg-white/10 text-white" : "text-white/30 hover:text-white"}`}
                  >
                    <Pencil className="w-4 h-4" /> رصاص
                  </button>
                  <button
                    onClick={() => setCategory("ink")}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase transition-all ${category === "ink" ? "bg-white/10 text-white" : "text-white/30 hover:text-white"}`}
                  >
                    <Droplets className="w-4 h-4" /> حبر
                  </button>
                </div>

                {/* Theme Switch */}
                <div className="glass-card flex rounded-2xl overflow-hidden border border-white/10">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as ThemeId)}
                      title={t.name}
                      className={`px-4 py-3 text-xs font-black transition-all ${theme === t.id ? "bg-white/10 text-white" : "text-white/30"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Hall of Fame Sidebar */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border"
                  style={{ borderColor: `${currentTheme.accent}40`, color: currentTheme.accent, background: `${currentTheme.accent}10` }}
                >
                  <LayoutList className="w-4 h-4" /> سجل الأبطال
                </button>

                {/* Admin Reset */}
                {isAdmin && (
                  <button
                    onClick={async () => { if (confirm("إعادة تعيين البطولة؟")) await bootstrapTournament(); }}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                  >
                    <ShieldAlert className="w-4 h-4" /> إعادة تعيين
                  </button>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-8 text-[10px] font-black text-white/30 uppercase tracking-widest">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> دور الـ ١٦: مفتوح للتسجيل</span>
              <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> باقي الأدوار: يتحكم بها المشرف</span>
              {isAdmin && <span className="flex items-center gap-2"><Crown className="w-3 h-3 text-yellow" /> <span className="text-yellow">وضع المشرف: انقر لإدارة المشارك أو تحديد النقاط</span></span>}
              <span className="flex items-center gap-2"><Eye className="w-3 h-3" /> اضغط على المواجهة لعرض الرسمات</span>
            </div>

            {/* ═══════ BRACKET ═══════ */}
            {renderBracket()}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MATCH VIEWER MODAL
        ══════════════════════════════════════════ */}
        <AnimatePresence>
          {viewMatch && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setViewMatch(null)}
                className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100]" />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 30 }}
                className="fixed inset-4 md:inset-8 z-[110] glass-card rounded-[48px] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
                style={{ maxHeight: "92vh" }}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-8 border-b border-white/5 shrink-0">
                  <div>
                    <h2 className="text-2xl font-black text-white">المواجهة المباشرة</h2>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{ROUND_DEFS.find(r => r.id === viewMatch.slot1.roundId)?.label}</p>
                  </div>
                  <button onClick={() => setViewMatch(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                  {/* Players Row */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 mb-10">
                    {/* Player 1 */}
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl overflow-hidden border-2 border-primary/30 shadow-xl shadow-primary/10">
                        {viewMatch.slot1.image
                          ? <img src={viewMatch.slot1.image} className="w-full h-full object-cover" alt="p1" />
                          : <div className="w-full h-full bg-primary/10 flex items-center justify-center"><Users className="w-8 h-8 text-primary/30" /></div>}
                      </div>
                      <div>
                        <p className="font-black text-lg text-white">{viewMatch.slot1.name}</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl">{viewMatch.slot1.country || "🌍"}</span>
                          <span className="text-[10px] text-white/30 font-black">{viewMatch.slot1.countryName}</span>
                        </div>
                        {viewMatch.slot1.gender && (
                          <span className="text-xs">{viewMatch.slot1.gender === "female" ? "👧 أنثى" : "👦 ذكر"}</span>
                        )}
                      </div>
                      {viewMatch.slot1.score != null && viewMatch.slot1.score > 0 && (
                        <div className="bg-primary/10 border border-primary/20 px-6 py-2 rounded-2xl">
                          <p className="text-3xl font-black text-primary">{viewMatch.slot1.score}<span className="text-sm text-white/30">/100</span></p>
                        </div>
                      )}
                      {viewMatch.slot1.scoreNote && (
                        <p className="text-xs text-white/40 text-center max-w-xs leading-relaxed">{viewMatch.slot1.scoreNote}</p>
                      )}
                      {viewMatch.slot1.winner && (
                        <div className="bg-yellow text-black text-xs font-black px-4 py-2 rounded-full flex items-center gap-1">
                          <Crown className="w-3 h-3" /> الفائز
                        </div>
                      )}
                    </div>

                    {/* VS */}
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="font-black italic text-white/30 text-lg">VS</span>
                      </div>
                    </div>

                    {/* Player 2 */}
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl overflow-hidden border-2 border-accent/30 shadow-xl shadow-accent/10">
                        {viewMatch.slot2.image
                          ? <img src={viewMatch.slot2.image} className="w-full h-full object-cover" alt="p2" />
                          : <div className="w-full h-full bg-accent/10 flex items-center justify-center"><Users className="w-8 h-8 text-accent/30" /></div>}
                      </div>
                      <div>
                        <p className="font-black text-lg text-white">{viewMatch.slot2.name}</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl">{viewMatch.slot2.country || "🌍"}</span>
                          <span className="text-[10px] text-white/30 font-black">{viewMatch.slot2.countryName}</span>
                        </div>
                        {viewMatch.slot2.gender && (
                          <span className="text-xs">{viewMatch.slot2.gender === "female" ? "👧 أنثى" : "👦 ذكر"}</span>
                        )}
                      </div>
                      {viewMatch.slot2.score != null && viewMatch.slot2.score > 0 && (
                        <div className="bg-accent/10 border border-accent/20 px-6 py-2 rounded-2xl">
                          <p className="text-3xl font-black text-accent">{viewMatch.slot2.score}<span className="text-sm text-white/30">/100</span></p>
                        </div>
                      )}
                      {viewMatch.slot2.scoreNote && (
                        <p className="text-xs text-white/40 text-center max-w-xs leading-relaxed">{viewMatch.slot2.scoreNote}</p>
                      )}
                      {viewMatch.slot2.winner && (
                        <div className="bg-yellow text-black text-xs font-black px-4 py-2 rounded-full flex items-center gap-1">
                          <Crown className="w-3 h-3" /> الفائز
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drawings Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 text-center">رسمة {viewMatch.slot1.name}</p>
                      <div className="rounded-[32px] overflow-hidden border border-white/10 bg-black/40 aspect-square">
                        {viewMatch.slot1.image
                          ? <img src={viewMatch.slot1.image} className="w-full h-full object-contain" alt="drawing1" />
                          : <div className="w-full h-full flex items-center justify-center opacity-10"><Trophy className="w-16 h-16" /></div>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-3 text-center">رسمة {viewMatch.slot2.name}</p>
                      <div className="rounded-[32px] overflow-hidden border border-white/10 bg-black/40 aspect-square">
                        {viewMatch.slot2.image
                          ? <img src={viewMatch.slot2.image} className="w-full h-full object-contain" alt="drawing2" />
                          : <div className="w-full h-full flex items-center justify-center opacity-10"><Trophy className="w-16 h-16" /></div>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════
            REGISTER MODAL
        ══════════════════════════════════════════ */}
        <AnimatePresence>
          {regSlot && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => !regUploading && closeReg()}
                className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100]" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="fixed inset-x-4 top-[8%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-[110] glass-card p-10 rounded-[48px] text-center border border-white/10 shadow-2xl"
              >
                <h3 className="text-4xl font-black mb-2 italic text-white tracking-tighter">تسجيل مشاركة</h3>
                <p className="text-white/30 text-xs font-bold mb-8 uppercase tracking-widest">دور الـ ١٦ · ارفع رسمتك للمنافسة</p>
                <div
                  onClick={() => !regUploading && fileInputRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-primary/20 rounded-[32px] mb-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-all bg-white/5 relative overflow-hidden group"
                >
                  {regPreview
                    ? <img src={regPreview} className="w-full h-full object-cover" alt="preview" />
                    : <>
                        <Upload className="w-10 h-10 text-primary animate-bounce mb-3" />
                        <p className="text-sm font-black uppercase tracking-widest text-white/50">اضغط لرفع الرسمة</p>
                      </>}
                  <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                </div>
                <div className="flex gap-4">
                  <button onClick={closeReg} disabled={regUploading}
                    className="flex-1 bg-white/5 hover:bg-white/10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">إلغاء</button>
                  <button onClick={handleRegister} disabled={!regBase64 || regUploading}
                    className="flex-1 bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all active:scale-95 disabled:opacity-40">
                    {regUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "تأكيد الانضمام"}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════
            ADMIN MODAL (score + advance + disqualify)
        ══════════════════════════════════════════ */}
        <AnimatePresence>
          {adminSlot && adminMatchData && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => !adminWorking && setAdminSlot(null)}
                className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100]" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-[110] glass-card p-10 rounded-[48px] border border-yellow/20 shadow-2xl shadow-yellow/10 overflow-y-auto"
                style={{ maxHeight: "90vh" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 bg-yellow/10 border border-yellow/20 px-4 py-2 rounded-full">
                    <Crown className="w-4 h-4 text-yellow" />
                    <span className="text-yellow font-black text-[10px] uppercase tracking-widest">لوحة تحكم المشرف</span>
                  </div>
                  <button onClick={() => setAdminSlot(null)} className="p-2 hover:bg-white/10 rounded-full">
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                {/* Artwork */}
                <div className="rounded-[32px] overflow-hidden border border-white/10 mb-4 h-48 bg-black/40">
                  {adminMatchData.image
                    ? <img src={adminMatchData.image} className="w-full h-full object-contain" alt="entry" />
                    : <div className="w-full h-full flex items-center justify-center opacity-10"><Trophy className="w-12 h-12" /></div>}
                </div>
                <h3 className="text-2xl font-black text-white text-center mb-1">{adminMatchData.name}</h3>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-2xl">{adminMatchData.country}</span>
                  <span className="text-xs text-white/30 font-black">{adminMatchData.countryName}</span>
                </div>

                {/* Score Panel */}
                <div className="bg-white/5 border border-white/5 rounded-[28px] p-6 mb-4 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">وضع النقاط (0-100)</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min={0} max={100} value={scoreInput}
                      onChange={e => setScoreInput(+e.target.value)}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-3xl font-black text-primary w-16 text-center">{scoreInput}</span>
                  </div>
                  <textarea
                    placeholder="سبب النقاط... (مثال: التفاصيل الدقيقة رائعة جداً، ولكن يحتاج تحسين التقنية...)"
                    value={scoreNoteInput}
                    onChange={e => setScoreNoteInput(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none placeholder:text-white/20 text-right"
                    dir="rtl"
                  />
                  <button onClick={setScore}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all">
                    حفظ النقاط والتقييم
                  </button>
                </div>

                {/* Advance */}
                {!adminMatchData.winner && ROUND_DEFS.findIndex(r => r.id === adminSlot.roundId) < ROUND_DEFS.length - 1 && (
                  <button onClick={advanceWinner} disabled={adminWorking}
                    className="w-full bg-yellow hover:bg-amber-400 text-black py-5 rounded-2xl font-black uppercase text-sm tracking-[2px] shadow-2xl shadow-yellow/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 mb-3">
                    {adminWorking ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Crown className="w-5 h-5" /> تأهيل للدور التالي</>}
                  </button>
                )}

                {adminMatchData.winner && (
                  <div className="w-full bg-yellow/10 border border-yellow/30 text-yellow py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 mb-3">
                    <Crown className="w-4 h-4" /> تم تأهيله للدور التالي
                  </div>
                )}

                <button onClick={disqualify} disabled={adminWorking}
                  className="w-full bg-red-500/10 border border-red-500/20 text-red-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-3">
                  <Trash2 className="w-4 h-4" /> إلغاء المشاركة وتفريغ المقعد
                </button>

                <button onClick={() => setAdminSlot(null)}
                  className="w-full bg-white/5 text-white/30 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 hover:bg-white/10 transition-colors">
                  إغلاق
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════
            HALL OF FAME SIDEBAR
        ══════════════════════════════════════════ */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { setSidebarOpen(false); setSelectedWinner(null); }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]" />
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full max-w-sm z-[110] bg-[#080808] border-l border-white/10 flex flex-col shadow-2xl"
              >
                {/* Sidebar Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-xl font-black text-white">سجل الأبطال</h3>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Hall of Champions · All Time</p>
                  </div>
                  <button onClick={() => { setSidebarOpen(false); setSelectedWinner(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Winner Detail View */}
                <AnimatePresence>
                  {selectedWinner && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute inset-0 bg-[#080808] z-10 flex flex-col"
                    >
                      <div className="p-6 border-b border-white/5 flex items-center gap-3">
                        <button onClick={() => setSelectedWinner(null)} className="p-2 hover:bg-white/10 rounded-xl">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <p className="font-black text-white">{selectedWinner.winnerName}</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="rounded-[32px] overflow-hidden border border-white/10 bg-black/40 aspect-square">
                          <img src={selectedWinner.drawingUrl} className="w-full h-full object-contain" alt="winning drawing" />
                        </div>
                        <div className="glass-card p-6 rounded-[28px] space-y-3 text-right">
                          <div className="flex items-center justify-between">
                            <span className="text-white/30 text-xs font-black uppercase">البطل</span>
                            <span className="font-black text-white">{selectedWinner.winnerName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/30 text-xs font-black uppercase">البلد</span>
                            <span className="flex items-center gap-2"><span className="text-xl">{selectedWinner.country || "🌍"}</span><span className="font-bold text-white">{selectedWinner.countryName}</span></span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/30 text-xs font-black uppercase">السنة</span>
                            <span className="font-black text-primary">{selectedWinner.year}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/30 text-xs font-black uppercase">البطولة</span>
                            <span className="font-bold text-white/60 text-xs">{selectedWinner.tournamentId}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {hallEntries.length === 0 && (
                    <div className="py-20 text-center opacity-20">
                      <Trophy className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">لا يوجد أبطال بعد</p>
                    </div>
                  )}
                  {hallEntries.map((entry, i) => (
                    <motion.button
                      key={entry.id}
                      whileHover={{ x: -4 }}
                      onClick={() => setSelectedWinner(entry)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-right"
                    >
                      <span className="text-white/20 font-black text-lg w-8 shrink-0">#{i + 1}</span>
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                        <img src={entry.drawingUrl} className="w-full h-full object-cover" alt="winner" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-white truncate">{entry.winnerName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{entry.country || "🌍"}</span>
                          <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{entry.year}</span>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-white/20 shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

      </DashboardLayout>
    </ProtectedRoute>
  );
}
