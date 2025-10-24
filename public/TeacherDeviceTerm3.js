let db;
import { DB_NAME, DB_VERSION } from './app.js';

const STORES = ["thirdTerm", "attendance"];

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

  const exportBtn3 = document.getElementById("exportBtn3");
  if (exportBtn3) {
    exportBtn3.addEventListener("click", exportthirdTermData);
    console.log("exportBtn3 listener attached");
  } else {
    console.warn("exportBtn3 not found in DOM");
  }

  const importthirdTermBtn = document.getElementById("importthirdTermBtn");
  if (importthirdTermBtn) {
    importthirdTermBtn.addEventListener("click", () => {
      const f = document.getElementById("importthirdTermFile");
      if (f) f.click();
      else console.warn("importthirdTermFile input not found");
    });
    console.log("importthirdTermBtn listener attached");
  } else {
    console.warn("importthirdTermBtn not found in DOM");
  }

  const importthirdTermFile = document.getElementById("importthirdTermFile");
  if (importthirdTermFile) {
    importthirdTermFile.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        console.log("File loaded for merge:", data);
        importAndMergethirdTerm(data);
      } catch (err) {
        alert("Invalid file format!");
        console.error(err);
      }
    });
    console.log("import thirdTermFile listener attached");
  } else {
    console.warn("import thirdTermFile not found in DOM");
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

  // --- export thirdTerm + attendance -----------------------------------
  function exportthirdTermData() {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = event => {
      const db = event.target.result;
      const exportData = {};
      let completed = 0;

      // build a filtered list of existing stores to avoid transaction issues
      const existingStores = STORES.filter(s => db.objectStoreNames.contains(s));
      if (existingStores.length === 0) {
        alert("No stores available to export.");
        return;
      }

      existingStores.forEach(storeName => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          exportData[storeName] = getAllReq.result || [];
          if (++completed === existingStores.length) saveFile(exportData);
        };
        getAllReq.onerror = (e) => {
          console.error("Error reading store", storeName, e);
          exportData[storeName] = [];
          if (++completed === existingStores.length) saveFile(exportData);
        };
      });
    };
    req.onerror = e => {
      console.error("Error opening DB for export", e);
      alert("Error opening database for export");
    };
  }

  function saveFile(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${DB_NAME} thirdTermData.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // --- import & merge thirdTerm with conflict check ---------------------
  function importAndMergethirdTerm(data) {
  if (!data || !Array.isArray(data.thirdTerm)) {
    alert("No thirdTerm array found in the file.");
    return;
  }

  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onsuccess = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("thirdTerm")) {
      alert("thirdTerm store does not exist in DB.");
      return;
    }

    const tx = db.transaction("thirdTerm", "readonly");
    const store = tx.objectStore("thirdTerm");
    const getAllReq = store.getAll();

    getAllReq.onsuccess = () => {
      const existing = getAllReq.result || [];

      // Build set of existing unique pairs "studentID|classID|sessionID|term"
      const uniquePairs = new Set();
      existing.forEach((rec) => {
        const sid = readStudentId(rec);
        const cid = readClassId(rec);
        const sess = rec.sessionID ?? rec.session ?? null;
        const term = rec.term ?? null;
        if (sid && cid && sess && term) {
          uniquePairs.add(`${cid}|${sid}|${sess}|${term}`);
        }
      });

      let conflicts = 0;
      const conflictPerClass = new Map();

      // Normalize and filter records
      const cleanedRecords = data.thirdTerm.map((rec) => {
        const sid = readStudentId(rec);
        const cid = readClassId(rec);
        const sess = rec.sessionID ?? rec.session ?? null;
        const term = rec.term ?? null;

        // strip teacher-supplied id
        const { id, ...rest } = rec;

        return { ...rest, studentID: sid, classID: cid, sessionID: sess, term };
      }).filter((rec) => rec.studentID && rec.classID);

      // Check for conflicts
      cleanedRecords.forEach((rec) => {
        const key = `${rec.classID}|${rec.studentID}|${rec.sessionID}|${rec.term}`;
        if (uniquePairs.has(key)) {
          conflicts++;
          conflictPerClass.set(rec.classID, (conflictPerClass.get(rec.classID) || 0) + 1);
        }
      });

      if (conflicts > 0) {
        const parts = Array.from(conflictPerClass.entries())
          .map(([cid, cnt]) => `classID=${cid}: ${cnt}`)
          .join(", ");
        alert(`❌ File has ${conflicts} conflicting student(s) already present — ${parts}`);
        return;
      }

      // ✅ No conflicts → import
      const writeTx = db.transaction("thirdTerm", "readwrite");
      const writeStore = writeTx.objectStore("thirdTerm");

      cleanedRecords.forEach((rec) => {
        writeStore.add(rec); // let DB assign autoIncrement id
      });

      writeTx.oncomplete = () => {
        alert("✅ First Term Data imported successfully!");
      };
      writeTx.onerror = (event) => {
        console.error("Transaction error:", event.target.error || event);
        alert("⚠️ Error while importing records, see console.");
      };
    };
  };
  

  req.onerror = (err) => {
    console.error("Error opening DB for merge", err);
    alert("Error opening database for merge!");
  };
}

}); // end DOMContentLoaded
