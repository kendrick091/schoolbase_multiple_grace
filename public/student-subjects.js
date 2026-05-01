import { DB_NAME, DB_VERSION } from "./app.js";

let db;

// ============ Open DB ============
const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = () => console.error("Error opening database");
request.onupgradeneeded = (event) => (db = event.target.result);
request.onsuccess = (event) => {
  db = event.target.result;
  populateFilters();
};

// ============ Populate dropdown filters ============
async function populateFilters() {
  await populateSessionSelect(); // 🔹 new version handles both stores
  await populateSelect("classSelect", "classes", "className");
  await populateSelect("subjectSelect", "subjectStore", "subjects");

  const termSelect = document.getElementById("termSelect");
  termSelect.innerHTML = `
    <option value="">Select Term</option>
    <option value="1">First Term</option>
    <option value="2">Second Term</option>
    <option value="3">Third Term</option>
  `;

  ["sessionSelect", "classSelect", "subjectSelect", "termSelect"].forEach((id) =>
    document.getElementById(id).addEventListener("change", loadStudentsByFilter)
  );
}

// ============ Populate Session Select ============
function populateSessionSelect() {
  return new Promise((resolve) => {
    const select = document.getElementById("sessionSelect");
    select.innerHTML = `<option value="">Select Session</option>`;

    const tx = db.transaction(["sessionViewer", "session"], "readonly");
    const sessionViewerStore = tx.objectStore("sessionViewer");
    const sessionStore = tx.objectStore("session");

    const sessionMap = new Map(); // Store {sessionID: sessionName}

    // First, get all sessions from "session" store
    sessionStore.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        sessionMap.set(cursor.value.id, cursor.value.session);
        cursor.continue();
      } else {
        // Now load from sessionViewer and map names
        sessionViewerStore.openCursor().onsuccess = (ev) => {
          const c = ev.target.result;
          if (c) {
            const item = c.value;
            const option = document.createElement("option");
            option.value = item.sessionID;
            // lookup the readable name
            option.textContent = sessionMap.get(item.sessionID) || `Session ${item.sessionID}`;
            select.appendChild(option);
            c.continue();
          } else resolve();
        };
      }
    };
  });
}

// ============ Generic populateSelect for other dropdowns ============
function populateSelect(selectId, storeName, fieldName) {
  return new Promise((resolve) => {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">Select</option>`;

    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const item = cursor.value;
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item[fieldName];
        select.appendChild(option);
        cursor.continue();
      } else resolve();
    };
  });
}


// ============ Load students by filters ============
function loadStudentsByFilter() {
  const sessionId = parseInt(document.getElementById("sessionSelect").value);
  const classId = parseInt(document.getElementById("classSelect").value);
  const subjectId = parseInt(document.getElementById("subjectSelect").value);
  const term = parseInt(document.getElementById("termSelect").value);

  const tbody = document.querySelector("#studentTable tbody");
  tbody.innerHTML = "";

  if (!sessionId || !classId || !subjectId || !term) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Select all filters to view records</td></tr>`;
    return;
  }

  const txStudents = db.transaction("students", "readonly");
  const studentStore = txStudents.objectStore("students");
  const students = [];

  studentStore.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const student = cursor.value;
      if (student.classID === classId) {
        students.push(student);
      }
      cursor.continue();
    } else {
      // 🔹 Sort students alphabetically by surname, then first name
      students.sort((a, b) => {
        const nameA = `${a.surName} ${a.firstName}`.toLowerCase();
        const nameB = `${b.surName} ${b.firstName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      let termStoreName =
        term === 1 ? "firstTerm" : term === 2 ? "secondTerm" : "thirdTerm";
      displayEditableTable(students, sessionId, classId, subjectId, termStoreName);
    }
  };
}


