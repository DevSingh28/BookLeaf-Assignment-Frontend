import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import { authApi, getErrorMessage } from "../../lib/api";

export default function SignupPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (name.length < 2 || name.length > 150) {
      setMessage({
        type: "error",
        text: "Full name must be between 2 and 150 characters.",
      });
      return;
    }

    if (phone.length > 30) {
      setMessage({
        type: "error",
        text: "Please enter a valid phone number.",
      });
      return;
    }

    if (form.password.length < 8 || form.password.length > 72) {
      setMessage({
        type: "error",
        text: "Your password must be between 8 and 72 characters.",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage({
        type: "error",
        text: "The passwords do not match.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data } = await authApi.signup({
        fullName: name,
        email,
        password: form.password,
        ...(phone && { phone }),
      });

      navigate("/login", {
        replace: true,
        state: { message: data.message || "Account created successfully. Please log in." },
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: getErrorMessage(err, "Unable to create your account. Please try again."),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Set up your account to access your author workspace."
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {message && (
          <div
            role="alert"
            className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium ${
              message.type === "error"
                ? "border-[#6B2D3C]/20 bg-[#F5EFE6] text-[#6B2D3C]"
                : "border-[#3D6B4F]/20 bg-[#3D6B4F]/10 text-[#3D6B4F]"
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#2B2B2B]/70"
          >
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Dev Singh"
            value={form.name}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={150}
            className="w-full rounded-lg border border-[#2B2B2B]/20 bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none transition placeholder:text-[#2B2B2B]/30 focus:border-[#6B2D3C] focus:ring-1 focus:ring-[#6B2D3C]"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#2B2B2B]/70"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="author@example.com"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-[#2B2B2B]/20 bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none transition placeholder:text-[#2B2B2B]/30 focus:border-[#6B2D3C] focus:ring-1 focus:ring-[#6B2D3C]"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#2B2B2B]/70"
          >
            Phone Number <span className="normal-case tracking-normal text-[#2B2B2B]/40">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={handleChange}
            maxLength={30}
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              maxLength={72}
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

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#2B2B2B]/70"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
            maxLength={72}
            className="w-full rounded-lg border border-[#2B2B2B]/20 bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none transition placeholder:text-[#2B2B2B]/30 focus:border-[#6B2D3C] focus:ring-1 focus:ring-[#6B2D3C]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#6B2D3C] py-2.5 text-sm font-medium text-[#FAF7F2] transition hover:bg-[#582431] disabled:opacity-70 enabled:cursor-pointer disabled:cursor-not-allowed"
        >
          {loading && <LoaderCircle size={16} className="animate-spin" />}
          {loading ? "Creating Account..." : "Register as Author"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-[#2B2B2B]/70">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#6B2D3C] underline underline-offset-4 hover:text-[#582431]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}