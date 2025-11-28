import {tog} from './toggle.js';

let dismise = document.getElementById('dismise');
const manualInputBtn = document.getElementById('manualInputBtn')

manualInputBtn.addEventListener('click', ()=>{
    tog(toggleFormAddForm)
})

dismise.addEventListener('click', function(){
    tog(toggleFormAddForm)
})
import { DB_NAME, DB_VERSION } from "./app.js";

let db;
const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event) => {
  const db = event.target.result;

  if (!db.objectStoreNames.contains("attendance")) {
    const store = db.createObjectStore("attendance", { keyPath: "id", autoIncrement: true });
    store.createIndex("student_session_term", ["studentID", "sessionID", "term"], { unique: true });
  } else {
    const store = event.target.transaction.objectStore("attendance");
    if (!store.indexNames.contains("student_session_term")) {
      store.createIndex("student_session_term", ["studentID", "sessionID", "term"], { unique: true });
    }
  }
};


request.onsuccess = (event) => {
  db = event.target.result;
  loadSessions();
  loadClasses();
};

request.onerror = () => console.error("Error opening database");

// Load sessions into dropdown
function loadSessions() {
  const sessionSelect = document.getElementById("sessionSelect");
  const tx = db.transaction("session", "readonly");
  const store = tx.objectStore("session");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const opt = document.createElement("option");
      opt.value = cursor.value.id;
      opt.textContent = cursor.value.session;
      sessionSelect.appendChild(opt);
      cursor.continue();
    }
  };
}

// Load classes into dropdown
function loadClasses() {
  const classSelect = document.getElementById("classSelect");
  const tx = db.transaction("classes", "readonly");
  const store = tx.objectStore("classes");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const opt = document.createElement("option");
      opt.value = cursor.value.id;
      opt.textContent = cursor.value.className;
      classSelect.appendChild(opt);
      cursor.continue();
    }
  };
}

// Load students when button clicked
document.getElementById("loadStudents").addEventListener("click", () => {
  const sessionID = Number(document.getElementById("sessionSelect").value);
  const classID = Number(document.getElementById("classSelect").value);
  const term = Number(document.getElementById("termSelect").value);

  // const studentList = document.getElementById("studentList");
  // studentList.innerHTML = "";

  const tx = db.transaction("session_students", "readonly");
  const store = tx.objectStore("session_students");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const record = cursor.value;
      if (record.sessionID === sessionID && record.classID === classID) {
        // Get student details
        const studentTx = db.transaction("students", "readonly");
        const studentStore = studentTx.objectStore("students");
        studentStore.get(record.studentID).onsuccess = (s) => {
          const student = s.target.result;
          if (student) {
            const li = document.createElement("li");
            li.innerHTML = `
              <label>
                <input type="checkbox" name="student" value="${student.id}">
                ${student.surName} ${student.firstName} ${student.otherName || ""}
              </label>
            `;
            // studentList.appendChild(li);
          }
        };
      }
      cursor.continue();
    }
  };
  loadAttendanceTable(sessionID, classID, term);
});

// Save attendance
// document.getElementById("attendanceForm").addEventListener("submit", (e) => {
//   e.preventDefault();

//   const sessionID = Number(document.getElementById("sessionSelect").value);
//   const classID = Number(document.getElementById("classSelect").value);
//   const term = Number(document.getElementById("termSelect").value);

//   const checkboxes = document.querySelectorAll("input[name='student']");
  
//   const tx = db.transaction("attendance", "readwrite");
//   const store = tx.objectStore("attendance");

//   checkboxes.forEach((cb) => {
//     const studentID = Number(cb.value);
//     const present = cb.checked;

//     // Check if record exists for this student/session/term
//     const index = store.index("student_session_term");
//     const getReq = index.get([studentID, sessionID, term]);

//     getReq.onsuccess = (event) => {
//       let record = event.target.result;

//       if (record) {
//         // Update existing record
//         record.totalDays += 1;
//         if (present) {
//           record.presentDays += 1;
//         } else {
//           record.absentDays += 1;
//         }
//         store.put(record);
//       } else {
//         // New record
//         store.put({
//           studentID,
//           sessionID,
//           classID,
//           term,
//           totalDays: 1,
//           presentDays: present ? 1 : 0,
//           absentDays: present ? 0 : 1
//         });
//       }
//     };
//   });

//   tx.oncomplete = () => {
//     alert("Attendance saved successfully!");
//     location.reload();
//   };
// });

function loadAttendanceTable(sessionID, classID, term) {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";

  const tx = db.transaction(["attendance", "students"], "readonly");
  const attendanceStore = tx.objectStore("attendance");
  const studentStore = tx.objectStore("students");

  attendanceStore.getAll().onsuccess = (e) => {
    const records = e.target.result.filter(
      (r) =>
        Number(r.sessionID) === Number(sessionID) &&
        Number(r.classID) === Number(classID) &&
        Number(r.term) === Number(term)
    );

    if (records.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="4" style="text-align:center;">No attendance records found.</td></tr>
      `;
      return;
    }

    // Sort alphabetically by student name
    records.sort((a, b) => {
      const sA = a.studentID;
      const sB = b.studentID;
      return sA - sB;
    });

    records.forEach((rec) => {
      const studentReq = studentStore.get(rec.studentID);
      
      studentReq.onsuccess = () => {
        const student = studentReq.result;
        const fullName = student
          ? `${student.surName} ${student.firstName}`
          : `ID ${rec.studentID}`;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${fullName}</td>
          <td>${rec.totalDays}</td>
          <td style="color: green;">${rec.presentDays}</td>
          <td style="color: red;">${rec.absentDays}</td>
        `;
        tbody.appendChild(row);
      };
    });
  };
}
