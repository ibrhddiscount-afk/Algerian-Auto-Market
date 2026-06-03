import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart, User, Plus, Menu, X, ChevronDown, Car, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

function initials(nameOrEmail: string) {
  return nameOrEmail
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD";
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user, isDevFallback, signOut } = useAuth();
  const accountLabel = user?.name ?? user?.email ?? (isDevFallback ? "Mode dev" : "Connexion");
  const isAuthenticated = Boolean(user);

  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    navigate("/");
  };

  const navLink = (href: string, label: string) => (
    <button
      key={label}
      onClick={() => navigate(href)}
      className={`text-sm font-medium transition-colors ${
        isActive(href)
          ? "text-[#1a7a3c] font-semibold border-b-2 border-[#1a7a3c] pb-0.5"
          : "text-gray-700 hover:text-[#1a7a3c]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 bg-[#1a7a3c] rounded-lg">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <div className="font-bold text-gray-900 text-lg tracking-tight">AutoDZ</div>
              <div className="text-[10px] text-gray-500 -mt-0.5">Le marché auto en Algérie</div>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className={`text-sm font-medium transition-colors ${
                location === "/"
                  ? "text-[#1a7a3c] font-semibold border-b-2 border-[#1a7a3c] pb-0.5"
                  : "text-gray-700 hover:text-[#1a7a3c]"
              }`}
            >
              Accueil
            </button>

            {/* Acheter dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setBuyerOpen(true)}
              onMouseLeave={() => setBuyerOpen(false)}
            >
              <button
                onClick={() => navigate("/annonces")}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  isActive("/annonces")
                    ? "text-[#1a7a3c] font-semibold"
                    : "text-gray-700 hover:text-[#1a7a3c]"
                }`}
              >
                Acheter <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {buyerOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  {[
                    ["Toutes les annonces", "/annonces"],
                    ["Voitures neuves",     "/annonces"],
                    ["Voitures d'occasion", "/annonces"],
                    ["SUV / 4x4",           "/annonces"],
                    ["Utilitaires",         "/annonces"],
                  ].map(([label, href]) => (
                    <button
                      key={label}
                      onClick={() => { navigate(href); setBuyerOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1a7a3c]"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/deposer-annonce")}
              className={`text-sm font-medium transition-colors ${
                isActive("/deposer-annonce")
                  ? "text-[#1a7a3c] font-semibold border-b-2 border-[#1a7a3c] pb-0.5"
                  : "text-gray-700 hover:text-[#1a7a3c]"
              }`}
            >
              Vendre
            </button>

            {["Concessionnaires", "Blog", "Contact"].map(label => (
              <button key={label} className="text-sm font-medium text-gray-700 hover:text-[#1a7a3c] transition-colors">
                {label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => navigate(isAuthenticated || isDevFallback ? "/mon-compte" : "/connexion?redirect=/mon-compte")}
              className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-[#1a7a3c] transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span>Favoris</span>
            </button>
            <button
              onClick={() => navigate(isAuthenticated || isDevFallback ? "/mon-compte" : "/connexion?redirect=/mon-compte")}
              className={`flex items-center gap-1.5 text-sm transition-colors ${isActive("/mon-compte") || isActive("/connexion") ? "text-[#1a7a3c] font-semibold" : "text-gray-700 hover:text-[#1a7a3c]"}`}
            >
              {isAuthenticated ? (
                <span className="w-7 h-7 rounded-full bg-[#f0faf4] border border-[#1a7a3c]/20 text-[#1a7a3c] text-[10px] font-extrabold flex items-center justify-center">
                  {initials(accountLabel)}
                </span>
              ) : (
                <User className="w-4 h-4" />
              )}
              <span>{isAuthenticated || isDevFallback ? accountLabel : "Connexion"}</span>
            </button>
            {isAuthenticated && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            )}
            <button
              onClick={() => navigate("/deposer-annonce")}
              className="flex items-center gap-1.5 bg-[#1a7a3c] hover:bg-[#15632f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Déposer une annonce
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:text-[#1a7a3c]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 space-y-1">
            {[
              ["Accueil",         "/"],
              ["Acheter",         "/annonces"],
              ["Vendre",          "/deposer-annonce"],
              ["Concessionnaires","#"],
              ["Blog",            "#"],
              ["Contact",         "#"],
              ["Favoris",         isAuthenticated || isDevFallback ? "/mon-compte" : "/connexion?redirect=/mon-compte"],
              [isAuthenticated || isDevFallback ? accountLabel : "Connexion", isAuthenticated || isDevFallback ? "/mon-compte" : "/connexion?redirect=/mon-compte"],
            ].map(([label, href]) => (
              <button
                key={label}
                onClick={() => { navigate(href); setMobileOpen(false); }}
                className={`block w-full text-left text-sm font-medium py-2 px-1 rounded-lg transition-colors ${
                  location === href ? "text-[#1a7a3c] bg-[#f0faf4]" : "text-gray-700 hover:text-[#1a7a3c] hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => { void handleSignOut(); setMobileOpen(false); }}
                className="block w-full text-left text-sm font-medium py-2 px-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                Déconnexion
              </button>
            )}
            <button
              onClick={() => { navigate("/deposer-annonce"); setMobileOpen(false); }}
              className="flex items-center justify-center gap-2 w-full bg-[#1a7a3c] hover:bg-[#15632f] text-white text-sm font-semibold px-4 py-2.5 rounded-xl mt-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Déposer une annonce
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
