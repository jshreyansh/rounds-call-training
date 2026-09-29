import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { SetupScreen, SetupScreenHeader } from "@/features/setup/SetupScreen";
import { CallScreen } from "@/features/call/CallScreen";
import { ReportScreen, ReportScreenHeader } from "@/features/report/ReportScreen";
import { LeaderboardScreen, LeaderboardScreenHeader } from "@/features/leaderboard/LeaderboardScreen";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/setup" replace />} />
      {/* The sidebar wraps Setup, Report, and Leaderboard — the call stage
          stays full-bleed and chrome-free on its own. Each route's own
          header goes to AppShell so it spans the full width above the
          sidebar, rather than being squeezed beside it. */}
      <Route path="/setup" element={<AppShell header={<SetupScreenHeader />}><SetupScreen /></AppShell>} />
      <Route path="/report" element={<AppShell header={<ReportScreenHeader />}><ReportScreen /></AppShell>} />
      <Route path="/leaderboard" element={<AppShell header={<LeaderboardScreenHeader />}><LeaderboardScreen /></AppShell>} />
      <Route path="/call" element={<CallScreen />} />
    </Routes>
  );
}
