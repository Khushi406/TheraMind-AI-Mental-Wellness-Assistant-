import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from '@/pages/AuthPage';
import JournalPage from './pages/JournalPage';
import DashboardPage from './pages/DashboardPage';
import InsightsPage from './pages/InsightsPage';
import AIInsightsPage from './pages/AIInsightsPage';
import Header from './components/Header';
import Footer from './components/Footer';
import AITherapistChat from './components/AITherapistChat';
import { isAuthenticated } from './lib/auth';

// Protected Route Component
function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const [, setLocation] = useLocation();
  
  if (!isAuthenticated()) {
    setLocation('/auth');
    return null;
  }
  
  return <Component />;
}

function Router() {
  const authenticated = isAuthenticated();
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      {authenticated && <Header />}
      <div className="flex-grow">
        <Switch>
          <Route path="/auth" component={AuthPage}/>
          <Route path="/">
            {authenticated ? <Redirect to="/journal" /> : <Redirect to="/auth" />}
          </Route>
          <Route path="/journal">
            <ProtectedRoute component={JournalPage} />
          </Route>
          <Route path="/dashboard">
            <ProtectedRoute component={DashboardPage} />
          </Route>
          <Route path="/insights">
            <ProtectedRoute component={InsightsPage} />
          </Route>
          <Route path="/ai-insights">
            <ProtectedRoute component={AIInsightsPage} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
      {authenticated && <Footer />}
      {authenticated && <AITherapistChat />}
    </div>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