// ============ Display Editable Table ============
function displayEditableTable(students, sessionId, classId, subjectId, termStoreName) {
  const tbody = document.querySelector("#studentTable tbody");
  tbody.innerHTML = "";

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No students found in this class</td></tr>`;
    return;
  }

  const txScores = db.transaction(termStoreName, "readonly");
  const scoreStore = txScores.objectStore(termStoreName);

  scoreStore.getAll().onsuccess = (e) => {
    const allScores = e.target.result;

    students.forEach((student) => {
     const termValue =
  termStoreName === "firstTerm" ? 1 : termStoreName === "secondTerm" ? 2 : 3;

const record = allScores.find(
  (r) =>
    r.studentID === student.id &&
    r.classID === classId &&
    r.subjectID === subjectId &&
    r.session === sessionId &&
    r.term === termValue
);



      const ca1 = record ? record.ca1 : 0;
      const ca2 = record ? record.ca2 : 0;
      const ca3 = record ? record.ca3 : 0;
      const exam = record ? record.exam : 0;
      const total = ca1 + ca2 + ca3 + exam;

      const row = document.createElement("tr");
      row.dataset.studentId = student.id;

      row.innerHTML = `
        <td>${student.surName} ${student.firstName}</td>
        <td contenteditable="true" class="ca1">${ca1}</td>
        <td contenteditable="true" class="ca2">${ca2}</td>
        <td contenteditable="true" class="ca3">${ca3}</td>
        <td contenteditable="true" class="exam">${exam}</td>
        <td class="total">${total}</td>
      `;

      // Auto-update total when any cell changes
      row.querySelectorAll(".ca1, .ca2, .ca3, .exam").forEach((cell) => {
        cell.addEventListener("input", () => {
          const ca1Val = parseFloat(row.querySelector(".ca1").innerText) || 0;
          const ca2Val = parseFloat(row.querySelector(".ca2").innerText) || 0;
          const ca3Val = parseFloat(row.querySelector(".ca3").innerText) || 0;
          const examVal = parseFloat(row.querySelector(".exam").innerText) || 0;
          row.querySelector(".total").innerText = ca1Val + ca2Val + ca3Val + examVal;
        });
        cell.addEventListener("blur", () => {
          updateSingleScore(termStoreName, sessionId, classId, subjectId, termValue, row);
        });

      });

      tbody.appendChild(row);
    });

    // Remove old save button if it exists (so it doesn’t keep old termStoreName)
const oldBtn = document.getElementById("saveScoresBtn");
if (oldBtn) oldBtn.remove();

// Create a fresh save button for this term
const saveBtn = document.createElement("button");
saveBtn.id = "saveScoresBtn";
saveBtn.textContent = "💾 Save All Scores";

// Bind it to the CURRENT term store
saveBtn.addEventListener("click", () =>
  saveAllScores(termStoreName, sessionId, classId, subjectId)
);

// Append it somewhere visible
// document.body.appendChild(saveBtn);

  };
}

// ============ Save all scores ============
function saveAllScores(termStoreName, sessionId, classId, subjectId) {
  const rows = document.querySelectorAll("#studentTable tbody tr");

  const tx = db.transaction(termStoreName, "readwrite");
  const store = tx.objectStore(termStoreName);

  rows.forEach((row) => {
    const studentId = parseInt(row.dataset.studentId);
    const ca1 = parseFloat(row.querySelector(".ca1").innerText) || 0;
    const ca2 = parseFloat(row.querySelector(".ca2").innerText) || 0;
    const ca3 = parseFloat(row.querySelector(".ca3").innerText) || 0;
    const exam = parseFloat(row.querySelector(".exam").innerText) || 0;
    const total = ca1 + ca2 + ca3 + exam;

    const term =
  termStoreName === "firstTerm" ? 1 : termStoreName === "secondTerm" ? 2 : 3;

const record = {
  studentID: studentId,
  classID: classId,
  subjectID: subjectId,
  session: sessionId,
  term,
  ca1,
  ca2,
  ca3,
  exam,
  total,
};


   const existingRequest = store.getAll();
existingRequest.onsuccess = () => {
  const allRecords = existingRequest.result;
  const existing = allRecords.find(
    (r) =>
      r.studentID === studentId &&
      r.classID === classId &&
      r.subjectID === subjectId &&
      r.session === sessionId &&
      r.term === term
  );

  if (existing) {
    record.id = existing.id; // keep same key if exists
  }

  store.put(record);
};


  });

  tx.oncomplete = () => alert("✅ All scores saved successfully!");
  tx.onerror = () => alert("❌ Error saving scores.");
}

// ============ Auto-update single student's score on edit ============
function updateSingleScore(termStoreName, sessionId, classId, subjectId, term, row) {
  const tx = db.transaction(termStoreName, "readwrite");
  const store = tx.objectStore(termStoreName);

  const studentId = parseInt(row.dataset.studentId);
  const ca1 = parseFloat(row.querySelector(".ca1").innerText) || 0;
  const ca2 = parseFloat(row.querySelector(".ca2").innerText) || 0;
  const ca3 = parseFloat(row.querySelector(".ca3").innerText) || 0;
  const exam = parseFloat(row.querySelector(".exam").innerText) || 0;
  const total = ca1 + ca2 + ca3 + exam;

  const record = {
    studentID: studentId,
    classID: classId,
    subjectID: subjectId,
    session: sessionId,
    term,
    ca1,
    ca2,
    ca3,
    exam,
    total,
  };

  const getReq = store.getAll();
  getReq.onsuccess = () => {
    const allRecords = getReq.result;
    const existing = allRecords.find(
      (r) =>
        r.studentID === studentId &&
        r.classID === classId &&
        r.subjectID === subjectId &&
        r.session === sessionId &&
        r.term === term
    );

    if (existing) record.id = existing.id;
    store.put(record);
  };

  tx.oncomplete = () => showToast(`Saved ✓`);
;
}

// ============ Toast Notification ============
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "30px";
  toast.style.right = "30px";
  toast.style.padding = "10px 20px";
  toast.style.color = "#fff";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "14px";
  toast.style.zIndex = "1000";
  toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  toast.style.transition = "opacity 0.5s ease";
  toast.style.opacity = "0";

  toast.style.background = type === "error" ? "#e74c3c" : "#2ecc71";

  document.body.appendChild(toast);

  // Fade in
  setTimeout(() => (toast.style.opacity = "1"), 50);

  // Fade out after 2.5s
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 2500);
}

