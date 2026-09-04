import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@product-reviews/shared";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../hooks/useToast";
import { friendlyErrorMessage } from "../api/client";
import { AlertCircle, Mail, Lock, Loader2, Waves, ArrowRight, UserCircle, ShieldCheck } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: LoginInput) => {
    try {
      setSubmitError(null);
      const user = await authApi.login(data);
      setUser(user);
      toast("Welcome back!", "success");
      navigate("/");
    } catch (err) {
      const msg = friendlyErrorMessage(err);
      setSubmitError(msg);
      toast(msg, "error");
    }
  };

  const fillCredentials = (email: string, password: string) => {
    setValue("email", email);
    setValue("password", password);
  };

  return (
    <div className="relative mx-auto flex max-w-4xl animate-fade-in justify-center">
      <div className="flex w-full overflow-hidden rounded-3xl border border-slate-200/60 shadow-[0_20px_60px_rgba(14,165,233,0.15)] dark:border-slate-800/60">
        {/* Left: blue branding + credentials panel */}
        <div className="relative hidden w-2/5 overflow-hidden bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 md:block">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
          </div>
          <div className="relative flex h-full flex-col justify-between p-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Waves className="text-white" size={24} />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                ReviewHub
              </span>
            </div>

            {/* Tagline */}
            <div>
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white">
                Dive into trusted
                <br />
                product reviews.
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-sky-50/80">
                Join a community of smart shoppers. Discover authentic reviews,
                rate products, and help others make better decisions.
              </p>
            </div>

            {/* Demo credentials */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-50/60">
                Demo Credentials
              </p>
              <button
                onClick={() => fillCredentials("admin@example.com", "Password123!")}
                className="group flex w-full items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3 text-left backdrop-blur-sm transition hover:bg-white/20"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <ShieldCheck className="text-white" size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white">Admin</div>
                  <div className="truncate text-xs text-sky-50/70">admin@example.com</div>
                </div>
              </button>
              <button
                onClick={() => fillCredentials("alice@example.com", "Password123!")}
                className="group flex w-full items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3 text-left backdrop-blur-sm transition hover:bg-white/20"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <UserCircle className="text-white" size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white">User</div>
                  <div className="truncate text-xs text-sky-50/70">alice@example.com</div>
                </div>
              </button>
              <p className="pt-1 text-center text-xs text-sky-50/50">
                Password: Password123!
              </p>
            </div>
          </div>
        </div>

        {/* Right: white form panel */}
        <div className="flex flex-1 flex-col justify-center bg-white p-8 dark:bg-[#0c1929] sm:p-10">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center gap-3 md:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-[0_8px_20px_rgba(14,165,233,0.3)]">
              <Waves className="text-white" size={24} />
            </div>
            <span className="text-lg font-extrabold tracking-tight">ReviewHub</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Sign in to continue to ReviewHub
            </p>
          </div>

          {submitError && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle size={16} />
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600 dark:text-slate-400">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="input !pl-11"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600 dark:text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Enter your password"
                  className="input !pl-11"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full !py-3.5 !text-base"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <ArrowRight size={20} />
              )}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No account?{" "}
            <Link to="/register" className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
