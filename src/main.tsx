// unleash your creativity and write your code here.

import { createRoot } from "react-dom/client";
import App from "./App.tsx"
import "./index.css";

// Prevent pinch-zoom on iOS
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
});
document.addEventListener('gesturechange', function(e) {
  e.preventDefault();
});
document.addEventListener('gestureend', function(e) {
  e.preventDefault();
});

// Prevent double-tap zoom on iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

createRoot(document.getElementById("root")!).render(
  <App />
);
