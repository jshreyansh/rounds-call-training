export interface Indication {
  id: string;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  generic: string;
  company: string;
  route: string;
  recent: boolean;
  indications: Indication[];
}

export const PRODUCTS: Product[] = [
  {
    id: "glucovya",
    name: "Glucovya",
    generic: "semvatide",
    company: "Northfield Biopharma",
    route: "Injectable · Weekly",
    recent: true,
    indications: [
      { id: "t2d", label: "Type 2 Diabetes" },
      { id: "wm", label: "Chronic Weight Management" },
    ],
  },
  {
    id: "nephralin",
    name: "Nephralin",
    generic: "eplenostat",
    company: "Aldebaran Therapeutics",
    route: "Oral · Once daily",
    recent: true,
    indications: [{ id: "ckd", label: "Chronic Kidney Disease" }],
  },
  {
    id: "cardivyn",
    name: "Cardivyn",
    generic: "esomeprilat",
    company: "Meridian Pharma",
    route: "Oral · Once daily",
    recent: false,
    indications: [{ id: "htn", label: "Hypertension" }],
  },
  {
    id: "oncovera",
    name: "Oncovera",
    generic: "trastazumel",
    company: "Solara Oncology",
    route: "Infusion · Q3W",
    recent: false,
    indications: [
      { id: "bc", label: "HER2+ Metastatic Breast Cancer" },
      { id: "gc", label: "HER2+ Gastric Cancer" },
    ],
  },
  {
    id: "pulmorase",
    name: "Pulmorase",
    generic: "fenatriol",
    company: "Highmoor Respiratory",
    route: "Inhaled · Twice daily",
    recent: false,
    indications: [{ id: "asthma", label: "Asthma Maintenance" }],
  },
  {
    id: "dermaclarix",
    name: "Dermaclarix",
    generic: "adalimucept",
    company: "Verdant Biosciences",
    route: "Injectable · Monthly",
    recent: false,
    indications: [{ id: "pso", label: "Plaque Psoriasis" }],
  },
];

/** Who the rep is calling — this drives how the persona treats the pitch
 *  (a formulary conversation reads very differently from a bedside one),
 *  so it's asked directly rather than inferred from a specialty. Fixed
 *  regardless of product, unlike the old specialty list. */
export const CALLEE_ROLES = [
  { id: "doctor", label: "Doctor" },
  { id: "decision-maker", label: "Decision Maker" },
  { id: "patient", label: "Patient" },
  { id: "caregiver", label: "Caregiver" },
  { id: "pharmacist", label: "Pharmacist" },
] as const;

export const MOODS = [
  { id: "friendly", label: "Friendly", emoji: "🙂" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "busy", label: "Rushed", emoji: "😅" },
  { id: "skeptical", label: "Skeptical", emoji: "🤨" },
  { id: "hostile", label: "Hostile", emoji: "👹" },
] as const;

export const DURATIONS = [
  { id: "quick", label: "Quick", time: "2 min", seconds: 120 },
  { id: "standard", label: "Standard", time: "4 min", seconds: 240 },
  { id: "tough", label: "Tough", time: "8 min", seconds: 480 },
] as const;

export function initialsOf(name: string) {
  return name.slice(0, 2).toUpperCase();
}

/** Stand-in headshot for the AI persona — a supplied stock photo (not a
 *  real person), used everywhere Dr. Reyes appears: setup, the call
 *  stage, and the report. */
export const DOCTOR_PHOTO_URL = "/doctor-photo.jpg";
export const DOCTOR_NAME = "Dr. Alex Reyes";
