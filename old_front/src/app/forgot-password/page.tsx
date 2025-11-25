"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import AuthLayout from "@/app/components/auth/AuthLayout";
import AuthInput from "@/app/components/auth/AuthInput";
import AuthButton from "@/app/components/auth/AuthButton";
import AuthAlert from "@/app/components/auth/AuthAlert";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Erreur lors de l’envoi");
      } else {
        setMessage(
          "✅ Si cet email est enregistré, un lien de réinitialisation a été envoyé."
        );
      }
    } catch (err: unknown) {
      console.error("forgot-password error", err);
      setError("Erreur serveur, réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Mot de passe oublié"
      subtitle="Récupérez l'accès à votre compte"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          type="email"
          placeholder="Entrez votre email"
          value={email}
          onChange={setEmail}
          label="Email professionnel"
          icon={Mail}
          required
        />

        {error && <AuthAlert type="error" message={error} />}
        {message && <AuthAlert type="success" message={message} />}

        <AuthButton
          type="submit"
          loading={loading}
          loadingText="Envoi en cours..."
          icon={Send}
        >
          Envoyer le lien
        </AuthButton>

        <div className="text-center">
          <p className="text-sm text-slate-600 mb-3">
            Vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
          </p>
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
