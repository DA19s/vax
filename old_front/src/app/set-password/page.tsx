"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Key, Save, CheckCircle } from "lucide-react";
import AuthLayout from "@/app/components/auth/AuthLayout";
import AuthInput from "@/app/components/auth/AuthInput";
import AuthButton from "@/app/components/auth/AuthButton";
import AuthAlert from "@/app/components/auth/AuthAlert";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Lien invalide ou expiré.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de définir le mot de passe.");
      }

      setSuccess(true);

      // 🔄 Redirection après 2 secondes
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur inconnue");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout 
        title="Mot de passe défini"
        subtitle="Votre mot de passe a été enregistré avec succès"
        showHelpSection={false}
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <AuthAlert 
            type="success" 
            message="✅ Mot de passe enregistré avec succès. Redirection vers la connexion…" 
          />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Définir votre mot de passe"
      subtitle="Créez un mot de passe sécurisé pour votre compte"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={setPassword}
          label="Nouveau mot de passe"
          icon={Key}
          required
        />

        <AuthInput
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={setConfirmPassword}
          label="Confirmer le mot de passe"
          icon={Key}
          required
        />

        {error && <AuthAlert type="error" message={error} />}

        <AuthButton
          type="submit"
          loading={loading}
          loadingText="Enregistrement…"
          icon={Save}
        >
          Définir le mot de passe
        </AuthButton>

        <div className="text-center">
          <p className="text-sm text-slate-600">
            Le mot de passe doit contenir au moins 6 caractères.
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
