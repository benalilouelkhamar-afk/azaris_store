import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "./store.jsx";
import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import "./styles.css";

const isAdmin = () => /^#\/?admin/.test(location.hash);

function App() {
  const [admin, setAdmin] = useState(isAdmin);
  useEffect(() => {
    const f = () => { const a = isAdmin(); setAdmin(a); if (!a && location.hash === "#top") scrollTo(0, 0); };
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return admin ? <Admin /> : <Home />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>
);
