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

  store.get(1).onsuccess = (e) => {
    const school = e.target.result;
    if (!school) return;

    const logoDiv = document.getElementById("schoolLogoDiv");
    const nameDiv = document.getElementById("schoolNameDiv");

    logoDiv.innerHTML = "";
    nameDiv.innerHTML = "";

    const img = document.createElement("img");
    img.src = URL.createObjectURL(school.logo);
    img.style.width = "100px";

    nameDiv.innerHTML = `
      <h1>${school.name}</h1>
      <h3>${school.address}</h3>
    `;

    logoDiv.appendChild(img);
  };
}



// ================== STUDENT INFO ==================
function loadStudentInfo() {
  const tx = db.transaction(
    ["students", "classes", "session", "session_students", "attendance"],
    "readonly"
  );

  const table = document.getElementById("studentInfo");
  const table2 = document.getElementById("studentInfo2");

  table.innerHTML = "";
  table2.innerHTML = "";

  // ===== STUDENT =====
  tx.objectStore("students").get(studentId).onsuccess = (e) => {
    const student = e.target.result;
    if (!student) return;

    table.innerHTML += `
      <tr><td class="topTableClass"><b>Name:</b></td>
      <td>${student.surName} ${student.firstName}</td></tr>
    `;
  };

  // ===== SESSION =====
  tx.objectStore("session").get(sessionId).onsuccess = (e) => {
    const session = e.target.result;
    if (!session) return;

    table.innerHTML += `
      <tr><td class="topTableClass"><b>Session:</b></td>
      <td>${session.session}</td></tr>
    `;

    table2.innerHTML += `
      <tr><td class="topTableClass"><b>Term:</b></td><td>3rd Term</td></tr>
      <tr><td class="topTableClass"><b>Vacation:</b></td><td>${session.thirdVac || "-"}</td></tr>
      <tr><td class="topTableClass"><b>Resumption:</b></td><td>${session.thirdRes || "-"}</td></tr>
    `;
  };

  // ===== CLASS + COUNT =====
  const mapStore = tx.objectStore("session_students").openCursor();

  mapStore.onsuccess = (event) => {
    const cursor = event.target.result;

    if (cursor) {
      const rec = cursor.value;

      if (rec.studentID === studentId && rec.sessionID === sessionId) {
        const classId = rec.classID;

        // Class name
        db.transaction("classes", "readonly")
          .objectStore("classes")
          .get(classId).onsuccess = (c) => {
            table.innerHTML += `
              <tr><td class="topTableClass"><b>Class:</b></td>
              <td>${c.target.result.className}</td></tr>
            `;
          };

        // Count students
        let count = 0;
        db.transaction("session_students", "readonly")
          .objectStore("session_students")
          .openCursor().onsuccess = (e) => {
            const cur = e.target.result;

            if (cur) {
              if (cur.value.classID === classId && cur.value.sessionID === sessionId) {
                count++;
              }
              cur.continue();
            } else {
              table.innerHTML += `
                <tr><td class="topTableClass"><b>Total Students:</b></td>
                <td>${count}</td></tr>
              `;
            }
          };

        return;
      }

      cursor.continue();
    }
  };

  // ===== ATTENDANCE =====
  const term = 3;

  tx.objectStore("attendance").openCursor().onsuccess = (e) => {
    const cursor = e.target.result;

    if (cursor) {
      const r = cursor.value;

      if (
        r.studentID === studentId &&
        r.sessionID === sessionId &&
        Number(r.term) === term
      ) {
        table2.innerHTML += `
          <tr><td class="topTableClass"><b>Attendance:</b></td>
          <td>${r.presentDays} / ${r.totalDays}</td></tr>
        `;
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

  const results = {};
  let done = 0;

  terms.forEach(term => {
    db.transaction(term.store, "readonly")
      .objectStore(term.store)
      .openCursor().onsuccess = (e) => {
        const cursor = e.target.result;

        if (cursor) {
          const r = cursor.value;

          if (r.studentID === studentId && r.session === sessionId) {
            const subjectId = r.subjectID;

            const total =
              (r.ca1 || 0) +
              (r.ca2 || 0) +
              (r.ca3 || 0) +
              (r.exam || 0);

            if (!results[subjectId]) {
              results[subjectId] = {
                subjectId,
                scores: {},
                total: 0
              };
            }

            results[subjectId].scores[term.label] = {
              total,
              ca1: r.ca1 || 0,
              ca2: r.ca2 || 0,
              ca3: r.ca3 || 0,
              exam: r.exam || 0
            };

            results[subjectId].total += total;
          }

          cursor.continue();
        } else {
          done++;
          if (done === terms.length) {
            renderCumulativeTable(results);
          }
        }
      };
  });
}



function renderCumulativeTable(results) {
  const tbody = document.querySelector("#cumulativeTable tbody");
  tbody.innerHTML = "";

  let grandTotal = 0;
  let count = 0;

  const subjectStore = db.transaction("subjectStore", "readonly").objectStore("subjectStore");

  Object.values(results).forEach(r => {
    subjectStore.get(r.subjectId).onsuccess = (s) => {
      const name = s.target.result?.subjects || "Unknown";

      const t1 = r.scores["1st Term"]?.total || 0;
      const t2 = r.scores["2nd Term"]?.total || 0;
      const t3 = r.scores["3rd Term"] || {};

      const total = r.total;
      const avg = (total / 3).toFixed(2);

      grandTotal += total;
      count++;

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${name}</td>
        <td>${t1}</td>
        <td>${t2}</td>

        <td>${t3.ca1 || 0}</td>
        <td>${t3.ca2 || 0}</td>
        <td>${t3.ca3 || 0}</td>
        <td>${t3.exam || 0}</td>

        <td>${t3.total || 0}</td>
        <td>${total}</td>
        <td>${avg}</td>
        <td>${getGrade(avg)}</td>
        <td>${getRemark(avg)}</td>
      `;

      tbody.appendChild(row);
    }
    });

  setTimeout(() => {
    if (count > 0) {
      const avg = (grandTotal / (count * 3)).toFixed(2);

      document.getElementById("cumulativeSummary").innerHTML = `
      <div>
        Grand Total: ${grandTotal} |
        Average: ${avg} |
        Grade: ${getGrade(avg)}
        </div>
        <div style="color:${avg >= 45 ? "green" : "red"}">
          ${avg >= 45 ? "PROMOTED" : "REPEAT"}
        </div>
      `;
    }
  }, 300);



// ================== HELPERS ==================
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
loadPsychomotor();
}

// ================== PRINT ==================
document.getElementById("printBtn").addEventListener("click", () => {
  window.print();
})
