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

/** The full pool a product's relevant-specialty list is drawn from. Kept
 *  as one flat list (rather than a type per product) so a specialty
 *  chosen under one product still resolves to a label if the product
 *  changes later. */
export const SPECIALTIES = [
  { id: "endo", label: "Endocrinology" },
  { id: "cards", label: "Cardiology" },
  { id: "onc", label: "Oncology" },
  { id: "im", label: "Internal Medicine" },
  { id: "np", label: "Nurse Practitioner" },
  { id: "fm", label: "Family Medicine" },
  { id: "neph", label: "Nephrology" },
  { id: "pa", label: "Physician Assistant" },
  { id: "obm", label: "Obesity Medicine" },
  { id: "geri", label: "Geriatrics" },
  { id: "bs", label: "Bariatric Surgery" },
  { id: "hemonc", label: "Hematology-Oncology" },
  { id: "surgonc", label: "Surgical Oncology" },
  { id: "radonc", label: "Radiation Oncology" },
  { id: "palliative", label: "Palliative Care" },
  { id: "pulm", label: "Pulmonology" },
  { id: "allergy", label: "Allergy & Immunology" },
  { id: "derm", label: "Dermatology" },
  { id: "rheum", label: "Rheumatology" },
  { id: "psych", label: "Psychiatry" },
] as const;

/** Which specialties are plausibly relevant to each product — swapped in
 *  (with a brief shimmer) once the product and indication resolve, rather
 *  than showing one fixed list regardless of what's being discussed. */
const SPECIALTIES_BY_PRODUCT: Record<string, readonly string[]> = {
  glucovya: ["endo", "im", "fm", "cards", "neph", "obm", "np", "pa", "geri", "bs"],
  nephralin: ["neph", "im", "cards", "endo", "geri", "np", "pa", "fm"],
  cardivyn: ["cards", "im", "np", "pa", "fm", "neph", "geri", "endo"],
  oncovera: ["onc", "hemonc", "surgonc", "radonc", "palliative", "np", "pa", "im"],
  pulmorase: ["pulm", "allergy", "im", "fm", "np", "pa", "geri", "cards"],
  dermaclarix: ["derm", "rheum", "im", "np", "pa", "fm", "allergy", "psych"],
};

const DEFAULT_SPECIALTY_IDS = ["endo", "cards", "onc", "im", "np"];

export function specialtiesForProduct(productId: string | null) {
  const ids = (productId && SPECIALTIES_BY_PRODUCT[productId]) || DEFAULT_SPECIALTY_IDS;
  return ids.map((id) => SPECIALTIES.find((s) => s.id === id)!);
}

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
