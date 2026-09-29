import { Navigate, Route, Routes } from "react-router-dom";
import { SetupScreen } from "@/features/setup/SetupScreen";
import { CallScreen } from "@/features/call/CallScreen";
import { ReportScreen } from "@/features/report/ReportScreen";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/setup" replace />} />
      <Route path="/setup" element={<SetupScreen />} />
      <Route path="/call" element={<CallScreen />} />
      <Route path="/report" element={<ReportScreen />} />
    </Routes>
  );
}
