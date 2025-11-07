let db;
import { DB_NAME, DB_VERSION } from './app.js';

// ====== EXPORT psychomotor ======
function exportPsychomotor() {
  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onsuccess = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("psychomotor")) {
      alert("No psychomotor store found!");
      return;
    }

    const tx = db.transaction("psychomotor", "readonly");
    const store = tx.objectStore("psychomotor");
    const getAllReq = store.getAll();

    getAllReq.onsuccess = () => {
      const data = { psychomotor: getAllReq.result };
      saveFile(data, "psychomotorData.json");
    };
  };
}

function saveFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ====== IMPORT psychomotor ======
function importpsychomotor(data) {
  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onsuccess = (e) => {
    const db = e.target.result;

    if (!db.objectStoreNames.contains("psychomotor")) {
      alert("No psychomotor store found!");
      return;
    }

    const tx = db.transaction("psychomotor", "readwrite");
    const store = tx.objectStore("psychomotor");
    const index = store.index("psychomotor_session_term");

    let added = 0;
    let updated = 0;
    let skipped = 0;

    // Process each record one by one
    const records = data.psychomotor || [];

    const processRecord = (rec, next) => {
      const key = [rec.studentID, rec.session, rec.term];
      const getReq = index.get(key);

      getReq.onsuccess = () => {
        const existing = getReq.result;

        if (existing) {
          // ⚠️ Ask if user wants to update existing record
          const confirmUpdate = confirm(
            `A psychomotor record already exists for:\n\n` +
            `Student ID: ${rec.studentID}\nSession: ${rec.session}\nTerm: ${rec.term}\n\n` +
            `Do you want to update this record?`
          );

          if (confirmUpdate) {
            // Update record (keep same ID from JSON)
            const updatedRecord = { ...existing, ...rec, id: rec.id };
            store.put(updatedRecord);
            updated++;
          } else {
            skipped++;
          }
        } else {
          // ✅ Add new record (preserve ID)
          store.add(rec);
          added++;
        }

        next();
      };

      getReq.onerror = () => {
        console.error("Error checking record:", getReq.error);
        next();
      };
    };

    // Sequentially process records to prevent IDB race conditions
    let i = 0;
    const processNext = () => {
      if (i < records.length) {
        processRecord(records[i], processNext);
        i++;
      } else {
        tx.oncomplete = () => {
          alert(
            `✅ Psychomotor Import Complete\n\n` +
            `Records added: ${added}\n` +
            `Records updated: ${updated}\n` +
            `Records skipped: ${skipped}`
          );
        };
      }
    };

    processNext();
  };
}



// ====== EVENT LISTENERS ======
document.getElementById("exportPsychomotorBtn")
  ?.addEventListener("click", exportPsychomotor);

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
      if (data.psychomotor) {
        importpsychomotor(data);
      } else {
        alert("Invalid psychomotor file format!");
      }
    } catch (err) {
      console.error(err);
      alert("Error reading file!");
    }
  });
