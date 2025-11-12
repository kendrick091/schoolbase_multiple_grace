import { DB_NAME, DB_VERSION } from "./app.js";

let db;
let currentSessionID = null;

// ==================== Open Database ====================
const request = indexedDB.open(DB_NAME, DB_VERSION);
request.onerror = () => console.error("❌ Error opening DB");
request.onsuccess = (event) => {
  db = event.target.result;
  getCurrentSession();
};

// ==================== Get Current Session ====================
function getCurrentSession() {
  const tx = db.transaction("sessionViewer", "readonly");
  const store = tx.objectStore("sessionViewer");
  const req = store.get(1);

  req.onsuccess = (e) => {
    const data = e.target.result;
    if (data && data.sessionID) {
      currentSessionID = data.sessionID;
      console.log("📘 Current session:", currentSessionID);
      loadClasses();
    } else {
      alert("⚠️ No current session found in sessionViewer.");
    }
  };
}

// ==================== Load Classes ====================
function loadClasses() {
  const classSelect = document.getElementById("classSelect");
  classSelect.innerHTML = `<option value="">-- Choose Class --</option>`;

  const tx = db.transaction("classes", "readonly");
  const store = tx.objectStore("classes");

  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const { id, className } = cursor.value;
      const option = document.createElement("option");
      option.value = id;
      option.textContent = className || id;
      classSelect.appendChild(option);
      cursor.continue();
    }
  };
}

// ==================== Load Students by Class ====================
document.getElementById("classSelect").addEventListener("change", loadStudentsByClass);

function loadStudentsByClass() {
  const selectedClass = document.getElementById("classSelect").value;
  const studentSelect = document.getElementById("studentSelect");
  studentSelect.innerHTML = `<option value="">-- Choose Student --</option>`;

  if (!selectedClass || !currentSessionID) return;

  const tx = db.transaction("students", "readonly");
  const store = tx.objectStore("students");
  const students = [];

  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const { id, surName, firstName, otherName, classID, sessionID } = cursor.value;

      // ✅ Filter by session + class
      if (
        Number(classID) === Number(selectedClass) &&
        Number(sessionID) === Number(currentSessionID)
      ) {
        students.push({ id, surName, firstName, otherName });
      }
      cursor.continue();
    } else {
      // ✅ Sort alphabetically by surname, then first name
      students.sort((a, b) => {
        const nameA = `${a.surName} ${a.firstName}`.toLowerCase();
        const nameB = `${b.surName} ${b.firstName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // ✅ Populate select element
      for (const s of students) {
        const option = document.createElement("option");
        option.value = s.id;
        option.textContent = `${s.surName} ${s.firstName} ${s.otherName || ""}`;
        studentSelect.appendChild(option);
      }

      console.log(`✅ Loaded ${students.length} students alphabetically for class:`, selectedClass);
    }
  };
}




// ==================== Save Teacher Remark ====================
document.getElementById("saveRemark").addEventListener("click", saveTeacherRemark);

function saveTeacherRemark() {
    const termSelect = document.getElementById('termSelect').value;
  const studentId = document.getElementById("studentSelect").value;
  const remarkText = document.getElementById("teacherRemark").value.trim();

  if (!studentId || !remarkText || !termSelect) {
    alert("⚠️ Please select a student and enter a remark.");
    return;
  }

  const recordKey = `${studentId}_${currentSessionID}_${termSelect}`;
  const tx = db.transaction("remark", "readwrite");
  const store = tx.objectStore("remark");

  const remarkRecord = {
    id: recordKey,
    studentID: Number(studentId),
    term: Number(termSelect),
    session: currentSessionID,
    remark: remarkText,
    date: new Date().toISOString(),
  };

  store.put(remarkRecord);

  tx.oncomplete = () => alert("✅ Remark saved successfully!");
  tx.onerror = () => alert("❌ Error saving remark!");
}

// ==================== Auto-load Existing Remark ====================
document.getElementById("studentSelect").addEventListener("change", loadExistingRemark);

function loadExistingRemark() {
  const studentId = document.getElementById("studentSelect").value;
  const termSelect = document.getElementById('termSelect').value;
  if (!studentId || !currentSessionID || !termSelect) return;

  const recordKey = `${studentId}_${currentSessionID}_${termSelect}`;
  const tx = db.transaction("remark", "readonly");
  const store = tx.objectStore("remark");
  const req = store.get(recordKey);

  req.onsuccess = (e) => {
    const data = e.target.result;
    document.getElementById("teacherRemark").value = data ? data.remark : "";
  };
}
