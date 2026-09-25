import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Pill, Search, Syringe, Wind, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Text, Label } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { SwishxLogo } from "@/components/brand/logo";
import { useCallStore } from "@/store/call-store";
import { CALLEE_ROLES, DURATIONS, MOODS, PRODUCTS } from "@/data/products";

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
 * "+N" affordance rather than letting a longer label like "Decision Maker"
 * force an unpredictable wrap. Clicking it reveals the rest, wrapping onto a second row —
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

/** A stand-in for a real product photo — a route-appropriate icon on a
 *  tinted circle, in place of the plain two-letter initials, without
 *  pulling in an actual (and possibly copyrighted) stock photo. */
function RouteIcon({ route, className }: { route: string; className?: string }) {
  const Icon = route.includes("Oral") ? Pill : route.includes("Inhaled") ? Wind : Syringe;
  return <Icon className={className} />;
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

  const calleeRoleInfo = CALLEE_ROLES.find((r) => r.id === store.calleeRole)!;
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
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-hair px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <SwishxLogo className="h-5 w-auto shrink-0" />
          <div className="h-4 w-px shrink-0 bg-hair" />
          <Text size="body-lg" weight="bold" truncate>AI Sales Roleplay Setup</Text>
        </div>
        <Text size="body" tone="subtle" className="hidden shrink-0 sm:block">New practice call</Text>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-28 pt-4 sm:px-5 sm:pt-5 lg:flex-row">
        {/* The form itself */}
        <div className="order-2 flex w-full flex-1 flex-col gap-5 lg:order-1">
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
                padding edge — otherwise the number reads as part of the
                body content instead of a marker beside it. A fixed-height
                slot for whichever state is showing, so resolving the
                product never shifts every card below it down the page —
                the empty search state just gets to breathe a little more
                inside the same footprint. */}
            <div className="flex min-h-[76px] items-center pl-9">
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
                between the three questions here specifically, since this
                is the one card carrying three separate asks rather than
                one. */}
            <div className="flex flex-col gap-6 pl-9">
              <div>
                <Text size="label" weight="semibold" tone="muted" className="mb-1.5 block">Who are you calling?</Text>
                <OverflowChips items={CALLEE_ROLES} value={store.calleeRole} onChange={(v) => store.setCalleeRole(v as typeof store.calleeRole)} />
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
            </div>
          </div>

          {/* Q3 — email */}
          <div className="relative rounded-card border border-hair bg-card p-4 shadow-hair">
            <DoneBadge done={hasValidEmail && store.consented} />
            {/* The field rides the same line as the question rather than
                a row of its own below it — the question is short enough
                that there's room, and it reads as one ask instead of a
                heading followed by a separate form field. */}
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
                  non-growing wrapper around it is what actually keeps it
                  beside the heading. */}
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
            call audio), and swaps with the role picked above — a keyed
            remount rather than just changing `src`, since some browsers
            won't reload an already-playing video on a bare src change.
            Every other screen uses the matching still photo instead.
            The details ride a frosted glass panel rising from the
            bottom, the way a share-profile card works, rather than
            sitting on a plain white sheet. Sits above the form on
            mobile/tablet as a shorter horizontal banner — the full tall
            portrait card only fits once there's a side column to put it
            in, at lg+. */}
        <div className="order-1 relative flex h-[280px] w-full shrink-0 flex-col overflow-hidden rounded-card border border-hair shadow-hair sm:h-[320px] lg:order-2 lg:h-[560px] lg:w-[350px] lg:self-start">
          <video
            key={calleeRoleInfo.id}
            src={calleeRoleInfo.video}
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

          <div className="relative z-10 flex flex-col gap-2 p-4 pt-2 sm:gap-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <Text size="subhead" weight="bold">{calleeRoleInfo.name}</Text>
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-ok text-white">
                  <Check className="size-2.5" />
                </span>
              </div>
              <Text size="body" tone="subtle">{calleeRoleInfo.label}</Text>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Chip tone="brand" size="sm">{moodLabel}</Chip>
              <Chip size="sm">{durationInfo.label} · {durationInfo.time}</Chip>
            </div>

            {/* Cut on shorter cards (mobile/tablet) — the trust line is a
                nice-to-have footnote, not something worth squeezing the
                name and chips above it for. */}
            <div className="hidden flex-col gap-2.5 sm:flex">
              <div className="h-px bg-hair" />
              <Text size="caption" tone="subtle" leading="snug">
                Every claim gets checked against the current FDA label.
              </Text>
            </div>
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
