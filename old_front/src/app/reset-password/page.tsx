"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Key, RefreshCw, AlertTriangle } from "lucide-react";
import AuthLayout from "@/app/components/auth/AuthLayout";
import AuthInput from "@/app/components/auth/AuthInput";
import AuthButton from "@/app/components/auth/AuthButton";
import AuthAlert from "@/app/components/auth/AuthAlert";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.message || data.error || "Erreur lors de la réinitialisation"
        );
      } else {
        setMessage("✅ Mot de passe réinitialisé avec succès !");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err: unknown) {
      console.error("reset-password error", err);
      setError("Erreur serveur, réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout 
        title="Lien invalide"
        subtitle="Le lien de réinitialisation est invalide ou a expiré"
        showHelpSection={false}
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <AuthAlert 
            type="error" 
            message="❌ Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation." 
          />
          
          <a 
            href="/forgot-password" 
            className="inline-block text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors duration-200 hover:underline"
          >
            Demander un nouveau lien
          </a>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Réinitialiser le mot de passe"
      subtitle="Choisissez un nouveau mot de passe sécurisé"
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
          placeholder="Confirmez le mot de passe"
          value={confirm}
          onChange={setConfirm}
          label="Confirmer le mot de passe"
          icon={Key}
          required
        />

        {error && <AuthAlert type="error" message={error} />}
        {message && <AuthAlert type="success" message={message} />}

        <AuthButton
          type="submit"
          loading={loading}
          loadingText="Réinitialisation..."
          icon={RefreshCw}
        >
          Réinitialiser
        </AuthButton>

        <div className="text-center">
          <a 
            href="/login" 
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors duration-200 hover:underline"
          >
            Retour à la connexion
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}
