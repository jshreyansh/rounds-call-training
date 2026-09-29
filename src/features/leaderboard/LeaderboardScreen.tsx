import { useState } from "react";
import { Calendar, Crown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/text";
import { SwishxLogo } from "@/components/brand/logo";
import { AppShellMenuButton } from "@/components/layout/AppShell";

/** The full-width bar AppShell renders above the sidebar, matching
 *  Setup/Report's own header. */
export function LeaderboardScreenHeader() {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-hair px-4 sm:gap-3 sm:px-6 lg:px-10">
      <AppShellMenuButton />
      <SwishxLogo className="h-5 w-auto" />
    </div>
  );
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  company: string;
  score: number;
  calls: number;
  callsDelta: number;
  /** Placeholder portraits — stock headshots meant for mockups, not real
   *  reps. */
  photo: string;
}

const portrait = (group: "men" | "women", n: number) =>
  `https://randomuser.me/api/portraits/${group}/${n}.jpg`;

/** Placeholder standings — a gimmick for now, not real scoring data;
 *  wired up once calls actually get ranked against each other. Ranks run
 *  contiguous so the list under the podium reads as one continuous
 *  leaderboard. The signed-out viewer isn't in here: they get their own
 *  tile above the list instead of a fabricated rank. */
const STANDINGS: LeaderboardEntry[] = [
  { rank: 1, name: "Priya Nandan", company: "Meridian Pharma", score: 4820, calls: 52, callsDelta: 9, photo: portrait("women", 44) },
  { rank: 2, name: "Marcus Yu", company: "Northfield Biopharma", score: 4510, calls: 47, callsDelta: 5, photo: portrait("men", 32) },
  { rank: 3, name: "Elena Brooks", company: "Solara Oncology", score: 4295, calls: 45, callsDelta: 3, photo: portrait("women", 68) },
  { rank: 4, name: "Grace Adeyemi", company: "Northfield Biopharma", score: 4150, calls: 44, callsDelta: 4, photo: portrait("women", 90) },
  { rank: 5, name: "Tomas Reyes", company: "Verdant Biosciences", score: 4080, calls: 43, callsDelta: -2, photo: portrait("men", 75) },
  { rank: 6, name: "Aisha Rahman", company: "Highmoor Respiratory", score: 4020, calls: 42, callsDelta: 6, photo: portrait("women", 33) },
  { rank: 7, name: "Noah Bennett", company: "Solara Oncology", score: 3960, calls: 40, callsDelta: 1, photo: portrait("men", 54) },
  { rank: 8, name: "Dana Whitfield", company: "Aldebaran Therapeutics", score: 3870, calls: 38, callsDelta: -3, photo: portrait("women", 17) },
  { rank: 9, name: "Omar Castillo", company: "Highmoor Respiratory", score: 3810, calls: 36, callsDelta: 5, photo: portrait("men", 19) },
  { rank: 10, name: "Renee Okafor", company: "Verdant Biosciences", score: 3755, calls: 33, callsDelta: 2, photo: portrait("women", 56) },
  { rank: 11, name: "Liam Foster", company: "Meridian Pharma", score: 3690, calls: 31, callsDelta: -4, photo: portrait("men", 8) },
];

/** Riser geometry. Heights step down from the centre, and the medal
 *  colours are the classic gold/silver/bronze rather than three shades
 *  of brand orange — rank reads instantly that way, and it keeps the
 *  podium from becoming one big saturated slab. */
const PODIUM_ORDER = [
  {
    rank: 2, order: "order-2 sm:order-1", z: "z-10",
    height: "h-14 sm:h-16", medal: "#b9bfc9", medalDeep: "#8d94a0",
  },
  {
    rank: 1, order: "order-1 sm:order-2", z: "z-20",
    height: "h-20 sm:h-24", medal: "#e8b44c", medalDeep: "#c08f2e",
  },
  {
    rank: 3, order: "order-3", z: "z-10",
    height: "h-10 sm:h-12", medal: "#cd8b5c", medalDeep: "#a86b41",
  },
] as const;

function Face({ photo, name, className }: { photo: string; name: string; className?: string }) {
  return <img src={photo} alt="" className={cn("object-cover", className)} title={name} />;
}

