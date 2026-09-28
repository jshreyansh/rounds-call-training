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

/** Every call is with a doctor now — the old "who are you calling" role
 *  picker (decision maker / patient / caregiver / pharmacist) is gone.
 *  What varies instead is *which* doctor: a set of personas the app
 *  "generates" once a drug and indication are picked, since a rep
 *  pitching an oncologist needs a different doctor than one pitching an
 *  endocrinologist. Alex Reyes is the one persona with a real photo and
 *  video today and is always available immediately; the other two are
 *  placeholders (no photo/video yet) ready to swap in real assets. */
export interface DoctorPersona {
  id: string;
  name: string;
  specialty: string;
  video?: string;
  photo: string;
  /** No real photo/video yet — rendered with a generic silhouette and
   *  marked as pending rather than pretending to be a finished persona. */
  placeholder?: boolean;
}

export const DOCTOR_PERSONAS: DoctorPersona[] = [
  { id: "alex-reyes", name: "Dr. Alex Reyes", specialty: "Endocrinologist", video: "/doctor-video.mp4", photo: "/doctor-photo.jpg" },
  { id: "persona-2", name: "Doctor Persona 2", specialty: "Photo & video pending", photo: "/persona-placeholder.svg", placeholder: true },
  { id: "persona-3", name: "Doctor Persona 3", specialty: "Photo & video pending", photo: "/persona-placeholder.svg", placeholder: true },
];

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

