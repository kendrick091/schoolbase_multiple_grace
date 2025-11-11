import { DB_NAME, DB_VERSION } from './app.js';

let db;

// ========================= EXPORT BOTH STORES =========================
function exportPsychomotorAndRemark() {
  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onsuccess = (e) => {
    const db = e.target.result;

    // ✅ Ensure stores exist
    const stores = ["psychomotor", "remark"];
    const missing = stores.filter(s => !db.objectStoreNames.contains(s));
    if (missing.length > 0) {
      alert(`⚠️ Missing object store(s): ${missing.join(", ")}`);
      return;
    }

    // Read both stores
    const tx = db.transaction(stores, "readonly");
    const data = {};

    const getStoreData = (storeName) => {
      return new Promise((resolve, reject) => {
        const store = tx.objectStore(storeName);
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => resolve(getAllReq.result);
        getAllReq.onerror = () => reject(getAllReq.error);
      });
    };

    Promise.all([
      getStoreData("psychomotor"),
      getStoreData("remark"),
    ]).then(([psychomotorData, remarkData]) => {
      data.psychomotor = psychomotorData;
      data.remark = remarkData;
      saveFile(data, "recordsData.json");
    }).catch((err) => {
      console.error("Export error:", err);
      alert("❌ Error exporting data!");
    });
  };
}

// ========================= SAVE FILE =========================
function saveFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ========================= IMPORT BOTH STORES =========================
function importPsychomotorAndRemark(data) {
  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onsuccess = (e) => {
    const db = e.target.result;
    const stores = ["psychomotor", "remark"];
    const missing = stores.filter(s => !db.objectStoreNames.contains(s));
    if (missing.length > 0) {
      alert(`⚠️ Missing object store(s): ${missing.join(", ")}`);
      return;
    }

    // ✅ Import Psychomotor first
    importStore(db, "psychomotor", data.psychomotor || [], "psychomotor_session_term")
      .then((psychReport) => {
        // ✅ Then import Remark
        return importStore(db, "remark", data.remark || []);
      })
      .then((remarkReport) => {
        alert(
          `✅ Import Complete!\n\n` +
          `📘 Psychomotor:\n  Added: ${remarkReport.psychAdded}\n  Updated: ${remarkReport.psychUpdated}\n  Skipped: ${remarkReport.psychSkipped}\n\n` +
          `💬 Remark:\n  Added: ${remarkReport.remarkAdded}\n  Updated: ${remarkReport.remarkUpdated}\n  Skipped: ${remarkReport.remarkkipped}`
        );
      })
      .catch((err) => {
        console.error("Import error:", err);
        alert("❌ Error importing data!");
      });
  };
}

// ========================= IMPORT LOGIC (GENERIC) =========================
function importStore(db, storeName, records, indexName = null) {
  return new Promise((resolve) => {
    if (!records.length) {
      console.log(`No ${storeName} records to import.`);
      return resolve({ added: 0, updated: 0, skipped: 0 });
    }

    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const index = indexName && store.index ? store.index(indexName) : null;

    let added = 0;
    let updated = 0;
    let skipped = 0;

    const processRecord = (rec, next) => {
      if (!index) {
        // If store has no index, just use ID as unique key
        store.get(rec.id).onsuccess = (e) => {
          const existing = e.target.result;
          if (existing) {
            const confirmUpdate = confirm(
              `Update existing ${storeName} record with ID: ${rec.id}?`
            );
            if (confirmUpdate) {
              store.put(rec);
              updated++;
            } else skipped++;
          } else {
            store.add(rec);
            added++;
          }
          next();
        };
      } else {
        // For indexed lookups (psychomotor)
        const key = [rec.studentID, rec.session, rec.term];
        const getReq = index.get(key);

        getReq.onsuccess = () => {
          const existing = getReq.result;
          if (existing) {
            const confirmUpdate = confirm(
              `A ${storeName} record already exists for:\n\n` +
              `Student ID: ${rec.studentID}\nSession: ${rec.session}\nTerm: ${rec.term}\n\n` +
              `Do you want to update it?`
            );
            if (confirmUpdate) {
              store.put({ ...existing, ...rec });
              updated++;
            } else skipped++;
          } else {
            store.add(rec);
            added++;
          }
          next();
        };

        getReq.onerror = () => {
          console.error("Error checking record:", getReq.error);
          next();
        };
      }
    };

    // Sequentially process records to avoid race issues
    let i = 0;
    const processNext = () => {
      if (i < records.length) {
        processRecord(records[i], processNext);
        i++;
      } else {
        tx.oncomplete = () => resolve({
          [`${storeName}Added`]: added,
          [`${storeName}Updated`]: updated,
          [`${storeName}Skipped`]: skipped,
        });
      }
    };

    processNext();
  });
}

// ========================= EVENT LISTENERS =========================
document.getElementById("exportPsychomotorBtn")
  ?.addEventListener("click", exportPsychomotorAndRemark);

document.getElementById("importPsychomotorBtn")
  ?.addEventListener("click", () => {
    document.getElementById("importPsychomotorFile").click();
  });

document.getElementById("importPsychomotorFile")
  ?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.psychomotor || data.remark) {
        importPsychomotorAndRemark(data);
      } else {
        alert("⚠️ Invalid file format! Missing psychomotor or remark data.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error reading file!");
    }
  });
