let db;
import { DB_NAME, DB_VERSION } from './app.js';

const classSelect = document.getElementById("classSelect");
const studentSelect = document.getElementById("studentSelect");
const sessionSelect = document.getElementById("sessionSelect");
const viewBtn = document.getElementById("viewResultBtn");

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = () => console.error("❌ Error opening DB");

request.onsuccess = (event) => {
  db = event.target.result;
  console.log("✅ DB opened:", db);

  // Load dropdowns
  loadClasses();
  loadSessions();
};

// ================= Load Classes =================
function loadClasses() {
  if (!db.objectStoreNames.contains("classes")) {
    console.error("❌ No 'classes' store found!");
    return;
  }

  const tx = db.transaction("classes", "readonly");
  const store = tx.objectStore("classes");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      console.log("📌 Class record:", cursor.value);
      const option = document.createElement("option");
      option.value = cursor.value.id ?? cursor.value.classID;
      option.textContent = cursor.value.className ?? cursor.value.name;
      classSelect.appendChild(option);
      cursor.continue();
    }
  };
}

// ================= Load Sessions =================
function loadSessions() {
  if (!db.objectStoreNames.contains("session")) {
    console.error("❌ No 'session' store found!");
    return;
  }

  const tx = db.transaction("session", "readonly");
  const store = tx.objectStore("session");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      console.log("📌 Session record:", cursor.value);
      const option = document.createElement("option");
      option.value = cursor.value.id ?? cursor.value.sessionID;
      option.textContent = cursor.value.session ?? cursor.value.name;
      sessionSelect.appendChild(option);
      cursor.continue();
    }
  };
}

// ================= When Class Selected → Load Students =================
classSelect.addEventListener("change", () => {
  studentSelect.innerHTML = `<option value="">-- Select Student --</option>`;

  const selectedClassId = Number(classSelect.value);
  if (!selectedClassId) return;

  if (!db.objectStoreNames.contains("session_students")) {
    console.error("❌ No 'session_students' store found!");
    return;
  }

  const tx = db.transaction("session_students", "readonly");
  const mapStore = tx.objectStore("session_students");

  mapStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const rec = cursor.value;
      if (rec.classID === selectedClassId) {
        console.log("📌 Mapping record:", rec);

        const studentTx = db.transaction("students", "readonly");
        const studentStore = studentTx.objectStore("students");
        studentStore.get(rec.studentID).onsuccess = (s) => {
          const student = s.target.result;
          console.log("📌 Student record:", student);
          if (student) {
            const option = document.createElement("option");
            option.value = student.id ?? student.studentID;
            option.textContent = `${student.firstName ?? ""} ${student.surName ?? ""}`;
            studentSelect.appendChild(option);
          }
        };
      }
      cursor.continue();
    }
  };
});

// ================= Redirect =================
viewBtn.addEventListener("click", () => {
  const studentId = studentSelect.value;
  const sessionId = sessionSelect.value;

  if (!studentId || !sessionId) {
    alert("Please select class, student, and session");
    return;
  }

  window.location.href = `cumulativeResult.html?id=${studentId}&session=${sessionId}`;
});
