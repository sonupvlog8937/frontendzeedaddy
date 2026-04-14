import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "./context/AppContext.tsx";
import "leaflet/dist/leaflet.css";
import { SocketProvider } from "./context/SocketContext.tsx";

export const authService = "https://resurantserver.onrender.com";
export const restaurantService = "https://resurantserver.onrender.com";
export const utilsService = "https://resurantserver.onrender.com";
export const realtimeService = "https://resurantserver.onrender.com";
export const riderService = "https://resurantserver.onrender.com";
export const adminService = "https://resurantserver.onrender.com";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="868759646248-hibmlvqerp2mtjn3rfhif9scn4jubae0.apps.googleusercontent.com">
      <AppProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AppProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
