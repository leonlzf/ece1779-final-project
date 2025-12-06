import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";

import { registerApi } from "../auth/api";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

type FormValues = {
  email: string;
  password: string;
};

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: "onTouched" });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const navigate = useNavigate();

  const onSubmit = useCallback(
    async (raw: FormValues) => {
      setMsg("");
      setErr("");

      const v = {
        email: raw.email.trim().toLowerCase(),
        password: raw.password,
      };

      try {
        const { data } = await registerApi(v);
        const token = data?.token || data?.accessToken;

        if (token) {
          localStorage.setItem("token", token);
          window.location.href = "/dashboard";
          return;
        }

        setMsg("Registered successfully. Redirecting to login...");
        window.setTimeout(() => navigate("/login"), 700);
      } catch (e: unknown) {
        if (isAxiosError(e)) {
          const status = e.response?.status;
          const body: any = e.response?.data;

          if (status === 409) {
            setErr("Account already exists.");
            return;
          }

          if (status === 400 || status === 422) {
            setErr(body?.message || "Invalid input.");
            return;
          }

          setErr(body?.message || "Register failed.");
          return;
        }

        if (e instanceof Error) {
          setErr(e.message);
          return;
        }

        setErr("Register failed.");
      }
    },
    [navigate]
  );

  return (
    <div className="auth-layout">
      <Card className="auth-card">
        <CardHeader>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">
            Join your workspace and start collaborating on files.
          </p>
        </CardHeader>

        <CardBody>
          {err && <div className="auth-alert auth-alert--error">{err}</div>}
          {msg && <div className="auth-alert auth-alert--success">{msg}</div>}

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format",
                },
              })}
            />

            <Input
              label="Password"
              placeholder="Choose a password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 1,
                  message: "At least 1 character",
                },
              })}
            />

            <Button type="submit" loading={isSubmitting} className="auth-submit">
              Register
            </Button>
          </form>

          <div className="auth-foot">
            <span>Already have an account?</span>
            <Link to="/login">Sign in</Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
