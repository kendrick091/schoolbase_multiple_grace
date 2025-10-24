let db;

import { DB_NAME, DB_VERSION } from './app.js';

const urlParams = new URLSearchParams(window.location.search);
const studentId = Number(urlParams.get("id"));
const sessionId = Number(urlParams.get("session"));

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = () => console.log("Error opening DB");

request.onsuccess = (event) => {
  db = event.target.result;
  renderSchoolHeaderAndFooter();
  loadStudentInfo();
  loadCumulativeResult();
};

// ================== SCHOOL HEADER ==================
function renderSchoolHeaderAndFooter() {
  const tx = db.transaction("school", "readonly");
  const store = tx.objectStore("school");
  const req = store.get(1);

  req.onsuccess = () => {
    const school = req.result;
    if (!school) return;

    const div = document.getElementById("schoolLogoDiv");
    const divN = document.getElementById("schoolNameDiv");

    const logoImg = document.createElement("img");
    logoImg.src = URL.createObjectURL(school.logo);
    logoImg.alt = "School Logo";
    logoImg.style.width = "100px";

    const name = document.createElement("h1");
    name.textContent = school.name;

    const address = document.createElement("p");
    address.textContent = school.address;

    div.appendChild(logoImg);
    divN.appendChild(name);
    divN.appendChild(address);
  };
}

// ================== STUDENT INFO ==================
function loadStudentInfo() {
  const tx = db.transaction(["students", "classes", "session", "session_students"], "readonly");
  const studentStore = tx.objectStore("students");

  studentStore.get(studentId).onsuccess = (e) => {
    const student = e.target.result;
    if (!student) return;

    const table = document.getElementById("studentInfo");
    table.innerHTML = `
      <tr><td class="topTableClass"><b>First Name:</b></td><td>${student.firstName}</td></tr>
      <tr><td class="topTableClass"><b>Sur Name:</b></td><td>${student.surName}</td></tr>
      <tr><td class="topTableClass"><b>Other Name:</b></td><td>${student.otherName}</td></tr>
    `;
  };

  // Session info
  tx.objectStore("session").get(sessionId).onsuccess = (s) => {
    const session = s.target.result;
    const row = document.createElement("tr");
    row.innerHTML = `<td class="topTableClass"><b>Session:</b></td><td>${session.session}</td>`;
    document.getElementById("studentInfo").appendChild(row);
  };

  // Class info
  const mapStore = tx.objectStore("session_students").openCursor();
  mapStore.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const rec = cursor.value;
      if (rec.studentID === studentId && rec.sessionID === sessionId) {
        db.transaction("classes", "readonly").objectStore("classes")
          .get(rec.classID).onsuccess = (c) => {
            const classRow = document.createElement("tr");
            classRow.innerHTML = `<td class="topTableClass">
            <b>Class:</b></td><td>${c.target.result.className}</td>`;
            document.getElementById("studentInfo").appendChild(classRow);
          };
        return;
      }
      cursor.continue();
    }
  };
}

// ================== CUMULATIVE RESULT ==================
function loadCumulativeResult() {
  const terms = [
    { store: "firstTerm", label: "1st Term" },
    { store: "secondTerm", label: "2nd Term" },
    { store: "thirdTerm", label: "3rd Term" }
  ];

  const resultsBySubject = {};
  let completedTerms = 0;

  terms.forEach(term => {
    const tx = db.transaction(term.store, "readonly");
    const store = tx.objectStore(term.store);

    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const result = cursor.value;
        if (result.studentID === studentId && result.session === sessionId) {
          const subjectId = result.subjectID;
          const termTotal = (result.ca1 || 0) + (result.ca2 || 0) + (result.ca3 || 0) + (result.exam || 0);

          if (!resultsBySubject[subjectId]) {
            resultsBySubject[subjectId] = { subjectId, scores: {}, total: 0 };
          }
          resultsBySubject[subjectId].scores[term.label] = termTotal;
          resultsBySubject[subjectId].total += termTotal;
        }
        cursor.continue();
      } else {
        completedTerms++;
        if (completedTerms === terms.length) {
          renderCumulativeTable(resultsBySubject);
        }
      }
    };
  });
}

function renderCumulativeTable(resultsBySubject) {
  const tableBody = document.querySelector("#cumulativeTable tbody");
  tableBody.innerHTML = "";

  let grandTotal = 0;
  let subjectCount = 0;

  const subjectStore = db.transaction("subjectStore", "readonly").objectStore("subjectStore");

  Object.values(resultsBySubject).forEach(record => {
    subjectStore.get(record.subjectId).onsuccess = (s) => {
      const subject = s.target.result;
      const name = subject ? subject.subjects : "Unknown";

      const t1 = record.scores["1st Term"] || 0;
      const t2 = record.scores["2nd Term"] || 0;
      const t3 = record.scores["3rd Term"] || 0;
      const total = record.total;
      const avg = (total / 3).toFixed(2);

      grandTotal += total;
      subjectCount++;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="text-align: left;">${name}</td>
        <td>${t1}</td>
        <td>${t2}</td>
        <td>${t3}</td>
        <td>${total}</td>
        <td>${avg}</td>
        <td>${getGrade(avg)}</td>
        <td>${getRemark(avg)}</td>
      `;
      tableBody.appendChild(row);
    };
  });



  setTimeout(() => {
    if (subjectCount > 0) {
      const avg = (grandTotal / (subjectCount * 3)).toFixed(2);
      let status = function(){
        if (avg >= 45){
          return `<h3 style="color: green;">PROMOTED</h3>`
        }else{
          return `<h3 style="color: red;">Advise to Repeat</h3>`
        }
      }
      document.getElementById("cumulativeSummary").innerHTML = `
        Grand Total: ${grandTotal} | Average: ${avg} | Grade: ${getGrade(avg)}
        <div>${status()}</div>
      `;
    }
  }, 500);
}

// ================== GRADING HELPERS ==================
function getGrade(score) {
  score = Number(score);
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  if (score >= 40) return "E";
  return "F";
}

function getRemark(score) {
  score = Number(score);
  if (score >= 70) return "Excellent";
  if (score >= 60) return "Very Good";
  if (score >= 50) return "Good";
  if (score >= 45) return "Fair";
  if (score >= 40) return "Pass";
  return "Fail";
}

// ================== PRINT ==================
document.getElementById("printBtn").addEventListener("click", () => {
  window.print();
});
