import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            Reviews
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm">{user.name ?? user.email}</span>
                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
