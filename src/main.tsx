// unleash your creativity and write your code here.

import { createRoot } from "react-dom/client";
import App from "./App.tsx"
import "./index.css";

// Prevent pinch-zoom and all forms of scaling on iOS and other devices
// Gesture events for iOS
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
});
document.addEventListener('gesturechange', function(e) {
  e.preventDefault();
});
document.addEventListener('gestureend', function(e) {
  e.preventDefault();
});

// Touch events for more control
document.addEventListener('touchmove', function(e) {
  // Prevent zooming by disabling two-finger touch
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent double-tap zoom on iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Prevent multi-touch gestures that could cause zoom
document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// Force viewport to remain at scale 1.0
function enforceNoZoom() {
  document.body.style.zoom = '1';
  document.body.style.transform = 'scale(1)';
  document.body.style.transformOrigin = '0 0';
  
  // Reset viewport if it somehow got scaled
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
}

// Enforce no zoom initially and on orientation change
window.addEventListener('load', enforceNoZoom);
window.addEventListener('orientationchange', enforceNoZoom);
window.addEventListener('resize', enforceNoZoom);

createRoot(document.getElementById("root")!).render(
  <App />
);
