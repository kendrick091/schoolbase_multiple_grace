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
  const tx = db.transaction("classes", "readonly");
  const store = tx.objectStore("classes");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const cls = cursor.value;
      const option = document.createElement("option");
      option.value = cls.id ?? cls.classID;
      option.textContent = cls.className ?? cls.name;
      classSelect.appendChild(option);
      cursor.continue();
    }
  };
}

// ================= Load Sessions =================
function loadSessions() {
  const tx = db.transaction("session", "readonly");
  const store = tx.objectStore("session");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const sess = cursor.value;
      const option = document.createElement("option");
      option.value = sess.id ?? sess.sessionID;
      option.textContent = sess.session ?? sess.name;
      sessionSelect.appendChild(option);
      cursor.continue();
    }
  };
}

// ================= Load Students when both Class + Session Selected =================

// Re-load students when class or session changes
classSelect.addEventListener("change", loadStudents);
sessionSelect.addEventListener("change", loadStudents);

function loadStudents() {
  studentSelect.innerHTML = `<option value="">-- Select Student --</option>`;

  const selectedClassId = Number(classSelect.value);
  const selectedSessionId = Number(sessionSelect.value);

  if (!selectedClassId || !selectedSessionId) {
    console.warn("⚠️ Both class and session must be selected.");
    return;
  }

  const tx = db.transaction("session_students", "readonly");
  const mapStore = tx.objectStore("session_students");

  mapStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const rec = cursor.value;

      // ✅ Filter by both classID and sessionID
      if (rec.classID === selectedClassId && rec.sessionID === selectedSessionId) {
        const studentTx = db.transaction("students", "readonly");
        const studentStore = studentTx.objectStore("students");

        studentStore.get(rec.studentID).onsuccess = (s) => {
          const student = s.target.result;
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
}

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
