import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={qc}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);
