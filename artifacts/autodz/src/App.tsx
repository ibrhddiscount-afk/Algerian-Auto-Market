import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Listings from "@/pages/Listings";
import ListingDetail from "@/pages/ListingDetail";
import PostAd from "@/pages/PostAd";
import Account from "@/pages/Account";
import AuthPage from "@/pages/Auth";
import NotFound from "@/pages/not-found";
import { configureApiAuth } from "@/lib/auth";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

const queryClient = new QueryClient();
configureApiAuth();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/annonces" component={Listings} />
      <Route path="/annonces/:id" component={ListingDetail} />
      <Route path="/deposer-annonce" component={PostAd} />
      <Route path="/connexion" component={AuthPage} />
      <Route path="/mon-compte" component={ProtectedAccount} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ProtectedAccount() {
  const [, navigate] = useLocation();
  const { user, isDevFallback } = useAuth();

  if (user || isDevFallback) return <Account />;

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Connexion requise</h1>
        <p className="text-sm text-gray-500 mb-6">
          Connectez-vous pour consulter vos annonces, vos favoris et votre profil.
        </p>
        <button
          onClick={() => navigate("/connexion?redirect=/mon-compte")}
          className="bg-[#1a7a3c] hover:bg-[#15632f] text-white font-bold text-sm rounded-xl px-6 py-3"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Navbar />
              <div className="flex-1">
                <Router />
              </div>
              <Footer />
            </div>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
