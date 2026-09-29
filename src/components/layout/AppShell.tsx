import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, History, Lock, Menu, MessageCircle, Plug, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/text";
import { IconButton } from "@/components/ui/button";
import { Sheet } from "@/components/patterns/sheet";

const NAV_ITEMS = [
  { key: "roleplay", label: "AI Roleplay", icon: MessageCircle, to: "/setup" },
  { key: "leaderboard", label: "Leaderboard", icon: Trophy, to: "/leaderboard" },
  { key: "integrations", label: "Integrations", icon: Plug, to: null },
  { key: "analytics", label: "Analytics", icon: BarChart3, to: null },
  { key: "history", label: "Roleplay History", icon: History, to: null },
] as const;

/** True once the viewport crosses into the desktop layout's own
 *  breakpoint — the same 1024px line Setup's own layout switches on, so
 *  the persistent sidebar and each screen's mobile header agree on
 *  exactly when the other takes over. */
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

const AppShellContext = createContext<{ openNav: () => void; showToast: (message: string) => void }>({
  openNav: () => {},
  showToast: () => {},
});

/** Lets a wrapped screen raise the same toast the locked nav tabs use,
 *  so "you need an account for this" reads identically everywhere. */
export function useAppShellToast() {
  return useContext(AppShellContext).showToast;
}

/** Placed by each wrapped screen's own header, to the left of its logo —
 *  only visible below the desktop breakpoint, where the sidebar itself
 *  isn't rendered and this is the only way to reach it. */
export function AppShellMenuButton() {
  const { openNav } = useContext(AppShellContext);
  return (
    <IconButton aria-label="Open navigation" size={8} onClick={openNav} className="lg:hidden">
      <Menu className="size-4.5" />
    </IconButton>
  );
}

function NavRow({
  item, active, onNavigate, onLocked,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onNavigate: () => void;
  onLocked: () => void;
}) {
  const Icon = item.icon;
  const rowClass = cn(
    "focus-ring flex items-center gap-2 rounded-control px-2.5 py-2 text-body font-medium transition-colors",
    active ? "bg-tint text-brand-deep" : "text-ink-2 hover:bg-subtle hover:text-ink",
  );
  const content = (
    <>
      <span className="relative shrink-0">
        <Icon className="size-4" />
        {!item.to && (
          <span className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-card ring-1 ring-hair-2">
            <Lock className="size-2 text-ink-3" />
          </span>
        )}
      </span>
      <span className="flex-1 truncate text-left">{item.label}</span>
    </>
  );
  return item.to ? (
    <Link to={item.to} onClick={onNavigate} className={rowClass}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onLocked} className={rowClass}>
      {content}
    </button>
  );
}

/** The nav's persistent home, wrapping Setup/Report/Leaderboard so the
 *  call stage stays full-bleed and chrome-free on its own. `header` is
 *  each route's own top bar (logo, title, page actions) — rendered here
 *  so it spans the full viewport width, with the sidebar and the page's
 *  own content sitting in a row underneath it, rather than the sidebar
 *  running the full height beside a header that only covers the
 *  remaining width. At the desktop breakpoint the sidebar is a fixed,
 *  always-visible column; below that it's a drawer, opened via
 *  `AppShellMenuButton` inside the header (to the left of the logo)
 *  rather than a rail this wrapper would have to draw itself. */
export function AppShell({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function showToast(message: string) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const rows = (onNavigate: () => void) => NAV_ITEMS.map((item) => (
    <NavRow
      key={item.key}
      item={item}
      active={item.to === location.pathname}
      onNavigate={onNavigate}
      onLocked={() => {
        onNavigate();
        showToast("Login to use this feature");
      }}
    />
  ));

  return (
    <AppShellContext.Provider value={{ openNav: () => setNavOpen(true), showToast }}>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4"
            >
              <div className="rounded-full bg-ink px-4 py-2 text-body font-medium text-white shadow-float">
                {toast}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="shrink-0">{header}</div>

        <div className="flex min-h-0 flex-1">
          {isDesktop ? (
            <nav className="flex w-48 shrink-0 flex-col gap-0.5 border-r border-hair bg-card p-2">
              {rows(() => {})}
            </nav>
          ) : (
            <Sheet
              open={navOpen}
              onClose={() => setNavOpen(false)}
              side="left"
              size={280}
              header={<Text size="body-lg" weight="bold">Menu</Text>}
            >
              <div className="flex flex-col gap-1">
                {rows(() => setNavOpen(false))}
              </div>
            </Sheet>
          )}

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </AppShellContext.Provider>
  );
}
