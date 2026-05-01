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
<<<<<<< HEAD
  loadPsychomotor();
=======
>>>>>>> 35eea63723a0204715167da5b5544a92f6ef81a2
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

<<<<<<< HEAD
    divN.innerHTML = `
    <div>
      <h1>${school.name}</h1>
      <h3>${school.address}</h3>
    </div>
    `;

    div.appendChild(logoImg);
=======
    const name = document.createElement("h1");
    name.textContent = school.name;

    const address = document.createElement("p");
    address.textContent = school.address;

    div.appendChild(logoImg);
    divN.appendChild(name);
    divN.appendChild(address);
>>>>>>> 35eea63723a0204715167da5b5544a92f6ef81a2
  };
}

// ================== STUDENT INFO ==================
function loadStudentInfo() {
<<<<<<< HEAD
  const tx = db.transaction(
    ["students", "classes", "session", "session_students", "attendance"],
    "readonly"
  );

  const studentStore = tx.objectStore("students");

  const table = document.getElementById("studentInfo");
  const table2 = document.getElementById("studentInfo2");

  table.innerHTML = "";
  table2.innerHTML = "";

  // ======================
  // STUDENT NAME
  // ======================
=======
  const tx = db.transaction(["students", "classes", "session", "session_students"], "readonly");
  const studentStore = tx.objectStore("students");

>>>>>>> 35eea63723a0204715167da5b5544a92f6ef81a2
  studentStore.get(studentId).onsuccess = (e) => {
    const student = e.target.result;
    if (!student) return;

<<<<<<< HEAD
    table.innerHTML = `
      <tr>
        <td class="topTableClass"><b>Name:</b></td>
        <td>${student.surName} ${student.firstName}</td>
      </tr>
    `;
  };

  // ======================
  // SESSION INFO
  // ======================
  tx.objectStore("session").get(sessionId).onsuccess = (s) => {
    const session = s.target.result;
    if (!session) return;

    // Add session to table 1

    table.innerHTML += `
      <td class="topTableClass"><b>Session:</b></td>
      <td>${session.session}</td>
    `;

    // ======================
    // RESUMPTION DATE (table2)
    // ======================

    const termRow = document.createElement("tr");
    termRow.innerHTML = `
      <td class="topTableClass"><b>Term:</b></td>
      <td>3rd Term</td>
    `;

    const vacationDate = document.createElement("tr");
    vacationDate.innerHTML = `
      <td class="topTableClass"><b>Vacation Date:</b></td>
      <td>${session.thirdVac || "-"}</td>
    `;
    const resumptionDate = document.createElement("tr");
    resumptionDate.innerHTML = `
      <td class="topTableClass"><b>Resumption Date:</b></td>
      <td>${session.thirdRes || "-"}</td>
    `;

    table2.appendChild(termRow);
    table2.appendChild(vacationDate);
    table2.appendChild(resumptionDate);
  }; 

  // ======================
// CLASS INFO + STUDENT COUNT
// ======================
const mapStoreSession = tx.objectStore("session_students").openCursor();

mapStoreSession.onsuccess = (event) => {
  const cursor = event.target.result;

  if (cursor) {
    const rec = cursor.value;

    if (rec.studentID === studentId && rec.sessionID === sessionId) {
      const classId = rec.classID;

      // ✅ Get class name
      db.transaction("classes", "readonly")
        .objectStore("classes")
        .get(classId).onsuccess = (c) => {
          const classRow = document.createElement("tr");
          classRow.innerHTML = `
            <td class="topTableClass"><b>Class:</b></td>
            <td>${c.target.result.className}</td>
          `;
          table.appendChild(classRow);
        };

      // ======================
      // COUNT STUDENTS IN SAME CLASS
      // ======================
      let studentCount = 0;

      const countStore = db
        .transaction("session_students", "readonly")
        .objectStore("session_students")
        .openCursor();

      countStore.onsuccess = (e) => {
        const cur = e.target.result;

        if (cur) {
          const r = cur.value;

          if (r.classID === classId && r.sessionID === sessionId) {
            studentCount++;
          }

          cur.continue();
        } else {
          const countRow = document.createElement("tr");
          countRow.innerHTML = `
            <td class="topTableClass"><b>Total Students in Class:</b></td>
            <td>${studentCount}</td>
          `;
          table.appendChild(countRow);
        }
      };

      return; // stop looping once found
    }

    cursor.continue();
  }
};
  // ======================
  // ATTENDANCE (table2)
  // ======================
  const attendanceStore = tx.objectStore("attendance");
  attendanceStore.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    const term = 3; // Assuming we're showing attendance for the 3rd term in the cumulative result

    if (cursor) {
      const record = cursor.value;

      if (
        record.studentID === studentId &&
        record.sessionID === sessionId &&
        Number(record.term) === Number(term)
      ) {
        const attRow = document.createElement("tr");
        attRow.innerHTML = `
          <td class="topTableClass"><b>Attendance:</b></td>
          <td>${record.presentDays} / ${record.totalDays}</td>
        `;
        table2.appendChild(attRow);
      }

=======
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
>>>>>>> 35eea63723a0204715167da5b5544a92f6ef81a2
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
<<<<<<< HEAD
          // For the term total, while working for third term
          const ca1 = result.ca1 || 0;
          const ca2 = result.ca2 || 0;
          const ca3 = result.ca3 || 0;
          const exam = result.exam || 0;

          const termTotal = ca1 + ca2 + ca3 + exam;
=======
          const termTotal = (result.ca1 || 0) + (result.ca2 || 0) + (result.ca3 || 0) + (result.exam || 0);
>>>>>>> 35eea63723a0204715167da5b5544a92f6ef81a2

          if (!resultsBySubject[subjectId]) {
            resultsBySubject[subjectId] = { subjectId, scores: {}, total: 0 };
          }
<<<<<<< HEAD
          resultsBySubject[subjectId].scores[term.label] = {
          total: termTotal,
          ca1,
          ca2,
          ca3,
          exam
        };
=======
          resultsBySubject[subjectId].scores[term.label] = termTotal;
>>>>>>> 35eea63723a0204715167da5b5544a92f6ef81a2
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

<<<<<<< HEAD
      const t1 = record.scores["1st Term"]?.total || 0;
      const t2 = record.scores["2nd Term"]?.total || 0;
      const t3Data = record.scores["3rd Term"] || {};

      // For third term, we need to extract CA and Exam separately for better display
      const t3 = t3Data.total || 0;
      const ca1_3 = t3Data.ca1 || 0;
      const ca2_3 = t3Data.ca2 || 0;
      const ca3_3 = t3Data.ca3 || 0;
      const exam_3 = t3Data.exam || 0;

=======
      const t1 = record.scores["1st Term"] || 0;
      const t2 = record.scores["2nd Term"] || 0;
      const t3 = record.scores["3rd Term"] || 0;
>>>>>>> 35eea63723a0204715167da5b5544a92f6ef81a2
      const total = record.total;
      const avg = (total / 3).toFixed(2);

      grandTotal += total;
      subjectCount++;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="text-align: left;">${name}</td>
        <td>${t1}</td>
        <td>${t2}</td>
<<<<<<< HEAD
        <!-- <td>${t3}</td> -->

        <td>${ca1_3}</td>
        <td>${ca2_3}</td>
        <td>${ca3_3}</td>
        <td>${exam_3}</td>

=======
        <td>${t3}</td>
>>>>>>> 35eea63723a0204715167da5b5544a92f6ef81a2
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

<<<<<<< HEAD
//code to load psychomotor data
function loadPsychomotor() {
  const tx = db.transaction("psychomotor", "readonly");
  const store = tx.objectStore("psychomotor");
  const term = 3

  const recordKey = `${studentId}_${sessionId}_${term}`;
  const request = store.get(recordKey);

  request.onsuccess = (event) => {
    const data = event.target.result;
    const div = document.getElementById("psychomotorDiv");

    if (!data) {
      div.innerHTML = `
        <h3>Psychomotor & Behaviour</h3>
        <p>No psychomotor record available for this term.</p>
      `;
      return;
    }

    const a = data.assessment[0];
    const b = data.behaviour[0];

    // Helper to generate a check row with rating 1–5
    const makeRow = (label, value) => {
      const v = Number(value) || 0;
      let cells = "";
      for (let i = 1; i <= 5; i++) {
        cells += `<td style="text-align:center;">${i === v ? "✔" : ""}</td>`;
      }
      return `<tr><td>${label}</td>${cells}</tr>`;
    };

    const psychomotorHTML = `
      <h5 style="margin-bottom: 0;">Psychomotor & Behaviour Assessment</h5>
      <div class="psychomotor-tables" style="display: flex;">
        <table border="1" cellspacing="0" cellpadding="2" width="100%">
          <thead>
            <tr>
              <th>Psychomotor Skills</th>
              <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
            </tr>
          </thead>
          <tbody>
            ${makeRow("Handwriting", a.handwriting)}
            ${makeRow("Fluency", a.fluency)}
            ${makeRow("Sports", a.sports)}
            ${makeRow("Handling of Tools", a.handlingOfTools)}
            ${makeRow("Drawing & Painting", a.drawing)}
            ${makeRow("Crafts", a.crafts)}
          </tbody>
        </table>

        <table border="1" cellspacing="0" cellpadding="2" width="100%">
          <thead>
            <tr>
              <th>Behavioural Traits</th>
              <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
            </tr>
          </thead>
          <tbody>
            ${makeRow("Punctuality", b.punctuality)}
            ${makeRow("Attendance at Class", b.attendanceAtClass)}
            ${makeRow("Reliability", b.reliability)}
            ${makeRow("Honesty", b.honesty)}
            ${makeRow("Relationship with Staff", b.relationshipWithStaff)}
            ${makeRow("Relationship with Other Students", b.relationshipWithOtherStudents)}
          </tbody>
        </table>
        <table border="1" cellspacing="0" cellpadding="2" width="100%">
          <thead>
            <tr>
              <th>Behavioural Traits</th>
              <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
            </tr>
          </thead>
          <tbody>
            ${makeRow("Spirit of Cooperation", b.spiritOfCooperation)}
            ${makeRow("Sense of Responsibility", b.senseOfResponsibility)}
            ${makeRow("Attentiveness", b.attentiveness)}
            ${makeRow("Organizational Ability", b.organizationalAbility)}
            ${makeRow("Perseverance", b.perseverance)}
            ${makeRow("Self Control", b.selfControl)}
          </tbody>
        </table>
      </div>
    `;

    div.innerHTML = psychomotorHTML;
  };

  request.onerror = () => {
    console.error("Error loading psychomotor data.");
  };
}

=======
>>>>>>> 35eea63723a0204715167da5b5544a92f6ef81a2
// ================== PRINT ==================
document.getElementById("printBtn").addEventListener("click", () => {
  window.print();
});
