"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Shield, Mail, Key } from "lucide-react";
import AuthLayout from "@/app/components/auth/AuthLayout";
import AuthInput from "@/app/components/auth/AuthInput";
import AuthButton from "@/app/components/auth/AuthButton";
import AuthAlert from "@/app/components/auth/AuthAlert";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [twoFA, setTwoFA] = useState({ 
    required: false, 
    method: "", 
    code: "", 
    pendingEmail: "", 
    verifying: false, 
    resending: false 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();
      console.log("📩 Réponse backend login:", data);

      if (!res.ok) {
        setError(data.message || "Erreur de connexion");
        return;
      }

      if (data.twoFactorRequired) {
        setTwoFA({ 
          required: true, 
          method: data.method || "email", 
          code: "", 
          pendingEmail: email, 
          verifying: false, 
          resending: false 
        });
        return;
      }

      if (!data.user || !data.user.role) {
        setError("Utilisateur invalide ou rôle manquant");
        return;
      }

      login(data.user, data.token);

      setTimeout(() => {
        switch (data.user.role) {
          case "national":
            router.push("/dashboard/national");
            break;
          case "regional":
            router.push("/dashboard/regional");
            break;
          case "district":
            router.push("/agent/dashboard"); // District utilise le même dashboard que agent
            break;
          case "agent":
            router.push("/agent/dashboard");
            break;
          default:
            router.push("/dashboard/parent");
        }
      }, 100);
    } catch (err) {
      console.error("❌ Erreur côté frontend login:", err);
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFA.code || !twoFA.pendingEmail) return;
    try {
      setTwoFA((s) => ({ ...s, verifying: true }));
      const res = await fetch("http://localhost:5000/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: twoFA.pendingEmail, code: twoFA.code }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Code invalide");
        return;
      }
      if (!data.user || !data.user.role) {
        setError("Utilisateur invalide ou rôle manquant");
        return;
      }
      login(data.user, data.token);
      switch (data.user.role) {
        case "national":
          router.push("/dashboard/national");
          break;
        case "regional":
          router.push("/dashboard/regional");
          break;
        case "district":
          router.push("/agent/dashboard"); // District utilise le même dashboard que agent
          break;
        case "agent":
          router.push("/agent/dashboard");
          break;
        default:
          router.push("/dashboard/parent");
      }
    } catch (err) {
      setError("Erreur serveur");
    } finally {
      setTwoFA((s) => ({ ...s, verifying: false }));
    }
  };

  const handleResend = async () => {
    try {
      setTwoFA((s) => ({ ...s, resending: true }));
      await fetch("http://localhost:5000/api/auth/2fa/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: twoFA.pendingEmail }),
        credentials: "include",
      });
    } catch {}
    finally {
      setTwoFA((s) => ({ ...s, resending: false }));
    }
  };

  if (!twoFA.required) {
    return (
      <AuthLayout title="Connexion">
        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthInput
            type="email"
            placeholder="nom@exemple.com"
            value={email}
            onChange={setEmail}
            label="Email professionnel"
            icon={Mail}
            required
          />

          <AuthInput
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
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors duration-200 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Vérification en deux étapes" subtitle={`Entrez le code à 6 chiffres envoyé par ${twoFA.method === "sms" ? "SMS" : "email"}`}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
          <Shield className="w-8 h-8 text-emerald-600" />
        </div>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <AuthInput
          type="text"
          placeholder="000000"
          value={twoFA.code}
          onChange={(value) => setTwoFA({ ...twoFA, code: value })}
          label="Code de vérification"
          icon={Shield}
          maxLength={6}
        />

        {error && <AuthAlert type="error" message={error} />}

        <AuthButton
          type="submit"
          loading={twoFA.verifying}
          loadingText="Vérification..."
          icon={Shield}
        >
          Valider le code
        </AuthButton>

        <AuthButton
          type="button"
          variant="secondary"
          loading={twoFA.resending}
          loadingText="Renvoi en cours..."
          onClick={handleResend}
        >
          Renvoyer le code
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
