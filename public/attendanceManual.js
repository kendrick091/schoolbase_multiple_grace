import { DB_NAME, DB_VERSION } from './app.js';

let db;

// ========================
// OPEN DATABASE
// ========================
const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = () => console.error("❌ Error opening database");
request.onsuccess = (event) => {
  db = event.target.result;
  console.log("✅ Database opened successfully");
  loadSessions();
  loadClasses();
};

// ========================
// LOAD SESSIONS + CLASSES
// ========================

function loadSessions() {
  const tx = db.transaction("session", "readonly");
  const store = tx.objectStore("session");
  const req = store.getAll();

  req.onsuccess = () => {
    const sessions = req.result;
    const select = document.getElementById("sessionID");
    select.innerHTML = '<option value="">-- Select Session --</option>';

    sessions.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.session;
      select.appendChild(opt);
    });
  };
}

function loadClasses() {
  const tx = db.transaction("classes", "readonly");
  const store = tx.objectStore("classes");
  const req = store.getAll();

  req.onsuccess = () => {
    const classes = req.result;
    const select = document.getElementById("classID");
    select.innerHTML = '<option value="">-- Select Class --</option>';

    classes.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.className;
      select.appendChild(opt);
    });
  };
}

// ========================
// FILTER STUDENTS BY CLASS & SESSION
// ========================

document.getElementById("classID").addEventListener("change", loadStudentsByClassAndSession);
document.getElementById("sessionID").addEventListener("change", loadStudentsByClassAndSession);

function loadStudentsByClassAndSession() {
  const classID = Number(document.getElementById("classID").value);
  const sessionID = Number(document.getElementById("sessionID").value);
  const select = document.getElementById("studentID");
  select.innerHTML = '<option value="">-- Select Student --</option>';

  if (!classID || !sessionID) return;

  const tx = db.transaction("students", "readonly");
  const store = tx.objectStore("students");
  const req = store.getAll();

  req.onsuccess = () => {
    const students = req.result.filter(
      (s) => s.classID === classID && s.sessionID === sessionID
    );

    if (students.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "No students found";
      select.appendChild(opt);
      return;
    }

    students.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.surName} ${s.firstName} ${s.otherName}`;
      select.appendChild(opt);
    });
  };
}

// ========================
// SAVE ATTENDANCE
// ========================

document.getElementById("formInput").addEventListener("submit", (e) => {
  e.preventDefault();

  const sessionID = Number(document.getElementById("sessionID").value);
  const term = Number(document.getElementById("term").value);
  const classID = Number(document.getElementById("classID").value);
  const studentID = Number(document.getElementById("studentID").value);

  const inputs = document.querySelectorAll("#classInput");
  const presentDays = Number(inputs[0].value);
  const absentDays = Number(inputs[1].value);
  const totalDays = Number(inputs[2].value);

  if (!sessionID || !term || !classID || !studentID) {
    alert("⚠️ Please fill in all fields!");
    return;
  }

  const tx = db.transaction("attendance", "readwrite");
  const store = tx.objectStore("attendance");

  // Check if record already exists
  const allReq = store.getAll();

  allReq.onsuccess = () => {
    const allRecords = allReq.result;
    const existing = allRecords.find(
      (rec) =>
        rec.studentID === studentID &&
        rec.sessionID === sessionID &&
        rec.classID === classID &&
        rec.term === term
    );

    const newRecord = {
      studentID,
      classID,
      sessionID,
      term,
      presentDays,
      absentDays,
      totalDays,
    };

    if (existing) {
      // update existing record
      newRecord.id = existing.id;
      store.put(newRecord);
      alert("✅ Attendance updated successfully!");
    } else {
      // add new record
      store.add(newRecord);
      alert("✅ Attendance saved successfully!");
    }

    e.target.reset();
  };
});
