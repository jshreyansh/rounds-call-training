import { create } from "zustand";
import { DOCTOR_PERSONAS, DURATIONS, MOODS } from "@/data/products";

type MoodId = (typeof MOODS)[number]["id"];
type DurationId = (typeof DURATIONS)[number]["id"];

interface CallState {
  drugId: string | null;
  indicationId: string | null;
  personaId: string;
  mood: MoodId;
  duration: DurationId;
  email: string;
  consented: boolean;

  setProduct: (drugId: string | null, indicationId: string | null) => void;
  setPersonaId: (id: string) => void;
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
  personaId: DOCTOR_PERSONAS[0].id,
  mood: "skeptical",
  duration: "quick",
  email: "",
  consented: true,

  setProduct: (drugId, indicationId) => set({ drugId, indicationId }),
  setPersonaId: (personaId) => set({ personaId }),
  setMood: (mood) => set({ mood }),
  setDuration: (duration) => set({ duration }),
  setEmail: (email) => set({ email }),
  toggleConsent: () => set((s) => ({ consented: !s.consented })),
}));
