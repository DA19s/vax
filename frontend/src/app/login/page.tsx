"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Key, ArrowRight } from "lucide-react";
import AuthLayout from "@/app/components/auth/AuthLayout";
import AuthInput from "@/app/components/auth/AuthInput";
import AuthButton from "@/app/components/auth/AuthButton";
import AuthAlert from "@/app/components/auth/AuthAlert";
import { useAuth } from "@/context/AuthContext";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  role: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:6000";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const emailValue = (formData.get("email") ?? "").toString();
      const passwordValue = (formData.get("password") ?? "").toString();

      setEmail(emailValue);
      setPassword(passwordValue);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message ?? "Identifiants invalides.");
        return;
      }

      if (!data?.accessToken || !data?.refreshToken) {
        setError("Réponse invalide du serveur.");
        return;
      }

      // Vérifier rapidement le rôle pour la redirection
      let role: string | null = null;
      try {
        const decoded = jwtDecode<JwtPayload>(data.accessToken);
        role = decoded?.role ?? null;
      } catch {
        // ignore, login() fera une validation complète
      }

      login(
        {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
        { email }
      );

      if (!role) {
        router.push("/dashboard");
        return;
      }

      switch (role.toUpperCase()) {
        case "NATIONAL":
          router.push("/dashboard");
          break;
        case "REGIONAL":
          router.push("/dashboard");
          break;
        case "DISTRICT":
          router.push("/dashboard");
          break;
        case "AGENT":
          router.push("/dashboard");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (err) {
      console.error("Erreur login frontend:", err);
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Connexion">
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          name="email"
          type="email"
          placeholder="nom@exemple.com"
          value={email}
          onChange={setEmail}
          label="Email professionnel"
          icon={Mail}
          required
        />

        <AuthInput
          name="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          label="Mot de passe"
          icon={Key}
          required
        />

        {error && <AuthAlert type="error" message={error} />}

        <AuthButton
          type="submit"
          loading={loading}
          loadingText="Connexion en cours..."
          icon={ArrowRight}
        >
          Se connecter
        </AuthButton>

        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-emerald-600 transition-colors duration-200 hover:text-emerald-700 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

