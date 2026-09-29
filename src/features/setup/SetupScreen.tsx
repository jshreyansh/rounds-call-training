import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Pencil, Pill, Search, Syringe, Wind, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Text, Label } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { SwishxLogo } from "@/components/brand/logo";
import { AppShellMenuButton } from "@/components/layout/AppShell";
import { useCallStore } from "@/store/call-store";
import { DOCTOR_PERSONAS, DURATIONS, MOODS, PRODUCTS, type DoctorPersona } from "@/data/products";

const FREE_EMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/** How long the "generating doctor personas" shimmer runs once a drug and
 *  indication resolve. */
const PERSONA_GENERATE_MS = 9000;

function emailDomain(email: string) {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).trim().toLowerCase();
}

/** True once the viewport crosses into the desktop layout's own
 *  breakpoint. Read via matchMedia rather than left to CSS alone, so the
 *  two layouts below are true alternatives — only one ever mounts, so
 *  the persona video never plays twice at once. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
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

/** A stand-in for a real product photo — a route-appropriate icon on a
 *  tinted circle, in place of the plain two-letter initials, without
 *  pulling in an actual (and possibly copyrighted) stock photo. */
function RouteIcon({ route, className }: { route: string; className?: string }) {
  const Icon = route.includes("Oral") ? Pill : route.includes("Inhaled") ? Wind : Syringe;
  return <Icon className={className} />;
}

const MOBILE_STEPS = [
  { key: "product", label: "Product", heading: "Select the therapy area or drug for discussion." },
  { key: "details", label: "Details", heading: "Set the call details." },
  { key: "email", label: "Email", heading: "Add your email for the debrief." },
] as const;

/** The full-width bar AppShell renders above the sidebar — kept as its
 *  own component (rather than inline in the screen) so it can sit
 *  outside the [sidebar | content] row instead of being squeezed beside
 *  the sidebar's full height. Same content at every width; only the
 *  hamburger (self-hiding at lg+) varies. */
export function SetupScreenHeader() {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-hair px-4 sm:gap-3 sm:px-6 lg:px-10">
      <AppShellMenuButton />
      <SwishxLogo className="h-5 w-auto" />
    </div>
  );
}

