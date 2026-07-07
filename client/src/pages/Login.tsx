import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useLogin } from "@hooks/useAuthQueries";
import { ApiError } from "@/lib/api";

export function Login() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fieldErrors =
    login.error instanceof ApiError ? login.error.fieldErrors : undefined;
  const generalError =
    login.error instanceof ApiError && !fieldErrors
      ? login.error.message
      : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => void navigate("/", { replace: true }) }
    );
  };

  return (
    <div className="app-login">
      <h1 className="heading-xl app-section-title">Log in</h1>
      <form onSubmit={handleSubmit} className="app-stack-4 app-login-form">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors?.email}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors?.password}
          required
        />
        {generalError && <p className="input-error-text">{generalError}</p>}
        <Button
          type="submit"
          variant="primary"
          size="large"
          disabled={login.isPending}
        >
          {login.isPending ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </div>
  );
}
