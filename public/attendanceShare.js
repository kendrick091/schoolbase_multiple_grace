let db;
import { DB_NAME, DB_VERSION } from './app.js';

// ====== EXPORT ATTENDANCE ======
function exportAttendance() {
  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onsuccess = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("attendance")) {
      alert("No attendance store found!");
      return;
    }

    const tx = db.transaction("attendance", "readonly");
    const store = tx.objectStore("attendance");
    const getAllReq = store.getAll();

    getAllReq.onsuccess = () => {
      const data = { attendance: getAllReq.result };
      saveFile(data, "attendanceData.json");
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

// ====== IMPORT ATTENDANCE ======
function importAttendance(data) {
  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onsuccess = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("attendance")) {
      alert("No attendance store found!");
      return;
    }

    const tx = db.transaction("attendance", "readwrite");
    const store = tx.objectStore("attendance");
    const index = store.index("student_session_term");

    let added = 0;
    let skipped = 0;

    const checkAndAdd = (rec, next) => {
      const key = [rec.studentID, rec.sessionID, rec.term];
      const getReq = index.get(key);

      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (existing) {
          if (String(existing.classID) === String(rec.classID)) {
            // ❌ Duplicate in the same class
            skipped++;
            console.warn(
              `Duplicate found: studentID=${rec.studentID}, classID=${rec.classID}, term=${rec.term}`
            );
          } else {
            // ✅ Allowed: student promoted to another class
            const { id, ...clean } = rec; // strip teacher's id
            store.add(clean);
            added++;
          }
        } else {
          // ✅ No duplicate → add new
          const { id, ...clean } = rec;
          store.add(clean);
          added++;
        }
        next();
      };

      getReq.onerror = () => {
        console.error("Error checking duplicate:", getReq.error);
        next();
      };
    };

    // Process sequentially to avoid race conditions
    let i = 0;
    const processNext = () => {
      if (i < data.attendance.length) {
        checkAndAdd(data.attendance[i], processNext);
        i++;
      } else {
        tx.oncomplete = () => {
          if (skipped > 0) {
            alert(
              `⚠️ Import blocked: ${skipped} record(s) already exist in the same class.\n` +
              `✅ ${added} record(s) added (including promoted students).`
            );
          } else {
            alert(`✅ Imported ${added} attendance records successfully!`);
          }
        };
      }
    };

    processNext();
  };
}


// ====== EVENT LISTENERS ======
document.getElementById("exportAttendanceBtn")
  ?.addEventListener("click", exportAttendance);

document.getElementById("importAttendanceBtn")
  ?.addEventListener("click", () => {
    document.getElementById("importAttendanceFile").click();
  });

document.getElementById("importAttendanceFile")
  ?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.attendance) {
        importAttendance(data);
      } else {
        alert("Invalid attendance file format!");
      }
    } catch (err) {
      console.error(err);
      alert("Error reading file!");
    }
  });
