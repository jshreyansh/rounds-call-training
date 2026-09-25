import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { AlertTriangle, Clock, Pause, Pill, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { Text, Label } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SwishxLogo } from "@/components/brand/logo";
import { useCallStore } from "@/store/call-store";
import { DOCTOR_PHOTO_URL, DURATIONS, MOODS, PRODUCTS } from "@/data/products";

const CALL_SECONDS = 32;

const MESSAGES = [
  { sender: "Dr. Reyes", time: "0:03", text: "I have about four minutes. What are you here to tell me about?", mine: false },
  { sender: "You", time: "0:11", text: "Thanks for the time. I wanted to walk you through Glucovya for your T2D patients who need more than metformin alone.", mine: true },
  { sender: "Dr. Reyes", time: "0:24", text: "I already have three GLP-1s on formulary. What makes this one different?", mine: false },
  { sender: "You", time: "0:38", text: "In the head-to-head trial, Glucovya showed a 1.5 to 1.8 percent A1C reduction versus placebo, and it has CV outcomes data in patients with established disease.", mine: true },
  { sender: "Dr. Reyes", time: "1:42", text: "And the GI tolerability? That's where I lose patients on this class.", mine: false },
  { sender: "You", time: "1:58", text: "This is basically guaranteed to help with weight loss too, and there's really no risk of pancreatitis with this one.", mine: true },
];

const CATEGORIES = [
  { label: "On-Label Claims", items: [
    { text: "Cited only the approved indication", pass: false },
    { text: "Used label-supported efficacy figures", pass: true },
  ]},
  { label: "Safety & Fair Balance", items: [
    { text: "Disclosed the pancreatitis caution", pass: false },
    { text: "Did not overstate safety", pass: false },
  ]},
  { label: "Objection Handling", items: [
    { text: "Backed response with label data", pass: true },
    { text: "Acknowledged before responding", pass: true },
  ]},
  { label: "Opening & Close", items: [
    { text: "Stated purpose clearly at open", pass: true },
    { text: "Ended with a clear next step", pass: false },
  ]},
];

const OBJECTIONS = [
  {
    time: "1:58",
    objection: "And the GI tolerability? That's where I lose patients on this class.",
    response: "This is basically guaranteed to help with weight loss too.",
    tag: "HIGH RISK · OFF-LABEL",
    tone: "danger" as const,
    labelNote: "Weight management is a separate indication; this call is scoped to Type 2 Diabetes only.",
  },
  {
    time: "1:58",
    objection: "(same exchange, continued)",
    response: "There's really no risk of pancreatitis with this one.",
    tag: "MODERATE RISK",
    tone: "warn" as const,
    labelNote: "The label states Glucovya has not been studied in patients with a history of pancreatitis. This should be disclosed, not dismissed.",
  },
];

function formatTime(totalSeconds: number) {
  const mm = Math.floor(totalSeconds / 60);
  const ss = Math.floor(totalSeconds % 60);
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

const listStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemRise: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: [0.2, 0.8, 0.2, 1] } },
};

