import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, LogOut, Shield, User, Menu, X, Package } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <Package className="text-indigo-600" size={24} />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ReviewHub
            </span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => setDark(!dark)}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <>
                <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <User size={16} />
                  {user.name ?? user.email}
                </span>
                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                  >
                    <Shield size={16} />
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="btn-secondary !px-3 !py-1.5"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary !px-3 !py-1.5">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary !px-3 !py-1.5">
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-gray-500 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="animate-fade-in border-t border-gray-200 px-4 py-3 md:hidden dark:border-gray-800">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setDark(!dark)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
                {dark ? "Light mode" : "Dark mode"}
              </button>
              {user ? (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {user.name ?? user.email}
                  </span>
                  {user.role === "ADMIN" && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400"
                    >
                      <Shield size={16} />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
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
                    className="text-sm text-indigo-600 dark:text-indigo-400"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm text-indigo-600 dark:text-indigo-400"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="border-t border-gray-200 py-6 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-400 dark:text-gray-600">
          ReviewHub &middot; Product Reviews Platform
        </div>
      </footer>
    </div>
  );
}
