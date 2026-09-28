import { Trophy } from "lucide-react";
import { Text } from "@/components/ui/text";

/** Empty on purpose — the nav item exists so the shell reads like a real
 *  product, but there's nothing to rank yet. */
export function LeaderboardScreen() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-subtle text-ink-3">
        <Trophy className="size-5" />
      </span>
      <Text size="title" weight="bold">Leaderboard</Text>
      <Text size="body" tone="subtle" className="max-w-[320px]">
        Nothing to rank yet — this fills in once there's call history to score.
      </Text>
    </div>
  );
}
