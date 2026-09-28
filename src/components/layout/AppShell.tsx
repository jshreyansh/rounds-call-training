import { useRef, useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, History, Lock, Menu, MessageSquareText, Plug, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { Text, Label } from "@/components/ui/text";
import { Button, IconButton } from "@/components/ui/button";
import { Sheet } from "@/components/patterns/sheet";
import { SwishxLogo } from "@/components/brand/logo";

interface NavItem {
  key: string;
  label: string;
  to?: string;
  icon: ComponentType<{ className?: string }>;
  locked?: boolean;
  /** Which routes count as this item being "current" — the demo flow
   *  spans Setup and Report, so both light up the same nav item rather
   *  than making Report look like it belongs to no tab at all. */
  activeOn?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { key: "demo", label: "AI Sales Roleplay Demo", to: "/setup", icon: MessageSquareText, activeOn: ["/setup", "/report"] },
  { key: "leaderboard", label: "Leaderboard", to: "/leaderboard", icon: Trophy, activeOn: ["/leaderboard"] },
  { key: "integrations", label: "Integrations", icon: Plug, locked: true },
  { key: "analytics", label: "Analytics", icon: BarChart3, locked: true },
  { key: "history", label: "Roleplay History", icon: History, locked: true },
];

function NavList({ onNavigate, onLocked }: { onNavigate?: () => void; onLocked: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = item.activeOn?.includes(pathname) ?? false;
        if (item.locked) {
          return (
            <button
              key={item.key}
              type="button"
              onClick={onLocked}
              className="focus-ring flex w-full items-center justify-between gap-2 rounded-control px-3 py-2.5 text-left text-ink-3 transition-colors hover:bg-subtle"
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="size-4" />
                <Text size="body" weight="medium">{item.label}</Text>
              </span>
              <Lock className="size-3.5 text-ink-4" />
            </button>
          );
        }
        return (
          <Link
            key={item.key}
            to={item.to!}
            onClick={onNavigate}
            className={cn(
              "focus-ring flex items-center gap-2.5 rounded-control px-3 py-2.5 transition-colors",
              active ? "bg-tint text-brand-deep" : "text-ink-2 hover:bg-subtle",
            )}
          >
            <item.icon className="size-4" />
            <Text size="body" weight={active ? "bold" : "medium"}>{item.label}</Text>
          </Link>
        );
      })}
    </nav>
  );
}

/** The app shell for the setup/report side of Rounds — a top bar plus a
 *  left nav (Hyperbound-style), with a sidebar on desktop and a
 *  hamburger-opened drawer on mobile/tablet. Deliberately not used on
 *  the call stage, which stays full-bleed and chrome-free. Nothing here
 *  is wired to a real backend yet: "Login to Use" and the locked tabs
 *  are placeholders that surface the same toast, standing in for an
 *  auth gate that doesn't exist yet. */
export function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function showToast(message: string) {
    setToastMessage(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2600);
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-canvas">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-hair px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <IconButton aria-label="Open menu" onClick={() => setNavOpen(true)} className="lg:hidden">
            <Menu className="size-4" />
          </IconButton>
          <SwishxLogo className="h-5 w-auto" />
        </div>
        <Button size="sm" onClick={() => showToast("Login to use this feature")}>
          Login to Use
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-60 shrink-0 flex-col gap-1 border-r border-hair bg-card p-3 lg:flex">
          <NavList onLocked={() => showToast("Login to use this feature")} />
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      <Sheet
        open={navOpen}
        onClose={() => setNavOpen(false)}
        side="left"
        size={280}
        header={<Label>Menu</Label>}
      >
        <NavList
          onNavigate={() => setNavOpen(false)}
          onLocked={() => {
            setNavOpen(false);
            showToast("Login to use this feature");
          }}
        />
      </Sheet>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4"
          >
            <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 shadow-modal">
              <Lock className="size-3.5 text-white/70" />
              <Text size="label" weight="semibold" tone="inverse">{toastMessage}</Text>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
