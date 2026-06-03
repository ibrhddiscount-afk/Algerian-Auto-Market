import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AlertCircle, Car, CheckCircle, Loader2, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type AuthMode = "signin" | "signup";

function getRedirectPath() {
  if (typeof window === "undefined") return "/mon-compte";

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  return redirect?.startsWith("/") ? redirect : "/mon-compte";
}

function getErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error && error.message ? error.message : "";
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (normalized.includes("email not confirmed")) return "Veuillez confirmer votre email avant de vous connecter.";
  if (normalized.includes("user already registered") || normalized.includes("already registered")) return "Un compte existe déjà avec cet email.";
  if (normalized.includes("password should be at least") || normalized.includes("password")) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (normalized.includes("signup is disabled")) return "L'inscription est désactivée pour le moment.";
  if (rawMessage) return "Impossible de terminer l'authentification pour le moment.";

  return "Impossible de terminer l'authentification pour le moment.";
}

export default function AuthPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user, isConfigured, isDevFallback, signIn, signUp } = useAuth();
  const redirectPath = useMemo(getRedirectPath, []);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(redirectPath);
  }, [navigate, redirectPath, user]);

  const resetFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await signUp(email.trim(), password, name.trim());

        if (result.needsEmailConfirmation) {
          setSuccess("Compte créé. Vérifiez votre email pour confirmer l'inscription.");
          return;
        }
      } else {
        await signIn(email.trim(), password);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/account"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/favorites"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/listings"] }),
      ]);
      navigate(redirectPath);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 bg-[#1a7a3c] rounded-2xl flex items-center justify-center shadow-lg shadow-[#1a7a3c]/20 mb-4">
          <Car className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          {mode === "signin" ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Accédez à vos annonces, favoris et informations vendeur.
        </p>
      </div>

      {!isConfigured ? (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-extrabold text-gray-900 text-sm">Supabase Auth non configuré</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` pour activer la vraie connexion.
              </p>
            </div>
          </div>
          {isDevFallback && (
            <button
              onClick={() => navigate(redirectPath)}
              className="w-full mt-5 bg-[#1a7a3c] hover:bg-[#15632f] text-white rounded-xl py-3 text-sm font-bold"
            >
              Continuer en mode dev
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-1">
            {[
              ["signin", "Connexion"],
              ["signup", "Inscription"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setMode(value as AuthMode); resetFeedback(); }}
                className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                  mode === value ? "bg-white text-[#1a7a3c] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <label className="block">
              <span className="text-xs font-bold text-gray-600">Nom complet</span>
              <div className="relative mt-1">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/30"
                  placeholder="Ahmed Benali"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-bold text-gray-600">Email</span>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/30"
                placeholder="vous@email.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-gray-600">Mot de passe</span>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/30"
                placeholder="••••••••"
              />
            </div>
          </label>

          {error && (
            <p className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs font-semibold text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}

          {success && (
            <p className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-xl p-3 text-xs font-semibold text-green-700">
              <CheckCircle className="w-4 h-4 shrink-0" /> {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#1a7a3c] hover:bg-[#15632f] disabled:bg-gray-300 text-white rounded-xl py-3 text-sm font-bold"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>
      )}
    </div>
  );
}
