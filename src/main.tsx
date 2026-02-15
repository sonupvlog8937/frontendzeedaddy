import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "./context/AppContext.tsx";
import "leaflet/dist/leaflet.css";
import { SocketProvider } from "./context/SocketContext.tsx";

export const authService = "https://auths-gules.vercel.app";
export const restaurantService = "https://restaurantjanuary.vercel.app";
export const utilsService = "https://utilsjanuary-6awg.vercel.app";
export const realtimeService = "https://realtimejanuary.vercel.app";
export const riderService = "https://riderjanuary-8bxg.vercel.app";
export const adminService = "https://adminjanuary.vercel.app";

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
