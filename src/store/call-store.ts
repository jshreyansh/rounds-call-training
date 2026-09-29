import { create } from "zustand";
import { CALLEE_ROLES, DURATIONS, MOODS } from "@/data/products";

type CalleeRoleId = (typeof CALLEE_ROLES)[number]["id"];
type MoodId = (typeof MOODS)[number]["id"];
type DurationId = (typeof DURATIONS)[number]["id"];

interface CallState {
  drugId: string | null;
  indicationId: string | null;
  calleeRole: CalleeRoleId;
  mood: MoodId;
  duration: DurationId;
  email: string;
  consented: boolean;

  setProduct: (drugId: string | null, indicationId: string | null) => void;
  setCalleeRole: (id: CalleeRoleId) => void;
  setMood: (id: MoodId) => void;
  setDuration: (id: DurationId) => void;
  setEmail: (email: string) => void;
  toggleConsent: () => void;
}

/** The one thing carried between Setup, Call and Report — who's being
 *  called and how. Everything ephemeral to a single screen (search text,
 *  call phase, mic state, playback position) stays local to that screen. */
export const useCallStore = create<CallState>((set) => ({
  drugId: null,
  indicationId: null,
  calleeRole: "doctor",
  mood: "skeptical",
  duration: "quick",
  email: "",
  consented: true,

  setProduct: (drugId, indicationId) => set({ drugId, indicationId }),
  setCalleeRole: (calleeRole) => set({ calleeRole }),
  setMood: (mood) => set({ mood }),
  setDuration: (duration) => set({ duration }),
  setEmail: (email) => set({ email }),
  toggleConsent: () => set((s) => ({ consented: !s.consented })),
}));
