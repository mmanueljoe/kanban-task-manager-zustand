import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useRegister } from "@hooks/useAuthQueries";
import { ApiError } from "@/lib/api";

export function Register() {
  const navigate = useNavigate();
  const register = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fieldErrors =
    register.error instanceof ApiError ? register.error.fieldErrors : undefined;
  const generalError =
    register.error instanceof ApiError && !fieldErrors
      ? register.error.message
      : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { name, email, password },
      { onSuccess: () => void navigate("/", { replace: true }) }
    );
  };

  return (
    <div className="app-login">
      <h1 className="heading-xl app-section-title">Create account</h1>
      <form onSubmit={handleSubmit} className="app-stack-4 app-login-form">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors?.name}
          required
        />
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
          disabled={register.isPending}
        >
          {register.isPending ? "Creating account…" : "Create account"}
        </Button>
        <p className="body-m">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
