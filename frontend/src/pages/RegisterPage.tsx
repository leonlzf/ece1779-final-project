import { useForm } from "react-hook-form";
import { registerApi } from "../auth/api";
import { useNavigate, Link } from "react-router-dom";
import { useCallback, useState } from "react";
import { isAxiosError } from "axios";

type FormValues = { email: string; password: string };

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: "onTouched" });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const onSubmit = useCallback(async (raw: FormValues) => {
    setMsg("");
    setErr("");

    const v = { email: raw.email.trim().toLowerCase(), password: raw.password.trim() };
    try {
      const { data } = await registerApi(v);
      const token = data?.token || data?.accessToken;
      if (token) {
        localStorage.setItem("token", token);
        window.location.href = "/dashboard";
        return;
      }
      setMsg("Registered successfully. Please login.");
      setTimeout(() => navigate("/login"), 700);
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        const status = e.response?.status;
        const body: any = e.response?.data;
        if (status === 409) return setErr("Account already exists");
        if (status === 400 || status === 422)
          return setErr(body?.message || "Invalid input");
        setErr(body?.message || "Register failed");
      } else if (e instanceof Error) setErr(e.message);
      else setErr("Register failed");
    }
  }, [navigate]);

  return (
    <div className="auth-layout">
      <div className="card">
        <h2 className="auth-header">Create account</h2>
        <p className="auth-subtitle">Join the workspace to upload and collaborate.</p>

        {err && <div className="alert alert-danger">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            className={`input ${errors.email ? "input-error" : ""}`}
            placeholder="Email"
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email format" },
            })}
          />
          {errors.email && <p style={{ color: "var(--danger)" }}>{errors.email.message}</p>}

          <input
            className={`input ${errors.password ? "input-error" : ""}`}
            placeholder="Password"
            type="password"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 1, message: "At least 1 character" },
            })}
          />
          {errors.password && <p style={{ color: "var(--danger)" }}>{errors.password.message}</p>}

          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registering…" : "Register"}
          </button>
        </form>

        <p className="mt-2">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
