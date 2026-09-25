import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Clock, Ear, Info, Mic, MicOff, PhoneOff, Pill, Volume2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Text, Label } from "@/components/ui/text";
import { Button, IconButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/patterns/sheet";
import { SwishxMark } from "@/components/brand/logo";
import { useCallStore } from "@/store/call-store";
import { CALLEE_ROLES, DURATIONS, MOODS, PRODUCTS } from "@/data/products";

type Phase = "connecting" | "live" | "wrap" | "ready";
type Speaker = "doctor" | "rep";

/** Reveal seconds are a compressed demo timeline, not the literal call
 *  length — this is a practice simulation, so the captions arrive at a
 *  pace someone can actually sit through, not the real 4 minutes. Who
 *  said each line is `mine`, not a baked-in name — the display name is
 *  whichever persona is currently selected, resolved at render time. */
const TRANSCRIPT = [
  { mine: false, at: 2, text: "I have about four minutes. What are you here to tell me about?" },
  { mine: true, at: 6, text: "Thanks for the time. I wanted to walk you through Glucovya for your T2D patients who need more than metformin alone." },
  { mine: false, at: 11, text: "I already have three GLP-1s on formulary. What makes this one different?" },
  { mine: true, at: 16, text: "In the head-to-head trial, Glucovya showed a 1.5 to 1.8 percent A1C reduction versus placebo, and it has CV outcomes data in patients with established disease." },
  { mine: false, at: 22, text: "And the GI tolerability? That's where I lose patients on this class." },
  { mine: true, at: 27, text: "This is basically guaranteed to help with weight loss too, and there's really no risk of pancreatitis with this one." },
];

/** Matches the demo score Report lands on after its own reveal animation
 *  — shown here already-settled, since by "Analysis complete" the score
 *  is done, not still counting up. */
const DEMO_SCORE = 82;

function formatTime(totalSeconds: number) {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** There's no real audio to analyze here, only simulated turn-taking — so
 *  rather than a flat on/off ring, each tile's "level" chases a jittery
 *  target while it's the active speaker and decays toward a soft ambient
 *  floor otherwise (never to nothing — a real presence ring, like a real
 *  call's tile glow, is never fully off), the same shape a real
 *  RMS-analyser value would have. */
const AMBIENT_FLOOR = 0.14;
function nextLevel(prev: number, active: boolean) {
  if (active) {
    const target = 0.55 + Math.random() * 0.4;
    return prev + (target - prev) * 0.35;
  }
  return prev + (AMBIENT_FLOOR - prev) * 0.15;
}

function levelGlow(level: number) {
  const edge = 2 + level * 2;
  const edgeAlpha = 0.35 + level * 0.5;
  const blur = 14 + level * 40;
  const spread = 2 + level * 8;
  const glowAlpha = 0.15 + level * 0.35;
  return `0 0 0 ${edge}px rgba(253,72,22,${edgeAlpha}), 0 0 ${blur}px ${spread}px rgba(253,72,22,${glowAlpha})`;
}

function SpeakingBadge({ size = "md" }: { size?: "sm" | "md" }) {
  const sm = size === "sm";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "absolute flex items-center gap-1 rounded-full bg-black/50 font-semibold text-live",
        sm ? "right-2.5 top-2.5 px-2 py-0.5 text-micro" : "right-3 top-3 px-2.5 py-1 text-micro sm:right-4 sm:top-4",
      )}
    >
      <motion.span
        className="flex items-center"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      >
        <Volume2 className={sm ? "size-2.5" : "size-3"} />
      </motion.span>
      Speaking
    </motion.div>
  );
}

