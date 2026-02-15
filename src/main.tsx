import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "./context/AppContext.tsx";
import "leaflet/dist/leaflet.css";
import { SocketProvider } from "./context/SocketContext.tsx";

export const authService = "https://auths-ztk3.onrender.com";
export const restaurantService = "https://restaurantjanuary-1.onrender.com";
export const utilsService = "https://utilsjanuary.onrender.com";
export const realtimeService = "https://realtimejanuary.onrender.com";
export const riderService = "https://riderjanuary.onrender.com";
export const adminService = "https://adminjanuary.onrender.com";

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
