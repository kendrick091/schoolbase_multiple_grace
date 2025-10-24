let deferredPrompt;
const installBtn = document.getElementById("install-btn");

window.addEventListener("beforeinstallprompt", (e) => {
  // Stop auto-banner
  e.preventDefault();
  deferredPrompt = e;

  // Show your custom button
  installBtn.style.display = "block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  // Show the real install prompt
  deferredPrompt.prompt();

  // Wait for user action
  const { outcome } = await deferredPrompt.userChoice;
  console.log("User choice:", outcome);

  // Reset
  deferredPrompt = null;
  installBtn.style.display = "none";
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New update available
          installBtn.style.display = 'block';
          installBtn.textContent = 'Update App';
          installBtn.onclick = () => {
            newWorker.postMessage({ action: 'skipWaiting' });
          };
        }
      });
    });
  });

  // Refresh page when new service worker takes control
  let refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });
}

