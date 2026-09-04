import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, LogOut, Shield, User, Menu, X, Waves } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0c1929] dark:text-slate-100">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/5" />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/5" />
      </div>

      <nav className="sticky top-0 z-40 glass border-b border-sky-100/50 dark:border-sky-900/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-[0_4px_14px_rgba(14,165,233,0.35)]">
              <Waves className="text-white" size={18} />
            </div>
            <span className="gradient-text text-xl font-extrabold tracking-tight">
              ReviewHub
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => setDark(!dark)}
              className="rounded-xl p-2.5 text-slate-500 transition-all duration-300 hover:bg-sky-50 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-sky-950/30 dark:hover:text-sky-300"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <>
                <span className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <User size={16} />
                  {user.name ?? user.email}
                </span>
                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-sky-600 transition-all duration-300 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/30"
                  >
                    <Shield size={16} />
                    Admin
                  </Link>
                )}
                <button onClick={logout} className="btn-secondary !px-3.5 !py-2">
                  <LogOut size={16} />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary !py-2">
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl p-2.5 text-slate-500 transition hover:bg-sky-50 dark:hover:bg-sky-950/30 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="animate-fade-in border-t border-sky-100/50 px-6 py-4 md:hidden dark:border-sky-900/20">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setDark(!dark)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400"
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
                {dark ? "Light mode" : "Dark mode"}
              </button>
              {user ? (
                <>
                  <span className="px-3 text-sm text-slate-600 dark:text-slate-400">
                    {user.name ?? user.email}
                  </span>
                  {user.role === "ADMIN" && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-sky-600 dark:text-sky-400"
                    >
                      <Shield size={16} />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="btn-primary"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="relative mx-auto max-w-7xl px-6 py-6">{children}</main>

      <footer className="relative border-t border-sky-100/50 py-8 dark:border-sky-900/20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Waves className="text-sky-500" size={16} />
              <span className="text-sm font-semibold gradient-text">ReviewHub</span>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-600">
              Discover. Review. Decide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
