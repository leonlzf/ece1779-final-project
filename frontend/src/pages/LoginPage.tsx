import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

type FormValues = { email: string; password: string };

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormValues>({ mode: "onTouched" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");

  const onSubmit = async (v: FormValues) => {
    setError("");
    try {
      await login({
        email: v.email.trim().toLowerCase(),
        password: v.password,
      });
      navigate("/dashboard");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    }
  };

  return (
    <div className="auth-layout">
      <Card className="auth-card">
        <CardHeader>
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">
            Access your workspace to manage files, tags, versions, and comments.
          </p>
        </CardHeader>

        <CardBody>
          {error && <div className="auth-alert auth-alert--error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              {...register("email", { required: true })}
            />

            <Input
              label="Password"
              placeholder="Your password"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: true })}
            />

            <Button type="submit" className="auth-submit">
              Login
            </Button>
          </form>

          <div className="auth-foot">
            <span>New here?</span>
            <Link to="/register">Create an account</Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
