import { DB_NAME, DB_VERSION } from "./app.js";

document.getElementById("clearPsychomotorBtn")?.addEventListener("click", () => {
  const confirmDelete = confirm(
    "⚠️ Are you sure you want to delete ALL records in the psychomotor store?\n\nThis action cannot be undone!"
  );

  if (!confirmDelete) return;

  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onsuccess = (e) => {
    const db = e.target.result;

    if (!db.objectStoreNames.contains("psychomotor")) {
      alert("No psychomotor store found in this database.");
      return;
    }

    const tx = db.transaction("psychomotor", "readwrite");
    const store = tx.objectStore("psychomotor");

    const clearReq = store.clear();

    clearReq.onsuccess = () => {
      alert("✅ All psychomotor data cleared successfully!");
    };

    clearReq.onerror = () => {
      console.error("Error clearing psychomotor data:", clearReq.error);
      alert("❌ Failed to clear psychomotor data. Check console for details.");
    };
  };

  req.onerror = () => {
    alert("Error opening database!");
  };
});
