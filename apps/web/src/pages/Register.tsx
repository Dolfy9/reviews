import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@product-reviews/shared";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../hooks/useToast";
import { friendlyErrorMessage } from "../api/client";
import { AlertCircle, Mail, Lock, User, Loader2, Waves } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: RegisterInput) => {
    try {
      setSubmitError(null);
      const user = await authApi.register(data);
      setUser(user);
      toast("Account created!", "success");
      navigate("/");
    } catch (err) {
      const msg = friendlyErrorMessage(err);
      setSubmitError(msg);
      toast(msg, "error");
    }
  };

  return (
    <div className="mx-auto max-w-md animate-slide-up">
      <div className="card relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-[0_8px_20px_rgba(14,165,233,0.3)]">
              <Waves className="text-white" size={24} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-extrabold tracking-tight">
                Join ReviewHub
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create your account and start reviewing
              </p>
            </div>
          </div>

          {submitError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle size={16} />
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  {...register("name")}
                  placeholder="Name (optional)"
                  className="input !pl-11"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Email"
                  className="input !pl-11"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Password"
                  className="input !pl-11"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full !py-3"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={18} />}
              {isSubmitting ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-sky-600 hover:underline dark:text-sky-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
