import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import Index from "./pages/index";
import AnalisesPage from "./pages/analises";
import AgendarPage from "./pages/agendar";
import AcompanharPage from "./pages/acompanhar";
import AdminPage from "./pages/admin";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

function ScrollTop() {
  const [loc] = useLocation();
  useEffect(() => {
    if (window.location.hash) {
      document.querySelector(window.location.hash)?.scrollIntoView();
    } else window.scrollTo(0, 0);
  }, [loc]);
  return null;
}

function App() {
  return (
    <Provider>
      <ScrollTop />
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/analises" component={AnalisesPage} />
        <Route path="/agendar" component={AgendarPage} />
        <Route path="/acompanhar" component={AcompanharPage} />
        <Route path="/acompanhar/:code" component={AcompanharPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={Index} />
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
