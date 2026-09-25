import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Text, Label } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { SwishxLogo } from "@/components/brand/logo";
import { useCallStore } from "@/store/call-store";
import {
  DOCTOR_NAME, DURATIONS, MOODS, PRODUCTS, SPECIALTIES, initialsOf,
  specialtiesForProduct,
} from "@/data/products";

const FREE_EMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

function emailDomain(email: string) {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).trim().toLowerCase();
}

function StepMark({ done, mark }: { done: boolean; mark: string }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-micro font-bold",
        done ? "bg-brand text-white" : "border border-hair-2 text-ink-3",
      )}
    >
      {mark}
    </span>
  );
}

/** The "this step is satisfied" signal, kept off the step's own number so
 *  a pre-filled default (e.g. the physician step, whose fields all start
 *  with a sensible value) doesn't read as "you already did something"
 *  where the number used to be. */
function DoneBadge({ done }: { done: boolean }) {
  if (!done) return null;
  return (
    <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-ok text-white shadow-hair">
      <Check className="size-3" />
    </span>
  );
}

/**
 * A chip row that measures its own available width and collapses to a
 * "+N" affordance rather than letting five specialty labels wrap
 * unpredictably. Clicking it reveals the rest, wrapping onto a second row —
 * everything below just flows down with it, since this is plain layout,
 * not an overlay.
 */