export function SetupScreen() {
  const navigate = useNavigate();
  const store = useCallStore();
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileStep, setMobileStep] = useState(0);
  const isDesktop = useIsDesktop();

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
    // The first indication is always the recommended default — no reason
    // to make picking a drug a two-click affair when one of those clicks
    // has an obvious answer.
    store.setProduct(id, drug.indications[0].id);
    setSearchActive(false);
    setQuery("");
  }
  function resetProduct() {
    store.setProduct(null, null);
    setSearchActive(false);
    setQuery("");
  }

  // ---- Doctor persona generation — Alex Reyes is always available as
  // the default, but the other two doctors only "exist" once a drug and
  // indication are resolved, revealed after a shimmer that stands in for
  // the app generating personas suited to that drug. ----
  const [personaGenerating, setPersonaGenerating] = useState(false);
  const [personasRevealed, setPersonasRevealed] = useState(false);
  const resolvedProductKey = hasProduct ? `${selectedDrug!.id}:${store.indicationId}` : null;

  useEffect(() => {
    if (!resolvedProductKey) {
      setPersonaGenerating(false);
      setPersonasRevealed(false);
      return;
    }
    setPersonaGenerating(true);
    setPersonasRevealed(false);
    useCallStore.getState().setPersonaId(DOCTOR_PERSONAS[0].id);
    const t = setTimeout(() => {
      setPersonaGenerating(false);
      setPersonasRevealed(true);
    }, PERSONA_GENERATE_MS);
    return () => clearTimeout(t);
  }, [resolvedProductKey]);

  const selectedPersona = DOCTOR_PERSONAS.find((p) => p.id === store.personaId) ?? DOCTOR_PERSONAS[0];
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

  // ---- Shared question controls — the same markup, reused by the
  // desktop's all-at-once cards and the mobile stepper's one-at-a-time
  // screens, so the two layouts can never drift out of sync with
  // each other. ----

  function renderProductControls() {
    return (
      <>
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
                  className="absolute left-0 top-[54px] z-20 w-full overflow-hidden rounded-panel border border-hair bg-card shadow-float"
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
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-tint text-brand-deep">
                        <RouteIcon route={r.route} className="size-4" />
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
          // Two rows, not one wide one: the name sits top-left where
          // the eye already is after picking a drug, and the thing to
          // act on next — the indication — sits directly under it, in
          // the same reading path. The generic/company/route line is
          // reference info, not something to act on, so it's the one
          // pushed right. The edit control is an absolutely-positioned
          // icon in the corner rather than a flex sibling next to the
          // reference line — a text "Change" sharing that flex row
          // fought the reference line for width and could visually
          // collide with it once the line ran long, and the icon is
          // more compact besides.
          <div className="relative flex w-full items-start gap-3.5 rounded-panel border border-hair-2 bg-subtle py-3 pl-3.5 pr-11">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-tint text-brand-deep">
              <RouteIcon route={selectedDrug!.route} className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Text size="body-lg" weight="bold">{selectedDrug!.name}</Text>
                  <span className="inline-flex items-center gap-1 rounded-chip bg-ok-bg px-1.5 py-0.5 text-micro font-bold uppercase tracking-wide text-ok">
                    <Check className="size-2.5" /> Label current
                  </span>
                </div>
                <Text size="caption" tone="subtle">
                  {selectedDrug!.generic} · {selectedDrug!.company} · {selectedDrug!.route}
                </Text>
              </div>

              {/* The first indication is picked for you (labeled, not
                  silent) the moment the drug is — one less required
                  click, and still obviously changeable. */}
              {selectedDrug!.indications.length > 1 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {selectedDrug!.indications.map((ind, i) => (
                    <Chip
                      key={ind.id}
                      size="sm"
                      selected={ind.id === store.indicationId}
                      tone="brand"
                      onClick={() => store.setProduct(selectedDrug!.id, ind.id)}
                    >
                      {ind.id === store.indicationId && <Check className="size-2.5" />}
                      {ind.label}
                      {i === 0 && " (Recommended)"}
                    </Chip>
                  ))}
                </div>
              ) : (
                <Text as="div" size="body" tone="subtle" className="mt-1.5">
                  {selectedDrug!.indications[0].label}
                </Text>
              )}
            </div>

            <button
              type="button"
              onClick={resetProduct}
              aria-label="Change product"
              className="focus-ring absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full text-ink-3 hover:bg-card hover:text-brand-deep"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
        )}
      </>
    );
  }

  function renderDetailsControls() {
    return (
      <>
        <div>
          <Text size="label" weight="semibold" tone="muted" className="mb-1.5 block">Which doctor are you calling?</Text>
          {personaGenerating ? (
            <div className="flex flex-wrap gap-2">
              {DOCTOR_PERSONAS.map((p) => (
                <div key={p.id} className="shimmer h-8 w-36 rounded-chip" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(personasRevealed ? DOCTOR_PERSONAS : [DOCTOR_PERSONAS[0]]).map((p) => (
                <Chip
                  key={p.id}
                  size="lg"
                  selected={p.id === store.personaId}
                  tone="brand"
                  iconLeft={(
                    <img
                      src={p.photo}
                      alt=""
                      className={cn("size-5 rounded-full object-cover", p.placeholder && "opacity-70")}
                    />
                  )}
                  onClick={() => store.setPersonaId(p.id)}
                >
                  {p.name}
                </Chip>
              ))}
            </div>
          )}
          {personaGenerating && (
            <Text size="caption" tone="subtle" className="mt-1.5 block">
              Generating doctor personas for this drug&hellip;
            </Text>
          )}
        </div>

        <div>
          <Text size="label" weight="semibold" tone="muted" className="mb-1.5 block">Select in what mood are they?</Text>
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
          <Text size="label" weight="semibold" tone="muted" className="mb-1.5 block">How much time do you have?</Text>
          {/* Same flat chip family as the two questions above it,
              not a segmented control — one less visual pattern to
              learn, and a lot less vertical space than the old
              stacked label-over-time boxes. */}
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <Chip
                key={d.id}
                size="lg"
                selected={d.id === store.duration}
                tone="brand"
                onClick={() => store.setDuration(d.id)}
              >
                {d.label} · {d.time}
              </Chip>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderConsentToggle() {
    return (
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
    );
  }

  return isDesktop
    ? (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas">
        <div className="flex min-h-0 flex-1 gap-4 overflow-y-auto px-5 pb-28 pt-5">
          {/* The form itself */}
          <div className="flex flex-1 flex-col gap-5">
            {/* Q1 — product */}
            <div className="relative z-10 rounded-card border border-hair bg-card p-4 shadow-hair">
              <DoneBadge done={hasProduct} />
              <div className="mb-2.5 flex items-baseline gap-3">
                <StepMark done={hasProduct} mark="1" />
                <Text as="div" size="title" weight="semibold">
                  Select the therapy area or drug for discussion.
                </Text>
              </div>

              {/* Indented to the same left edge as the heading text (past
                  the step-number circle + its gap), not the card's own
                  padding edge. A fixed-height slot for whichever state is
                  showing, so resolving the product never shifts every
                  card below it down the page. */}
              <div className="flex min-h-[76px] items-center pl-9">
                {renderProductControls()}
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

              {/* Same left indent as Q1 and Q3's body — aligned under the
                  heading text, not the step-number circle. Generous gap
                  between the three questions here specifically, since
                  this is the one card carrying three separate asks
                  rather than one. */}
              <div className="flex flex-col gap-6 pl-9">
                {renderDetailsControls()}
              </div>
            </div>

            {/* Q3 — email */}
            <div className="relative rounded-card border border-hair bg-card p-4 shadow-hair">
              <DoneBadge done={hasValidEmail && store.consented} />
              {/* The field rides the same line as the question rather
                  than a row of its own below it. */}
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <div className="flex items-baseline gap-3">
                  <StepMark done={hasValidEmail && store.consented} mark="3" />
                  <Text as="div" size="title" weight="medium" className="italic">
                    Add your email for the debrief.
                  </Text>
                </div>
                {/* Field's own wrapper is a hardcoded w-full, which — in a
                    wrapped flex row — always claims the whole row's width
                    and forces itself onto its own line no matter what
                    className reaches the input inside it. A fixed-width,
                    non-growing wrapper around it is what actually keeps
                    it beside the heading. */}
                <div className="w-[280px] shrink-0">
                  <Field
                    type="email"
                    aria-label="Work email"
                    placeholder="you@company.com"
                    size="sm"
                    error={emailError}
                    value={store.email}
                    onChange={(e) => store.setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-start gap-4 pl-9">
                {renderConsentToggle()}
              </div>
            </div>
          </div>

          {/* Who you're about to meet — a profile card, not a data
              sheet. The persona plays on loop here (muted, so it never
              fights the call audio), and swaps with the role picked
              above — a keyed remount rather than just changing `src`,
              since some browsers won't reload an already-playing video
              on a bare src change. Every other screen uses the matching
              still photo instead. The details ride a frosted glass
              panel rising from the bottom, the way a share-profile card
              works. Desktop-only — mobile carries its own compact
              version instead of shrinking this one. */}
          <div className="relative flex h-[560px] w-[350px] shrink-0 flex-col self-start overflow-hidden rounded-card border border-hair shadow-hair">
            {/* While personas are being generated the card has nobody to
                show yet, so it shimmers too — the picker alone going
                quiet reads as a glitch when the face beside it is still
                confidently showing the previous doctor. */}
            {personaGenerating ? (
              <div className="flex size-full flex-col items-center justify-center gap-2 bg-subtle">
                <div className="shimmer absolute inset-0" />
                <span className="relative size-7 animate-spin rounded-full border-2 border-hair-2 border-t-brand" />
                <Text size="body" weight="semibold" tone="subtle" className="relative">
                  Generating personas&hellip;
                </Text>
              </div>
            ) : (
              <>
                {selectedPersona.video ? (
                  <video
                    key={selectedPersona.id}
                    src={selectedPersona.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 size-full object-cover"
                    style={{ objectPosition: "center 75%" }}
                  />
                ) : (
                  <img
                    key={selectedPersona.id}
                    src={selectedPersona.photo}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                )}

                {/* A dark scrim at the top so the eyebrow stays legible
                    over whatever part of the photo lands there. */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />

                {/* The frosted glass itself: two upward-fading layers,
                    one for the blur and one for the white tint, so the
                    glass tapers into the photo instead of ending in a
                    hard line. Kept short (under half the card) so most
                    of the photo stays a photo. */}
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
                      <Text size="subhead" weight="bold">{selectedPersona.name}</Text>
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-ok text-white">
                        <Check className="size-2.5" />
                      </span>
                    </div>
                    <Text size="body" tone="subtle">{selectedPersona.specialty}</Text>
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
              </>
            )}
          </div>
        </div>

        {/* The one place the call actually starts. Rather than a
            hard-edged bar (which clips whatever card ends up behind it)
            or a fully invisible one (which lets that card's own edge
            run right under the button), it fades in as frosted glass. */}
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
    )
    : (
      <MobileSetupFlow
        step={mobileStep}
        setStep={setMobileStep}
        selectedPersona={selectedPersona}
        personaGenerating={personaGenerating}
        moodLabel={moodLabel}
        durationInfo={durationInfo}
        hasProduct={hasProduct}
        hasValidEmail={hasValidEmail}
        consented={store.consented}
        canStart={canStart}
        onStart={() => navigate("/call")}
        renderProductControls={renderProductControls}
        renderDetailsControls={renderDetailsControls}
        renderConsentToggle={renderConsentToggle}
        emailField={(
          <Field
            type="email"
            aria-label="Work email"
            placeholder="you@company.com"
            size="md"
            error={emailError}
            value={store.email}
            onChange={(e) => store.setEmail(e.target.value)}
          />
        )}
      />
    );
}

/** The mobile/tablet experience: a step-by-step wizard, not the desktop
 *  layout squeezed narrower. Jakob's Law — a long scroll of stacked
 *  cards is our invention, but "one question per screen with a progress
 *  bar and Back/Next" is a pattern almost everyone already knows how to
 *  use, from Typeform to any app's own onboarding. The persona rides
 *  along as a small persistent card up top instead of a tall portrait
 *  banner, which was the thing actually getting cropped badly at this
 *  width. */
function MobileSetupFlow({
  step, setStep, selectedPersona, personaGenerating, moodLabel, durationInfo,
  hasProduct, hasValidEmail, consented, canStart, onStart,
  renderProductControls, renderDetailsControls, renderConsentToggle, emailField,
}: {
  step: number;
  setStep: (fn: (s: number) => number) => void;
  selectedPersona: DoctorPersona;
  personaGenerating: boolean;
  moodLabel: string;
  durationInfo: (typeof DURATIONS)[number];
  hasProduct: boolean;
  hasValidEmail: boolean;
  consented: boolean;
  canStart: boolean;
  onStart: () => void;
  renderProductControls: () => React.ReactNode;
  renderDetailsControls: () => React.ReactNode;
  renderConsentToggle: () => React.ReactNode;
  emailField: React.ReactNode;
}) {
  const stepDone = [hasProduct, true, hasValidEmail && consented];
  const isLastStep = step === MOBILE_STEPS.length - 1;
  const nextDisabled = step === 0 ? !hasProduct : false;
  const hint = step === 0 && !hasProduct
    ? "Choose a product to continue."
    : isLastStep && !canStart
      ? !hasValidEmail ? "Add your work email to continue." : "Confirm the simulation note to continue."
      : "";

  function goNext() {
    if (isLastStep) {
      if (canStart) onStart();
      return;
    }
    if (!nextDisabled) setStep((s) => Math.min(s + 1, MOBILE_STEPS.length - 1));
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-canvas">
      {/* A compact, persistent identity card — a circular thumbnail
          crops forgivingly at any size, unlike trying to shrink a tall
          full-bleed portrait into a short banner. The bar itself stays
          full-bleed (border, background); only its content is capped and
          centered, so a tablet-width screen doesn't stretch it thin. */}
      <div className="flex shrink-0 items-center border-b border-hair bg-card px-4 py-3">
        <div className="mx-auto flex w-full max-w-xl items-center gap-3">
          {/* While personas are being generated this bar has nobody to
              show yet, so it shimmers like the picker and the desktop
              profile card rather than holding up the previous doctor. */}
          {personaGenerating ? (
            <>
              <div className="shimmer size-12 shrink-0 rounded-full bg-subtle" />
              <div className="min-w-0 flex-1">
                <Text as="div" size="body" weight="semibold" tone="subtle">Generating personas&hellip;</Text>
                <div className="shimmer mt-1.5 h-2.5 w-24 rounded-glyph bg-subtle" />
              </div>
            </>
          ) : (
            <>
              <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-hair-2 bg-subtle">
                {selectedPersona.video ? (
                  <video
                    key={selectedPersona.id}
                    src={selectedPersona.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 size-full object-cover"
                    style={{ objectPosition: "center 18%" }}
                  />
                ) : (
                  <img key={selectedPersona.id} src={selectedPersona.photo} alt="" className="absolute inset-0 size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Text size="body" weight="bold" truncate>{selectedPersona.name}</Text>
                  <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-ok text-white">
                    <Check className="size-2" />
                  </span>
                </div>
                <Text size="caption" tone="subtle">{selectedPersona.specialty}</Text>
              </div>
            </>
          )}
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            <Chip tone="brand" size="xs">{moodLabel}</Chip>
            <Chip size="xs">{durationInfo.label}</Chip>
          </div>
        </div>
      </div>

      {/* Progress — three segments, current one filled, done ones
          checked. Tapping any segment jumps straight there, since
          reviewing or fixing an earlier answer shouldn't require
          stepping back through everything in between. */}
      <div className="mx-auto flex w-full max-w-xl shrink-0 items-center gap-2 px-4 pt-3">
        {MOBILE_STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStep(() => i)}
            className="focus-ring flex flex-1 flex-col items-center gap-1.5 pb-1"
          >
            <span
              className={cn(
                "h-1.5 w-full rounded-full transition-colors",
                i === step ? "bg-brand" : stepDone[i] ? "bg-ok" : "bg-hair-2",
              )}
            />
            <Text
              size="micro"
              weight={i === step ? "bold" : "medium"}
              tone={i === step ? "brand-deep" : stepDone[i] ? "default" : "subtle"}
            >
              {s.label}
            </Text>
          </button>
        ))}
      </div>

      <div className="mx-auto min-h-0 w-full max-w-xl flex-1 overflow-y-auto px-4 pb-6 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Text as="div" size="title" weight="bold" className="mb-4">
              {MOBILE_STEPS[step].heading}
            </Text>

            {step === 0 && renderProductControls()}

            {step === 1 && (
              <div className="flex flex-col gap-6">
                {renderDetailsControls()}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                {emailField}
                {renderConsentToggle()}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* A plain bottom bar, not the desktop's floating glass button —
          a wizard's primary action belongs fixed to the nav, where
          people already expect Back/Next to live. */}
      <div className="flex shrink-0 flex-col gap-1.5 border-t border-hair bg-card px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-1.5">
          {hint && <Text size="caption" tone="subtle" className="text-center">{hint}</Text>}
          {/* The primary button takes the leftover space with flex-1,
              not `fullWidth` — a w-full child in a flex row claims the
              whole row and pushes itself past the edge once Back is
              beside it. */}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
                className="shrink-0"
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
            )}
            <Button
              size="md"
              disabled={isLastStep ? !canStart : nextDisabled}
              onClick={goNext}
              className="min-w-0 flex-1"
            >
              {isLastStep ? "Start the call" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