export function ReportScreen() {
  const { drugId, indicationId, mood, duration } = useCallStore();
  const drug = PRODUCTS.find((d) => d.id === drugId) ?? PRODUCTS[0];
  const indication = drug.indications.find((i) => i.id === indicationId) ?? drug.indications[0];
  const moodLabel = MOODS.find((m) => m.id === mood)?.label ?? mood;
  const durationInfo = DURATIONS.find((d) => d.id === duration) ?? DURATIONS[1];

  const [scoring, setScoring] = useState(true);
  const [scoreShown, setScoreShown] = useState(0);
  const [tab, setTab] = useState<"feedback" | "claims">("feedback");
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const playTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const reveal = setTimeout(() => {
      const count = setInterval(() => {
        setScoreShown((s) => {
          const next = s + 6;
          if (next >= 82) {
            clearInterval(count);
            setScoring(false);
            return 82;
          }
          return next;
        });
      }, 60);
    }, 1300);
    return () => clearTimeout(reveal);
  }, []);

  useEffect(() => () => clearInterval(playTimer.current), []);

  function togglePlay() {
    if (playing) {
      clearInterval(playTimer.current);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    playTimer.current = setInterval(() => {
      setElapsed((s) => {
        const next = s + 1;
        if (next >= CALL_SECONDS) {
          clearInterval(playTimer.current);
          setPlaying(false);
          return CALL_SECONDS;
        }
        return next;
      });
    }, 900);
  }

  const scoreTone = scoreShown >= 70 ? "ok" : scoreShown >= 45 ? "warn" : "danger";
  const scoreBand = scoreShown >= 70 ? "Strong call" : scoreShown >= 45 ? "Needs work" : "At risk";
  const scoreDotClass = scoreTone === "ok" ? "bg-ok" : scoreTone === "warn" ? "bg-warn" : "bg-danger";
  const progressPct = useMemo(() => Math.round((elapsed / CALL_SECONDS) * 100), [elapsed]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas">
      <div className="shrink-0 border-b border-hair bg-card">
        <div className="flex h-[60px] items-center justify-between border-b border-hair px-10">
          <div className="flex items-center gap-4">
            <SwishxLogo className="h-5 w-auto" />
            <div className="h-4.5 w-px bg-hair" />
            <Text size="body-lg" weight="bold">Call Report</Text>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/call"><Label className="cursor-pointer hover:text-ink">Retry this call</Label></Link>
            <Link to="/setup"><Label className="cursor-pointer hover:text-ink">Try a harder persona</Label></Link>
            <Button size="sm">Share with Manager</Button>
          </div>
        </div>
        <div className="flex h-[54px] items-center justify-between px-10">
          <div className="flex items-center gap-2">
            <Chip size="md" iconLeft={<Pill className="size-3.5" />}>
              {drug.name.toUpperCase()} · {indication.label.toUpperCase()}
            </Chip>
            <Chip size="md" iconLeft={<img src={DOCTOR_PHOTO_URL} alt="" className="size-4 rounded-full object-cover" />}>
              DR. ALEX REYES
            </Chip>
            <Chip size="md" tone="brand">{moodLabel.toUpperCase()}</Chip>
            <Chip size="md" iconLeft={<Clock className="size-3.5" />}>
              {durationInfo.label.toUpperCase()} CALL · {durationInfo.time.toUpperCase()}
            </Chip>
            <Label>Sep 25, 2026</Label>
          </div>

          <AnimatePresence mode="wait">
            {scoring ? (
              <motion.div key="scoring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <span className="size-3 animate-spin rounded-full border-2 border-hair-2 border-t-brand" />
                <Label>Scoring in progress&hellip;</Label>
              </motion.div>
            ) : (
              <motion.div
                key="scored"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex items-center gap-2"
              >
                <span className={cn("size-2.5 rounded-full", scoreDotClass)} />
                <Text size="title" weight="bold" tabular className="font-mono">{scoreShown}/100</Text>
                <Label tone={scoreTone}>{scoreBand}</Label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Feedback / claims review */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-9 py-5">
          <div className="relative flex gap-7 border-b border-hair">
            <button
              type="button"
              onClick={() => setTab("feedback")}
              className="focus-ring relative pb-3 font-mono text-label uppercase tracking-wider"
            >
              <span className={tab === "feedback" ? "text-ink" : "text-ink-3"}>Feedback</span>
              {tab === "feedback" && (
                <motion.div layoutId="report-tab-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab("claims")}
              className="focus-ring relative pb-3 font-mono text-label uppercase tracking-wider"
            >
              <span className={tab === "claims" ? "text-ink" : "text-ink-3"}>Claims Review</span>
              {tab === "claims" && (
                <motion.div layoutId="report-tab-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />
              )}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {tab === "feedback" ? (
                <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">
                  {scoring ? (
                    <div className="flex flex-col gap-3">
                      <div className="shimmer h-3 w-2/5 rounded-glyph" />
                      <div className="shimmer h-16 rounded-control" />
                      <div className="shimmer h-3 w-1/3 rounded-glyph" />
                      <div className="shimmer h-16 rounded-control" />
                      <Label className="mt-2">Scorecard</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="shimmer h-24 rounded-panel" />
                        <div className="shimmer h-24 rounded-panel" />
                        <div className="shimmer h-24 rounded-panel" />
                        <div className="shimmer h-24 rounded-panel" />
                      </div>
                    </div>
                  ) : (
                    <motion.div variants={listStagger} initial="hidden" animate="show" className="flex flex-col gap-5">
                      <motion.div variants={itemRise}>
                        <Label>What to improve</Label>
                        <Text as="div" size="body-lg" leading="relaxed" className="mt-2">
                          <b>Overstated safety.</b> You told the doctor there was &ldquo;really no risk of pancreatitis.&rdquo; The label requires this be disclosed, not dismissed.<br />
                          <b>Claim outside the indication.</b> You mentioned weight loss on a call scoped to the Type 2 Diabetes indication.<br />
                          <b>No clear close.</b> The call ended without a concrete next step or follow-up ask.
                        </Text>
                      </motion.div>
                      <motion.div variants={itemRise}>
                        <Label>What went well</Label>
                        <Text as="div" size="body-lg" leading="relaxed" className="mt-2">
                          <b>Strong opener.</b> Clear, on-label efficacy statement in the first 30 seconds.<br />
                          <b>Handled the tolerability objection well</b>, citing the actual label-supported adverse event profile.
                        </Text>
                      </motion.div>
                      <motion.div variants={itemRise}>
                        <Label>Scorecard</Label>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          {CATEGORIES.map((cat) => {
                            const passed = cat.items.filter((i) => i.pass).length;
                            return (
                              <motion.div key={cat.label} variants={itemRise} className="rounded-panel border border-hair bg-card p-3.5">
                                <div className="flex items-baseline justify-between">
                                  <Text size="body-lg" weight="bold">{cat.label}</Text>
                                  <Text size="body" tone="subtle" tabular className="font-mono">{passed}/{cat.items.length}</Text>
                                </div>
                                <div className="mt-2 flex flex-col gap-1.5">
                                  {cat.items.map((it, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <Text size="body" weight="bold" tone={it.pass ? "ok" : "danger"}>{it.pass ? "✓" : "✗"}</Text>
                                      <Text size="body" leading="snug">{it.text}</Text>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="claims" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                  <Text size="body-lg" tone="subtle" leading="relaxed">
                    You opened with a clear efficacy claim, but introduced an off-label weight-loss mention and understated a labeled safety risk when the doctor pushed on tolerability.
                  </Text>

                  <Label>Doctor objections &amp; your responses</Label>
                  {OBJECTIONS.map((c, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="rounded-panel border border-hair bg-card p-3.5">
                        <Label>Dr. Reyes · {c.time}</Label>
                        <Text as="div" size="body-lg" className="mt-1 italic">&ldquo;{c.objection}&rdquo;</Text>
                      </div>
                      <div
                        className={cn(
                          "ml-5 rounded-panel border p-3.5",
                          c.tone === "danger" ? "border-danger-line bg-danger-bg" : "border-warn-line bg-warn-bg",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Label>You</Label>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-chip px-2 py-0.5 text-micro font-bold uppercase tracking-wider text-white",
                              c.tone === "danger" ? "bg-danger" : "bg-warn",
                            )}
                          >
                            <AlertTriangle className="size-3" />
                            {c.tag}
                          </span>
                        </div>
                        <Text as="div" size="body-lg" className="mt-1.5">&ldquo;{c.response}&rdquo;</Text>
                        <Text as="div" size="body" tone="subtle" leading="snug" className="mt-2">
                          Label supports: {c.labelNote}
                        </Text>
                      </div>
                    </div>
                  ))}

                  <Label className="mt-1">Discovery</Label>
                  <Text size="body-lg" tone="subtle" leading="relaxed">
                    No probing questions identified. Consider asking about the doctor's current GLP-1 prescribing volume before pitching.
                  </Text>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Recording + transcript */}
        <div className="flex w-[600px] shrink-0 flex-col gap-4 overflow-hidden border-l border-hair p-5">
          <div className="flex items-center gap-3.5 rounded-panel border border-hair bg-card p-3">
            <button
              type="button"
              aria-label={playing ? "Pause playback" : "Play recording"}
              onClick={togglePlay}
              className="focus-ring flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-white"
            >
              {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-px" />}
            </button>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-subtle">
              <motion.div
                className="h-full rounded-full bg-brand"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3, ease: "linear" }}
              />
            </div>
            <Text size="caption" tone="subtle" tabular className="whitespace-nowrap font-mono">
              {formatTime(elapsed)} / {formatTime(CALL_SECONDS)}
            </Text>
          </div>

          <Label>Transcript</Label>
          <motion.div
            variants={listStagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2.5 overflow-y-auto"
          >
            {MESSAGES.map((m, i) => (
              <motion.div key={i} variants={itemRise} className={cn("flex items-end gap-2", m.mine ? "justify-end" : "justify-start")}>
                {!m.mine && (
                  <img src={DOCTOR_PHOTO_URL} alt="" className="size-7 shrink-0 rounded-full object-cover" />
                )}
                <div
                  className={cn(
                    "max-w-[78%] rounded-panel border px-3.5 py-2.5",
                    m.mine ? "border-tint-line bg-tint" : "border-hair bg-card",
                  )}
                >
                  <div className={cn("flex items-baseline gap-2", m.mine && "flex-row-reverse")}>
                    <Text size="caption" weight="bold">{m.sender}</Text>
                    <Text size="micro" tone="faint" tabular className="font-mono">{m.time}</Text>
                  </div>
                  <Text as="div" size="body-lg" leading="normal" className="mt-0.5">{m.text}</Text>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
