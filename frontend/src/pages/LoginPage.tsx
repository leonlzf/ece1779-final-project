import { useForm } from "react-hook-form";
import { useAuth } from "../auth/AuthContext"; 
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function LoginPage() {
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const onSubmit = async (v: { email: string; password: string }) => {
    try {
      await login(v);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-layout">
      <div className="card">
        <h2 className="auth-header">Sign in</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <input className="input" placeholder="Email" {...register("email", { required: true })} />
          <input className="input" placeholder="Password" type="password" {...register("password", { required: true })} />
          <button className="btn" type="submit">Login</button>
        </form>
        <p className="mt-2">No account? <a href="/register">Create one</a></p>
      </div>
    </div>
  );
}
