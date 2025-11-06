let db;
import { DB_NAME, DB_VERSION } from './app.js';

const STORES = ["firstTerm", "attendance"];

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  // open DB
  const openReq = indexedDB.open(DB_NAME, DB_VERSION);
  openReq.onupgradeneeded = (e) => {
    db = e.target.result;
    console.log('onupgradeneeded', db.name, db.version);
  };
  openReq.onsuccess = (e) => {
    db = e.target.result;
    console.log(`Database opened successfully: ${DB_NAME} v${db.version}`);
  };
  openReq.onerror = (e) => {
    console.error("Error opening database!", e);
  };

  // --- helpers -----------------------------------------------------------
  function getAllAsync(store) {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
  function getAsync(store, key) {
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Normalize ID fields from incoming records and existing records
  function readClassId(rec) {
    if (!rec) return null;
    return rec.classID ?? rec.class ?? rec.classId ?? rec.class_id ?? rec.classid ?? null;
  }
  function readStudentId(rec) {
    if (!rec) return null;
    return rec.studentID ?? rec.studentId ?? rec.student_id ?? rec.student ?? rec.studentid ?? null;
  }

  // --- UI wiring (safe) -------------------------------------------------
  const importBtn = document.getElementById("importBtn");
  if (importBtn) {
    importBtn.addEventListener("click", () => {
      const f = document.getElementById("importFile");
      if (f) f.click();
      else console.warn("importFile input not found");
    });
    console.log("importBtn listener attached");
  } else {
    console.warn("importBtn not found in DOM");
  }

  const importFile = document.getElementById("importFile");
  if (importFile) {
    importFile.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        console.log("File loaded for replace/import:", data);
        importIndexedDB(DB_NAME, data);
      } catch (err) {
        alert("Invalid file or format!");
        console.error(err);
      }
    });
    console.log("importFile listener attached");
  } else {
    console.warn("importFile input not found in DOM");
  }

  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportFirstTermData);
    console.log("exportBtn listener attached");
  } else {
    console.warn("exportBtn not found in DOM");
  }

  const importFirstTermBtn = document.getElementById("importFirstTermBtn");
  if (importFirstTermBtn) {
    importFirstTermBtn.addEventListener("click", () => {
      const f = document.getElementById("importFirstTermFile");
      if (f) f.click();
      else console.warn("importFirstTermFile input not found");
    });
    console.log("importFirstTermBtn listener attached");
  } else {
    console.warn("importFirstTermBtn not found in DOM");
  }

  const importFirstTermFile = document.getElementById("importFirstTermFile");
  if (importFirstTermFile) {
    importFirstTermFile.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    console.log("File loaded for merge:", data);
    importFirstTermData(data); // ✅ use correct function name
  } catch (err) {
    alert("Invalid file format!");
    console.error("❌ Error parsing file:", err);
  }
});

    console.log("importFirstTermFile listener attached");
  } else {
    console.warn("importFirstTermFile not found in DOM");
  }

  // --- import whole DB (replace) ----------------------------------------
  function importIndexedDB(DB_NAME, data) {
    const storeNames = Object.keys(data || {});
    console.log("Stores to import:", storeNames);

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = (event) => {
      const db = event.target.result;
      // filter to stores that actually exist, otherwise transaction will fail
      const toImport = storeNames.filter(n => db.objectStoreNames.contains(n));
      if (toImport.length === 0) {
        alert("No matching stores in database to import.");
        return;
      }

      const tx = db.transaction(toImport, "readwrite");
      toImport.forEach(name => {
        const store = tx.objectStore(name);
        store.clear().onsuccess = () => {
          console.log(`Cleared store: ${name}`);
          if (Array.isArray(data[name])) {
            data[name].forEach(record => {
              try { store.add(record); } catch (err) { console.warn("add failed, trying put", err); store.put(record); }
            });
            console.log(`Added ${data[name].length} records to store: ${name}`);
          }
        };
      });

      tx.oncomplete = () => {
        console.log("✅ Import complete");
        alert("Database updated successfully!");
      };
      tx.onerror = err => {
        console.error("Transaction error:", err);
        alert("Error updating database");
      };
    };

    req.onerror = () => {
      console.error("Error opening database for import");
      alert("Error opening database!");
    };
  }

  // --- export firstTerm + attendance -----------------------------------
  function exportFirstTermData() {
  const transaction = db.transaction('firstTerm', 'readonly');
  const store = transaction.objectStore('firstTerm');
  const request = store.getAll();

  request.onsuccess = (event) => {
    const data = event.target.result;

    // Remove 'id' from each record before exporting
    const exportData = data.map(({ id, ...rest }) => rest);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "firstTerm-export.json";
    a.click();
    URL.revokeObjectURL(url);

    console.log(`✅ Exported ${exportData.length} records (without IDs).`);
  };

  request.onerror = () => {
    console.error("❌ Failed to export data from firstTerm.");
  };
}


  function saveFile(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${DB_NAME} firstTermData.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // --- import & merge firstTerm with conflict check ---------------------
 function importFirstTermData(data) {
  const newRecords = Array.isArray(data) ? data : data.firstTerm;
  if (!newRecords) {
    alert("Invalid file: expected an array or { firstTerm: [...] }");
    return;
  }

  const transaction = db.transaction('firstTerm', 'readwrite');
  const store = transaction.objectStore('firstTerm');

  let addedCount = 0;

  newRecords.forEach(rec => {
    // Remove any 'id' to avoid key conflicts
    if ('id' in rec) delete rec.id;

    try {
      store.add(rec);
      addedCount++;
    } catch (err) {
      console.warn("Skipping record due to add() error:", err);
    }
  });

  transaction.oncomplete = () => {
    alert(`✅ Imported ${addedCount} new record(s) successfully.`);
  };

  transaction.onerror = (e) => {
    console.error("❌ Error during import:", e);
    alert("Error occurred while importing records.");
  };
}

})
