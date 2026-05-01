import { DB_NAME, DB_VERSION } from "./app.js";

document.getElementById("clearPsychomotorBtn")?.addEventListener("click", () => {
  const confirmDelete = confirm(
    "⚠️ Are you sure you want to delete ALL records in both the 'psychomotor' and 'remark' stores?\n\nThis action cannot be undone!"
  );

  if (!confirmDelete) return;

  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onsuccess = (e) => {
    const db = e.target.result;

    // ✅ Check for required stores
    const stores = ["psychomotor", "remark"];
    const missing = stores.filter((s) => !db.objectStoreNames.contains(s));

    if (missing.length > 0) {
      alert(`⚠️ The following stores do not exist: ${missing.join(", ")}`);
      return;
    }

    // ✅ Start one transaction for both stores
    const tx = db.transaction(stores, "readwrite");

    const clearStore = (storeName) => {
      return new Promise((resolve, reject) => {
        const store = tx.objectStore(storeName);
        const clearReq = store.clear();
        clearReq.onsuccess = () => resolve();
        clearReq.onerror = () => reject(clearReq.error);
      });
    };

    Promise.all([clearStore("psychomotor"), clearStore("remark")])
      .then(() => {
        alert("✅ All psychomotor and remark data cleared successfully!");
      })
      .catch((err) => {
        console.error("Error clearing stores:", err);
        alert("❌ Failed to clear one or more stores. Check console for details.");
      });
  };

  req.onerror = () => {
    alert("❌ Error opening database!");
  };
});