function OverflowChips({
  items, value, onChange,
}: {
  items: readonly { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);

  useEffect(() => {
    const GAP = 8;
    const MORE_WIDTH = 56;
    const recalc = () => {
      const available = containerRef.current?.clientWidth ?? 0;
      const chipEls = measureRef.current ? Array.from(measureRef.current.children) as HTMLElement[] : [];
      let used = 0;
      let count = 0;
      for (let i = 0; i < chipEls.length; i++) {
        const w = chipEls[i].getBoundingClientRect().width;
        const next = used + w + (i > 0 ? GAP : 0);
        const isLast = i === chipEls.length - 1;
        const reserve = isLast ? 0 : MORE_WIDTH + GAP;
        if (next + reserve > available) break;
        used = next;
        count = i + 1;
      }
      setVisibleCount(Math.max(1, count));
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [items]);

  const shown = expanded ? items : items.slice(0, visibleCount);
  const hidden = items.length - shown.length;

  return (
    <div className="relative">
      {/* Off-screen twin, used only to measure each chip's natural width. */}
      <div ref={measureRef} aria-hidden className="pointer-events-none absolute left-0 top-0 flex -translate-y-full gap-2 opacity-0">
        {items.map((item) => (
          <Chip key={item.id} size="lg" className="shrink-0">{item.label}</Chip>
        ))}
      </div>

      <div ref={containerRef} className={cn("flex gap-2", expanded ? "flex-wrap" : "flex-nowrap overflow-hidden")}>
        {shown.map((item) => (
          <Chip
            key={item.id}
            size="lg"
            selected={value === item.id}
            tone="brand"
            className="shrink-0"
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </Chip>
        ))}
        {!expanded && hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="focus-ring inline-flex shrink-0 items-center rounded-chip border border-dashed border-hair-2 px-2.5 py-1 text-label font-semibold text-ink-3 hover:bg-subtle hover:text-ink"
          >
            +{hidden}
          </button>
        )}
        {expanded && items.length > visibleCount && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="focus-ring shrink-0 self-center text-label font-semibold text-ink-3 underline decoration-hair-2 underline-offset-2 hover:text-ink"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

/** A 3-stop discrete slider — deliberately not a fourth chip row, so the
 *  call-length control reads differently from the two pick-one-of-a-set
 *  questions above it. */
function DurationSlider({
  value, onChange,
}: {
  value: string;
  onChange: (id: (typeof DURATIONS)[number]["id"]) => void;
}) {
  const index = Math.max(0, DURATIONS.findIndex((d) => d.id === value));
  const pct = (index / (DURATIONS.length - 1)) * 100;

  return (
    <div className="max-w-[260px]">
      <div className="relative flex items-center">
        <input
          type="range"
          min={0}
          max={DURATIONS.length - 1}
          step={1}
          value={index}
          onChange={(e) => onChange(DURATIONS[Number(e.target.value)].id)}
          aria-label="Call length"
          className={cn(
            "h-1.5 w-full cursor-pointer appearance-none rounded-full",
            "[&::-webkit-slider-thumb]:size-4.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow-brand-lift",
            "[&::-moz-range-thumb]:size-4.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-card [&::-moz-range-thumb]:bg-brand",
          )}
          style={{
            background: `linear-gradient(to right, var(--color-brand) ${pct}%, var(--color-subtle) ${pct}%)`,
          }}
        />
        {/* Stop markers on the track itself, so each of the three valid
            positions reads as a clickable target up close, not just a
            point somewhere along an otherwise-blank bar. */}
        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-between">
          {DURATIONS.map((d) => (
            <span key={d.id} className="size-1.5 rounded-full border-2 border-white bg-ink-3/60" />
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between">
        {DURATIONS.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange(d.id)}
            className="focus-ring flex flex-col items-center gap-0.5 px-1"
          >
            <Text size="caption" weight={i === index ? "bold" : "medium"} tone={i === index ? "brand-deep" : "subtle"}>
              {d.label}
            </Text>
            <Text size="micro" tone="faint">{d.time}</Text>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SetupScreen() {
  const navigate = useNavigate();
  const store = useCallStore();
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState("");

  const selectedDrug = useMemo(
    () => PRODUCTS.find((d) => d.id === store.drugId) ?? null,
    [store.drugId],
  );
  const drugChosen = Boolean(selectedDrug);
  const hasProduct = Boolean(selectedDrug && store.indicationId);
  const indication = hasProduct ? selectedDrug!.indications.find((i) => i.id === store.indicationId) : null;

  const q = query.trim().toLowerCase();
  const showDropdown = searchActive && q.length > 0;
  const searchResults = showDropdown
    ? PRODUCTS.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.generic.toLowerCase().includes(q) ||
          d.company.toLowerCase().includes(q) ||
          d.indications.some((i) => i.label.toLowerCase().includes(q)),
      )
    : [];

  function pickDrug(id: string) {
    const drug = PRODUCTS.find((d) => d.id === id)!;
    store.setProduct(id, drug.indications.length === 1 ? drug.indications[0].id : null);
    setSearchActive(false);
    setQuery("");
  }
  function resetProduct() {
    store.setProduct(null, null);
    setSearchActive(false);
    setQuery("");
  }

  const resolvedProductKey = hasProduct ? selectedDrug!.id : null;
  const [specialtyOptions, setSpecialtyOptions] = useState(() => specialtiesForProduct(null));
  const [specialtyLoading, setSpecialtyLoading] = useState(false);

  useEffect(() => {
    // Only reshuffle once the product question is actually resolved (drug
    // and indication both chosen) — that's the moment "who I'm calling"
    // is final enough to imply which specialties are plausible.
    if (!resolvedProductKey) {
      setSpecialtyOptions(specialtiesForProduct(null));
      setSpecialtyLoading(false);
      return;
    }
    setSpecialtyLoading(true);
    const t = setTimeout(() => {
      const next = specialtiesForProduct(resolvedProductKey);
      setSpecialtyOptions(next);
      setSpecialtyLoading(false);
      if (!next.some((s) => s.id === useCallStore.getState().specialty)) {
        useCallStore.getState().setSpecialty(next[0].id as never);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [resolvedProductKey]);

  const specialtyLabel = SPECIALTIES.find((s) => s.id === store.specialty)!.label;
  const moodLabel = MOODS.find((m) => m.id === store.mood)!.label;
  const durationInfo = DURATIONS.find((d) => d.id === store.duration)!;

  const emailEntered = store.email.trim().length > 0;
  const domain = emailDomain(store.email);
  const isFreeDomain = FREE_EMAIL_DOMAINS.has(domain);
  const hasValidEmail = emailEntered && domain.includes(".") && !isFreeDomain;
  const emailError = !emailEntered
    ? undefined
    : isFreeDomain
      ? "Please use your work email. Personal addresses aren't accepted here."
      : !domain.includes(".")
        ? "That doesn't look like a complete email address."
        : undefined;

  const canStart = hasProduct && hasValidEmail && store.consented;

  // Specific, not generic — a vague "complete all steps" is exactly what
  // let someone miss the indication chip sitting right under the drug
  // they'd already picked.
  const readinessMessage = !drugChosen
    ? "Choose a product above to continue."
    : !hasProduct
      ? `Choose an indication for ${selectedDrug!.name} above to continue.`
      : !emailEntered
        ? "Add your work email above to continue."
        : !hasValidEmail
          ? "Fix your email above to continue."
          : !store.consented
            ? "Confirm the simulation note above to continue."
            : "";

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-canvas">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-hair px-10">
        <div className="flex items-center gap-3">
          <SwishxLogo className="h-5 w-auto" />
          <div className="h-4 w-px bg-hair" />
          <Text size="body-lg" weight="bold">AI Sales Roleplay Setup</Text>
        </div>
        <Text size="body" tone="subtle">New practice call</Text>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-y-auto px-5 pb-28 pt-5">
        {/* The form itself */}
        <div className="flex flex-1 flex-col gap-3">
          {/* Q1 — product */}
          <div className="relative z-10 rounded-card border border-hair bg-card p-4 shadow-hair">
            <DoneBadge done={hasProduct} />
            <div className="mb-2.5 flex items-baseline gap-3">
              <StepMark done={hasProduct} mark="1" />
              <Text as="div" size="title" weight="semibold">
                Select the therapy area or drug for discussion.
              </Text>
            </div>

            {/* A fixed-height slot for whichever state is showing, so
                resolving the product never shifts every card below it
                down the page — the empty search state just gets to
                breathe a little more inside the same footprint. */}
            <div className="flex min-h-[76px] items-center">
            {!drugChosen && (
              <div className="relative w-full max-w-[520px]">
                <Field
                  iconLeft={<Search className="size-4.5" />}
                  placeholder="Search by brand, generic, company, or indication"
                  aria-label="Search for a product"
                  size="md"
                  value={query}
                  onFocus={() => setSearchActive(true)}
                  onChange={(e) => {
                    setSearchActive(true);
                    setQuery(e.target.value);
                  }}
                />

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.99 }}
                      transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
                      className="absolute left-0 top-[54px] z-20 w-[480px] overflow-hidden rounded-panel border border-hair bg-card shadow-float"
                    >
                      {searchResults.length === 0 && (
                        <div className="p-4">
                          <Text size="body" tone="subtle">No products match that search.</Text>
                        </div>
                      )}
                      {searchResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => pickDrug(r.id)}
                          className="focus-ring flex w-full items-center gap-3 border-b border-hair px-3.5 py-2.5 text-left hover:bg-subtle"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-ink font-semibold text-body text-white">
                            {initialsOf(r.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <Text as="div" size="body-lg" weight="bold" truncate>{r.name}</Text>
                            <Text as="div" size="caption" tone="subtle" truncate>{r.generic} · {r.company}</Text>
                          </span>
                          <Label className="rounded-glyph bg-subtle px-1.5 py-0.5">{r.route}</Label>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {drugChosen && (
              // One compact row, not a stacked section: the indication
              // choice sits right next to the product info it belongs to,
              // so it's never a second, easy-to-miss step below the fold.
              <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-panel border border-hair-2 bg-subtle px-3.5 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-ink text-body-lg font-semibold text-white">
                  {initialsOf(selectedDrug!.name)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Text size="body-lg" weight="bold">{selectedDrug!.name}</Text>
                    <span className="inline-flex items-center gap-1 rounded-chip bg-ok-bg px-1.5 py-0.5 text-micro font-bold uppercase tracking-wide text-ok">
                      <Check className="size-2.5" /> Label current
                    </span>
                  </div>
                  <Text as="div" size="caption" tone="subtle">
                    {selectedDrug!.generic} · {selectedDrug!.company} · {selectedDrug!.route}
                  </Text>
                </div>

                {selectedDrug!.indications.length > 1 ? (
                  <div className="flex flex-wrap items-center gap-1.5 border-l border-hair-2 pl-4">
                    {selectedDrug!.indications.map((ind) => (
                      <Chip
                        key={ind.id}
                        size="sm"
                        selected={ind.id === store.indicationId}
                        tone="brand"
                        onClick={() => store.setProduct(selectedDrug!.id, ind.id)}
                      >
                        {ind.id === store.indicationId && <Check className="size-2.5" />}
                        {ind.label}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <Text size="body" tone="subtle" className="border-l border-hair-2 pl-4">
                    {selectedDrug!.indications[0].label}
                  </Text>
                )}

                <button type="button" onClick={resetProduct} className="focus-ring ml-auto shrink-0">
                  <Text size="label" weight="semibold" tone="brand-deep" className="cursor-pointer">
                    Change
                  </Text>
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Q2 — physician */}
          <div className="relative rounded-card border border-hair bg-card p-4 shadow-hair">
            <DoneBadge done />
            <div className="mb-2.5 flex items-baseline gap-3">
              <StepMark done mark="2" />
              <Text as="div" size="title" weight="medium" className="italic">
                Set the call details.
              </Text>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <Text size="label" weight="semibold" tone="muted" className="mb-1.5 block">Specialty</Text>
                {specialtyLoading ? (
                  <div className="flex gap-2">
                    {[72, 88, 84, 96, 78].map((w, i) => (
                      <div key={i} className="shimmer h-[30px] rounded-chip" style={{ width: w }} />
                    ))}
                  </div>
                ) : (
                  <OverflowChips items={specialtyOptions} value={store.specialty} onChange={(v) => store.setSpecialty(v as typeof store.specialty)} />
                )}
              </div>

              <div>
                <Text size="label" weight="semibold" tone="muted" className="mb-1.5 block">How will they receive you</Text>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <Chip
                      key={m.id}
                      size="lg"
                      selected={m.id === store.mood}
                      tone="brand"
                      iconLeft={(
                        <span aria-hidden style={{ fontFamily: "'Noto Emoji', sans-serif" }}>
                          {m.emoji}
                        </span>
                      )}
                      onClick={() => store.setMood(m.id)}
                    >
                      {m.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Text size="label" weight="semibold" tone="muted" className="mb-1.5 block">How much time do you have</Text>
                <DurationSlider value={store.duration} onChange={store.setDuration} />
              </div>
            </div>
          </div>

          {/* Q3 — email */}
          <div className="relative rounded-card border border-hair bg-card p-4 shadow-hair">
            <DoneBadge done={hasValidEmail && store.consented} />
            <div className="mb-2 flex items-baseline gap-3">
              <StepMark done={hasValidEmail && store.consented} mark="3" />
              <Text as="div" size="title" weight="medium" className="italic">
                Add your email for the debrief.
              </Text>
            </div>
            <div className="mt-3 flex flex-wrap items-start gap-4">
              <Field
                type="email"
                aria-label="Work email"
                placeholder="you@company.com"
                size="sm"
                className="w-[280px]"
                error={emailError}
                value={store.email}
                onChange={(e) => store.setEmail(e.target.value)}
              />
              <button
                type="button"
                onClick={store.toggleConsent}
                className="focus-ring flex max-w-[420px] items-start gap-2 pt-2.5 text-left"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-glyph border text-micro text-white",
                    store.consented ? "border-brand bg-brand" : "border-hair-2 bg-card",
                  )}
                >
                  {store.consented && <Check className="size-2.5" />}
                </span>
                <Text size="micro" tone="subtle" leading="snug">
                  Training simulation. Responses may be reviewed for coaching.
                </Text>
              </button>
            </div>
          </div>
        </div>

        {/* Who you're about to meet — a profile card, not a data sheet.
            The persona plays on loop here (muted, so it never fights the
            call audio); every other screen still uses the plain still
            photo. The details ride a frosted glass panel rising from the
            bottom, the way a share-profile card works, rather than
            sitting on a plain white sheet. */}
        <div className="relative flex h-[560px] w-[350px] shrink-0 self-start flex-col overflow-hidden rounded-card border border-hair shadow-hair">
          <video
            src="/doctor-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: "center 75%" }}
          />

          {/* A dark scrim at the top so the eyebrow stays legible over
              whatever part of the photo lands there. */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />

          {/* The frosted glass itself: two upward-fading layers, one for
              the blur and one for the white tint, so the glass tapers
              into the photo instead of ending in a hard line. Kept short
              (under half the card) so most of the photo stays a photo. */}
          <div
            className="absolute inset-x-0 bottom-0 h-[52%] backdrop-blur-2xl"
            style={{
              maskImage: "linear-gradient(to top, black 45%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to top, black 45%, transparent 100%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-[56%] bg-gradient-to-t from-white/95 via-white/75 to-transparent" />

          <div className="relative z-10 p-4">
            <Label className="text-white/90 drop-shadow-sm">Who you're about to meet</Label>
            <Text
              as="div"
              size="body"
              weight="bold"
              tone="inverse"
              className={cn("mt-1 drop-shadow-sm", !hasProduct && "font-normal italic text-white/70")}
            >
              {hasProduct ? `${selectedDrug!.name} · ${indication!.label}` : "Not selected yet"}
            </Text>
          </div>

          <div className="flex-1" />

          <div className="relative z-10 flex flex-col gap-2.5 p-4 pt-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Text size="subhead" weight="bold">{DOCTOR_NAME}</Text>
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-ok text-white">
                  <Check className="size-2.5" />
                </span>
              </div>
              <Text size="body" tone="subtle">{specialtyLabel}</Text>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Chip tone="brand" size="sm">{moodLabel}</Chip>
              <Chip size="sm">{durationInfo.label} · {durationInfo.time}</Chip>
            </div>

            <div className="h-px bg-hair" />

            <Text size="caption" tone="subtle" leading="snug">
              Every claim gets checked against the current FDA label.
            </Text>
          </div>
        </div>
      </div>

      {/* The one place the call actually starts. Rather than a hard-edged
          bar (which clips whatever card ends up behind it) or a fully
          invisible one (which lets that card's own edge run right under
          the button), it fades in as frosted glass: a blurred layer and a
          canvas-tinted layer, each masked to taper to nothing well above
          the button, so cards scroll up *into* a glass floor instead of
          a wall. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32">
        <div
          className="absolute inset-0 backdrop-blur-xl"
          style={{
            maskImage: "linear-gradient(to top, black 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/70 to-transparent"
          style={{
            maskImage: "linear-gradient(to top, black 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 100%)",
          }}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 pb-6 pt-1">
        {!canStart && (
          <Text size="caption" tone="subtle" className="pointer-events-none">{readinessMessage}</Text>
        )}
        <Button
          size="md"
          disabled={!canStart}
          onClick={() => canStart && navigate("/call")}
          className="pointer-events-auto min-w-[220px] shadow-float"
        >
          Start the call
        </Button>
      </div>
    </div>
  );
}
