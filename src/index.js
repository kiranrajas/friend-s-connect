import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';
 // or './App.css' wherever you added Tailwind directives
import { BrowserRouter } from "react-router-dom";
import { cleanupDeletedUsersMessages } from "./firebase";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
  // Remove <YourRoutes> from here, it’s not needed
);
//import { cleanupDeletedUsersMessages } from "./firebase";
<BrowserRouter future={{ 
  v7_startTransition: true, 
  v7_relativeSplatPath: true 
}} basename="/friend-s-connect">
  <App />
</BrowserRouter>

// Call the cleanup function once when the app starts
cleanupDeletedUsersMessages();
