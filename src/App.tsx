import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { SetupScreen } from "@/features/setup/SetupScreen";
import { CallScreen } from "@/features/call/CallScreen";
import { ReportScreen } from "@/features/report/ReportScreen";
import { LeaderboardScreen } from "@/features/leaderboard/LeaderboardScreen";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/setup" replace />} />
      {/* The shell (top bar + nav) wraps Setup, Report, and Leaderboard —
          the call stage stays full-bleed and chrome-free on its own. */}
      <Route path="/setup" element={<AppShell><SetupScreen /></AppShell>} />
      <Route path="/report" element={<AppShell><ReportScreen /></AppShell>} />
      <Route path="/leaderboard" element={<AppShell><LeaderboardScreen /></AppShell>} />
      <Route path="/call" element={<CallScreen />} />
    </Routes>
  );
}