export function LeaderboardScreen() {
  const [range, setRange] = useState<"week" | "all">("week");
  const podium = PODIUM_ORDER.map((slot) => ({ ...slot, entry: STANDINGS.find((e) => e.rank === slot.rank)! }));

  return (
    <div className="h-full w-full overflow-y-auto bg-canvas">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 p-6 sm:p-8">
        {/* Podium — three risers that meet edge to edge, each drawn as a
            lit top face over a shaded front face. The centre block is
            wider, taller and stacked above its neighbours so it reads as
            standing in front of them rather than beside them. */}
        <div className="flex items-end justify-center">
          {podium.map(({ rank, order, z, height, medal, medalDeep, entry }) => {
            const isFirst = rank === 1;
            return (
              <div
                key={rank}
                className={cn("relative flex w-24 flex-col items-center sm:w-32", order, z)}
              >
                <div className="relative">
                  {/* The medal is the rim itself — a gold/silver/bronze
                      band around the portrait, so rank reads from colour
                      without repeating the number the riser already has. */}
                  <div
                    className="rounded-full p-[3px] shadow-hair"
                    style={{ background: `linear-gradient(to bottom, ${medal}, ${medalDeep})` }}
                  >
                    <Face
                      photo={entry.photo}
                      name={entry.name}
                      className={cn(
                        "rounded-full ring-2 ring-card",
                        isFirst ? "size-16 sm:size-[72px]" : "size-14 sm:size-16",
                      )}
                    />
                  </div>
                  {isFirst && (
                    <Crown
                      className="absolute -top-5 left-1/2 size-5 -translate-x-1/2"
                      style={{ color: medal }}
                      fill="currentColor"
                    />
                  )}
                </div>

                <Text size="caption" weight="bold" className="mt-2.5 text-center leading-tight">{entry.name}</Text>
                <Text size="micro" tone="subtle" className="text-center leading-tight">{entry.company}</Text>
                <Text size="body" weight="bold" tone="brand-deep" tabular className="mt-1 font-mono">
                  {entry.score}
                </Text>

                {/* The riser: a lighter top face over a shaded front,
                    solid enough to read at this size. The three sit
                    flush, so they form one podium rather than three
                    separate bars. */}
                <div className="mt-3 w-full">
                  <div className={cn("h-2.5 bg-brand-2", isFirst ? "rounded-t-control" : rank === 2 ? "rounded-tl-control" : "rounded-tr-control")} />
                  <div className={cn("flex items-center justify-center bg-gradient-to-b from-brand to-brand-deep", height)}>
                    <span className="font-mono text-title font-black text-white/90">{rank}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* A soft contact shadow so the podium sits on the page instead
            of floating over it. */}
        <div className="mx-auto -mt-6 h-3 w-64 rounded-[50%] bg-hair-2 blur-md sm:w-80" />

        {/* Standings */}
        <div className="overflow-hidden rounded-card border border-hair bg-card shadow-hair">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-ink-3" />
              <Text size="body-lg" weight="bold">This week's leaderboard</Text>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-hair-2 bg-subtle p-1">
              {([["week", "This week"], ["all", "All time"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={cn(
                    "focus-ring rounded-full px-3 py-1 text-label font-semibold transition-colors",
                    range === key ? "bg-brand text-white" : "text-ink-3 hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            {STANDINGS.map((row) => (
              <div
                key={row.rank}
                className="flex items-center gap-3 border-b border-hair px-4 py-3 last:border-b-0"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-hair-2 font-mono text-label text-ink-3">
                  {row.rank}
                </span>
                <Face photo={row.photo} name={row.name} className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Text size="body" weight="bold" truncate>{row.name}</Text>
                  <Text as="div" size="caption" tone="subtle">
                    {row.company} · Calls completed:{" "}
                    <span className={row.callsDelta >= 0 ? "font-semibold text-ok" : "font-semibold text-danger"}>
                      {row.callsDelta >= 0 ? "▲" : "▼"}{Math.abs(row.callsDelta)}
                    </span>{" "}
                    / {row.calls}
                  </Text>
                </div>
                <div className="text-right">
                  <Text as="div" size="micro" tone="faint">Score</Text>
                  <Text as="div" size="body-lg" weight="bold" tone="brand-deep" tabular className="font-mono">{row.score}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
