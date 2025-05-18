import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import JournalPage from './pages/JournalPage';
import DashboardPage from './pages/DashboardPage';
import InsightsPage from './pages/InsightsPage';
import Header from './components/Header';
import Footer from './components/Footer';

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={JournalPage}/>
          <Route path="/dashboard" component={DashboardPage}/>
          <Route path="/insights" component={InsightsPage}/>
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
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
