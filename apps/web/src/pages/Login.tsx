import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@product-reviews/shared";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../hooks/useToast";
import { LogIn, AlertCircle, Mail, Lock, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
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
      const msg = err instanceof Error ? err.message : "Login failed. Check your credentials.";
      setSubmitError(msg);
      toast(msg, "error");
    }
  };

  return (
    <div className="mx-auto max-w-md animate-slide-up">
      <div className="card p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        {submitError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            <AlertCircle size={16} />
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                {...register("email")}
                type="email"
                placeholder="Email"
                className="input !pl-10"
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                {...register("password")}
                type="password"
                placeholder="Password"
                className="input !pl-10"
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting && <Loader2 className="animate-spin" size={18} />}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          No account?{" "}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
