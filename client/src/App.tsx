import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MovieDetails from "@/pages/movie/[id]";
import Watchlist from "@/pages/watchlist";
import Auth from "@/pages/auth";
import AdminUsers from "@/pages/admin/users";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Layout } from "@/components/layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/auth" component={Auth} />
        <ProtectedRoute path="/" component={Home} />
        <ProtectedRoute path="/movie/:id" component={MovieDetails} />
        <ProtectedRoute path="/watchlist" component={Watchlist} />
        <ProtectedRoute path="/admin/users" component={AdminUsers} requireAdmin />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;