export function CallScreen() {
  const navigate = useNavigate();
  const { drugId, indicationId, mood, duration, calleeRole } = useCallStore();
  const drug = PRODUCTS.find((d) => d.id === drugId) ?? PRODUCTS[0];
  const indication = drug.indications.find((i) => i.id === indicationId) ?? drug.indications[0];
  const moodInfo = MOODS.find((m) => m.id === mood) ?? MOODS[0];
  const durationInfo = DURATIONS.find((d) => d.id === duration) ?? DURATIONS[0];
  const persona = CALLEE_ROLES.find((r) => r.id === calleeRole) ?? CALLEE_ROLES[0];

  const [phase, setPhase] = useState<Phase>("connecting");
  const [briefOpen, setBriefOpen] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speaker, setSpeaker] = useState<Speaker>("doctor");
  const [doctorLevel, setDoctorLevel] = useState(0);
  const [repLevel, setRepLevel] = useState(0);

  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const speakerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const levelRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const speakerLatest = useRef<Speaker>("doctor");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setPhase("live");
      const joinSound = new Audio("/join.mp3");
      joinSound.volume = 0.6;
      joinSound.play().catch(() => {});
      tickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      speakerRef.current = setInterval(() => {
        setSpeaker((s) => {
          const next = s === "doctor" ? "rep" : "doctor";
          speakerLatest.current = next;
          return next;
        });
      }, 3600);
      levelRef.current = setInterval(() => {
        setDoctorLevel((v) => nextLevel(v, speakerLatest.current === "doctor"));
        setRepLevel((v) => nextLevel(v, speakerLatest.current === "rep"));
      }, 90);
    }, 2400);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(tickRef.current);
      clearInterval(speakerRef.current);
      clearInterval(levelRef.current);
    };
  }, []);

  const visibleTranscript = TRANSCRIPT.filter((m) => m.at <= elapsed);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleTranscript.length]);

  function endCall() {
    clearInterval(tickRef.current);
    clearInterval(speakerRef.current);
    clearInterval(levelRef.current);
    setPhase("wrap");
    setTimeout(() => setPhase("ready"), 2000);
  }

  const dimmed = phase === "wrap" || phase === "ready";
  const showTranscript = phase === "live" || dimmed;
  const scoreTone = DEMO_SCORE >= 70 ? "ok" : DEMO_SCORE >= 45 ? "warn" : "danger";
  const scoreDotClass = scoreTone === "ok" ? "bg-ok" : scoreTone === "warn" ? "bg-warn" : "bg-danger";

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-ink">
      {/* The meeting backdrop — a supplied portrait image, scrimmed enough
          that white text and glass tiles stay legible over any part of it. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img src="/call-stage-bg.jpg" alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/50" />
      </div>

      <div className="relative z-10 flex h-12 shrink-0 items-center justify-between px-4 sm:h-14 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <IconButton aria-label="Back to setup" tone="onDark" onClick={() => navigate("/setup")}>
            <ArrowLeft className="size-4" />
          </IconButton>
          {phase !== "connecting" && (
            <div className="flex items-center gap-2">
              <span className="size-1.5 animate-pulse rounded-full bg-danger" />
              <Text size="body-lg" tone="inverse" tabular className="font-mono">
                {formatTime(elapsed)}
              </Text>
            </div>
          )}
        </div>
        {phase === "live" && (
          <IconButton aria-label="Toggle call brief" tone="onDark" onClick={() => setBriefOpen((v) => !v)}>
            <Info className="size-4" />
          </IconButton>
        )}
      </div>

      {/* Below lg, the sidebar-and-stage split doesn't have room to breathe
          (a 360px caption rail plus two video tiles just doesn't fit a
          phone or a portrait tablet), so the whole thing becomes one
          scrolling column instead: stage first, captions right under it.
          At lg+ it's viewport-locked exactly as before. */}
      <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="relative flex min-h-[480px] shrink-0 flex-col lg:min-h-0 lg:min-w-0 lg:flex-1">
          {/* You're in the call from the first frame; the other party
              isn't rendered as a tile at all until they've actually
              joined — just a slim banner above naming who's on their way
              in, the way a real conferencing app shows it, rather than a
              second tile sitting there mid-"connecting" as if it were
              already occupied. The moment the join lands (join sound +
              tile mount), the layout becomes the equal two-tile split. */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 px-4 pb-24 pt-4 sm:gap-3 sm:px-6 sm:pb-[104px] sm:pt-6">
            <AnimatePresence>
              {phase === "connecting" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-panel border border-white/10 bg-black/30 px-4 py-2.5"
                >
                  <SwishxMark className="size-3.5 text-white/50" />
                  <Text size="caption" className="text-white/60">
                    {persona.name} is joining
                  </Text>
                  <motion.span
                    className="flex gap-0.5 text-white/60"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    &hellip;
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Solo, the tile is capped and centered rather than
                stretching edge to edge — a lone participant filling the
                whole stage reads as a placeholder that grew too big, not
                as "waiting for the other person." It only goes full-width
                once there are two tiles sharing the row. */}
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col gap-4 sm:flex-row sm:gap-5",
                phase === "connecting" && "sm:mx-auto sm:w-full sm:max-w-xl",
              )}
            >
              <div
                className="relative min-h-[180px] flex-1 overflow-hidden rounded-card border border-white/15 bg-white/10 backdrop-blur-xl"
                style={{ opacity: dimmed ? 0.35 : 1, transition: "opacity 400ms ease" }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="flex size-20 items-center justify-center rounded-full bg-ink-3 text-title font-semibold text-white transition-shadow duration-150 sm:size-24 sm:text-display lg:size-28"
                    style={{ boxShadow: levelGlow(repLevel) }}
                  >
                    SJ
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1.5 sm:bottom-5 sm:left-5 sm:px-3.5 sm:py-2">
                  <Text size="body-lg" tone="inverse" weight="semibold">You</Text>
                </div>
                {micMuted && (
                  <div className="absolute right-3 top-3 flex items-center justify-center rounded-full bg-black/50 p-2 text-white/70 sm:right-4 sm:top-4">
                    <MicOff className="size-3.5" />
                  </div>
                )}
                {phase === "live" && speaker === "rep" && !micMuted && <SpeakingBadge />}
              </div>

              <AnimatePresence>
                {phase !== "connecting" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: dimmed ? 0.35 : 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                    className="relative min-h-[180px] flex-1 overflow-hidden rounded-card border border-white/15 bg-white/10 backdrop-blur-xl"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <img
                        src={persona.photo}
                        alt=""
                        className="size-20 rounded-full object-cover transition-shadow duration-150 sm:size-24 lg:size-28"
                        style={{ boxShadow: levelGlow(doctorLevel) }}
                      />
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 sm:bottom-5 sm:left-5 sm:px-3.5 sm:py-2">
                      <Text size="body-lg" tone="inverse" weight="semibold">{persona.name}</Text>
                      <Text size="body" className="text-white/60">{persona.label}</Text>
                    </div>
                    {phase === "live" && (speaker === "doctor" ? (
                      <SpeakingBadge />
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-micro font-semibold text-white/55 sm:right-4 sm:top-4"
                      >
                        <Ear className="size-3" />
                        Listening
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {phase === "live" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3.5 rounded-full border border-white/15 bg-black/40 px-4 py-2.5 sm:bottom-6"
              >
                <IconButton
                  aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
                  size={9}
                  onClick={() => setMicMuted((v) => !v)}
                  className={cn(
                    "border",
                    micMuted ? "border-transparent bg-white text-danger" : "border-white/15 bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {micMuted ? <MicOff className="size-4.5" /> : <Mic className="size-4.5" />}
                </IconButton>
                <IconButton
                  aria-label="End call"
                  size={9}
                  onClick={endCall}
                  className="border-transparent bg-danger text-white hover:bg-danger-deep"
                >
                  <PhoneOff className="size-4.5" />
                </IconButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live captions — so the rep can follow the exchange without
            replaying it later. Only exists once there is something said.
            A floating glass tile, like the doctor and rep tiles, at lg+;
            below that it drops out of the sidebar and becomes its own
            full-width block under the stage instead of disappearing.
            Width is set entirely by these classes, never animated — a
            growing "width: auto" here would fight the fixed lg sidebar
            width once captions text piled up, squeezing the video tiles
            into thin strips instead of leaving them their equal share. */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="mx-4 mb-4 flex min-h-[220px] w-[calc(100%-2rem)] shrink-0 flex-col overflow-hidden rounded-card border border-white/15 bg-white/10 backdrop-blur-xl sm:mx-6 sm:mb-6 sm:w-[calc(100%-3rem)] lg:my-6 lg:mr-6 lg:ml-0 lg:min-h-0 lg:w-[360px]"
            >
              <div className="flex h-11 shrink-0 items-center border-b border-white/10 px-4">
                <Label className="text-white/50">Live captions</Label>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4 pt-4">
                <AnimatePresence initial={false}>
                  {visibleTranscript.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                      className={cn("flex", m.mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[88%] rounded-panel px-3 py-2",
                          m.mine ? "bg-brand/25 text-white" : "bg-white/10 text-white",
                        )}
                      >
                        <Text size="caption" weight="bold" className="text-white/60">{m.mine ? "You" : persona.name}</Text>
                        <Text as="div" size="body" leading="snug" className="mt-0.5 text-white/90">{m.text}</Text>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={transcriptEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The wrap-up moment — a proper overlay covering the whole screen
          (stage, captions, header alike), not a strip tucked into just the
          presenter area. "Reviewing" and "Analysis complete" are both the
          same centered layover, one settling into the other. */}
      <AnimatePresence>
        {dimmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-md"
          >
            <AnimatePresence mode="wait">
              {phase === "wrap" ? (
                <motion.div
                  key="wrap"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-3 rounded-card border border-white/15 bg-white/10 px-10 py-8 backdrop-blur-xl"
                >
                  <span className="size-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                  <Label className="text-white/70">Reviewing your call&hellip;</Label>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                  className="flex w-full max-w-[440px] flex-col items-center gap-5 rounded-card border border-white/15 bg-white/10 px-5 py-7 text-center shadow-modal backdrop-blur-xl sm:px-8 sm:py-8"
                >
                  <SwishxMark className="size-9 text-white drop-shadow-lg" />
                  <Label className="text-white/80 drop-shadow-lg">Analysis complete</Label>

                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <Chip size="sm" tone="dark" iconLeft={<Pill className="size-3" />}>
                      {drug.name.toUpperCase()} · {indication.label.toUpperCase()}
                    </Chip>
                    <Chip size="sm" tone="dark" iconLeft={<img src={persona.photo} alt="" className="size-3.5 rounded-full object-cover" />}>
                      {persona.name.toUpperCase()}
                    </Chip>
                    <Chip size="sm" tone="dark">{moodInfo.label.toUpperCase()}</Chip>
                    <Chip size="sm" tone="dark" iconLeft={<Clock className="size-3" />}>
                      {durationInfo.label.toUpperCase()} CALL · {durationInfo.time.toUpperCase()}
                    </Chip>
                  </div>

                  <div className="flex w-full items-center justify-center gap-6 rounded-panel border border-white/10 bg-black/20 px-5 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <Label className="text-white/45">Duration</Label>
                      <Text size="title" weight="bold" tone="inverse" tabular className="font-mono">{formatTime(elapsed)}</Text>
                    </div>
                    <div className="h-9 w-px bg-white/15" />
                    <div className="flex flex-col items-center gap-1">
                      <Label className="text-white/45">Total score</Label>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("size-2 rounded-full", scoreDotClass)} />
                        <Text size="title" weight="bold" tone="inverse" tabular className="font-mono">{DEMO_SCORE}/100</Text>
                      </div>
                    </div>
                  </div>

                  <Button size="lg" onClick={() => navigate("/report")} className="w-full shadow-modal">
                    View your report
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        header={
          <div className="flex flex-1 items-center justify-between">
            <Label>Call brief</Label>
            <IconButton aria-label="Close call brief" size={7} onClick={() => setBriefOpen(false)}>
              <X className="size-4" />
            </IconButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="brand" size="md">{moodInfo.label}</Chip>
            <Chip size="md">{durationInfo.label} · {durationInfo.time}</Chip>
          </div>
          <div>
            <Label tone="brand-deep" className="block">{drug.name} · {indication.label}</Label>
            <Text as="div" size="body" tone="subtle" leading="relaxed" className="mt-1.5">
              GLP-1 receptor agonist, once-weekly subcutaneous injection. Adjunct to diet and exercise for glycemic control.
            </Text>
          </div>
          <div>
            <Label>On-label claims</Label>
            <Text as="div" size="body" leading="relaxed" className="mt-1.5">
              &bull; Reduces A1C by 1.5&ndash;1.8% vs placebo<br />
              &bull; Studied for CV risk reduction in T2D with established CVD<br />
              &bull; Most common AEs: nausea, decreased appetite, diarrhea
            </Text>
          </div>
          <div className="rounded-control border border-hair bg-subtle p-3">
            <Label>Label excerpt</Label>
            <Text as="div" size="body" tone="subtle" className="mt-1.5 italic" leading="relaxed">
              &ldquo;&hellip;has not been studied in patients with a history of pancreatitis. Not recommended as first-line therapy for patients inadequately controlled on diet and exercise alone.&rdquo;
            </Text>
          </div>
          <div>
            <Label>Likely objections</Label>
            <Text as="div" size="body" leading="relaxed" className="mt-1.5">
              &bull; "GI side effects hurt adherence"<br />
              &bull; "How is this different from others in class?"<br />
              &bull; "What's the real-world discontinuation rate?"
            </Text>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
