import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import { authApi, getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

const HOME_BY_ROLE = {
  author: "/author",
  admin: "/admin",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);

  const [role, setRole] = useState("author");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.message || "");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function switchRole(nextRole) {
    setRole(nextRole);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });

      const user = data?.user;

      if (!user?.role) {
        setError(
          "Login succeeded, but the server did not return valid user information."
        );
        return;
      }

      const userRole = String(user.role).toLowerCase();

      if (userRole !== role) {
        await authApi.logout().catch(() => {});

        setError(
          role === "admin"
            ? "This account does not have admin access. Use the Author tab instead."
            : "This is a staff account. Use the Admin tab instead."
        );

        return;
      }

      setUser(user);

      const destination = location.state?.from?.pathname;

      navigate(
        destination?.startsWith(HOME_BY_ROLE[userRole])
          ? destination
          : HOME_BY_ROLE[userRole] || "/",
        { replace: true }
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to sign in. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={role === "admin" ? "Admin Portal" : "Welcome Back"}
      subtitle={
        role === "admin"
          ? "Sign in to access editorial controls and tickets."
          : "Sign in to access your BookLeaf author workspace."
      }
    >
      <div className="mb-6 flex rounded-lg border border-[#2B2B2B]/15 bg-[#F5EFE6] p-1">
        <button
          type="button"
          onClick={() => switchRole("author")}
          disabled={loading}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed ${
            role === "author"
              ? "bg-[#6B2D3C] text-[#FAF7F2] shadow-sm"
              : "text-[#2B2B2B]/70 hover:text-[#2B2B2B]"
          }`}
        >
          Author
        </button>

        <button
          type="button"
          onClick={() => switchRole("admin")}
          disabled={loading}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed ${
            role === "admin"
              ? "bg-[#6B2D3C] text-[#FAF7F2] shadow-sm"
              : "text-[#2B2B2B]/70 hover:text-[#2B2B2B]"
          }`}
        >
          Admin
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {notice && (
          <div
            role="status"
            className="rounded-lg border border-[#3D6B4F]/20 bg-[#3D6B4F]/10 px-3.5 py-2.5 text-xs font-medium text-[#3D6B4F]"
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[#6B2D3C]/20 bg-[#F5EFE6] px-3.5 py-2.5 text-xs font-medium text-[#6B2D3C]"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#2B2B2B]/70"
          >
            {role === "admin" ? "Staff Email" : "Email Address"}
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={
              role === "admin" ? "staff@bookleaf.com" : "author@example.com"
            }
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-[#2B2B2B]/20 bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none transition placeholder:text-[#2B2B2B]/30 focus:border-[#6B2D3C] focus:ring-1 focus:ring-[#6B2D3C]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#2B2B2B]/70"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-[#2B2B2B]/20 bg-white px-3.5 py-2.5 pr-10 text-sm text-[#2B2B2B] outline-none transition placeholder:text-[#2B2B2B]/30 focus:border-[#6B2D3C] focus:ring-1 focus:ring-[#6B2D3C]"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40 transition hover:text-[#2B2B2B]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#6B2D3C] py-2.5 text-sm font-medium text-[#FAF7F2] transition hover:bg-[#582431] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <LoaderCircle size={16} className="animate-spin" />}
          {loading
            ? "Signing In..."
            : `Sign In as ${role === "admin" ? "Admin" : "Author"}`}
        </button>
      </form>

      {role === "author" && (
        <div className="mt-6 text-center">
          <p className="text-xs text-[#2B2B2B]/70">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-[#6B2D3C] underline underline-offset-4 hover:text-[#582431]"
            >
              Create an account
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  );
}