import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { ThemeToggle } from "../../theme/ThemeToggle";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export function AppShell({
  children,
  showSidebar = true,
}: {
  children: React.ReactNode;
  showSidebar?: boolean;
}) {
  const { user, logout } = useAuth();
  const loc = useLocation();

  const isActive = (path: string) =>
    loc.pathname === path || loc.pathname.startsWith(path + "/");

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar__left">
          <Link to="/dashboard" className="app-brand">
            <span className="app-brand__dot" />
            <span className="app-brand__text">OpenCollab</span>
          </Link>
          <span className="app-brand__sub">
            Files • Versions • Comments
          </span>
        </div>

        <div className="app-topbar__right">
          <ThemeToggle />
          {user?.email && <span className="app-user">{user.email}</span>}
          <Button variant="ghost" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <div
        className={cn(
          "app-shell__body",
          !showSidebar && "app-shell__body--no-sidebar"
        )}
      >
        {showSidebar && (
          <aside className="app-sidebar">
            <div className="app-sidebar__section">
              <div className="app-sidebar__title">Workspace</div>
              <Link
                to="/dashboard"
                className={cn("app-navlink", isActive("/dashboard") && "active")}
              >
                Dashboard
              </Link>
            </div>

            <div className="app-sidebar__section">
              <div className="app-sidebar__title">Tips</div>
              <div className="app-sidebar__hint">
                • Drag & drop to upload
                <br />
                • Tag files for quick filtering
                <br />
                • Use versions to rollback safely
              </div>
            </div>
          </aside>
        )}

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
