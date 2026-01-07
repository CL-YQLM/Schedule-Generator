import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Results from "@/pages/Results";
import { Header } from "@/components/Header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/results" component={Results} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background flex flex-col font-sans">
            <Header />
            <div className="flex-1">
              <Router />
            </div>
            <Toaster />
          </div>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
