let db;

import { DB_NAME, DB_VERSION } from './app.js';

const urlParams = new URLSearchParams(window.location.search);
const studentId = Number(urlParams.get("id"));
const term = Number(urlParams.get("term"));
const sessionId = Number(urlParams.get("session"));


const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = () =>{
  console.log('Error opening db')
}

request.onsuccess = (event) => {
  db = event.target.result;
  loadStudentInfo();
  loadResult();
  // loadAttendance();
  loadPsychomotor();
  remarkDisplay();
  // loadAttendanceToStudentTh2()
  loadTermInfo()

};

//School logo
function renderSchoolHeaderAndFooter() {
  const tx = db.transaction("school", "readonly");
  const store = tx.objectStore("school");
  const request = store.get(1); // assuming id = 1

  request.onsuccess = () => {
    const school = request.result;
    if (!school) return;

    // Header (top of result)
    const headerDiv = document.createElement("div");
    headerDiv.classList = 'logoHeader'

    const subHeaderDiv = document.createElement("div");
    subHeaderDiv.classList = 'centerHeader'
    
    const lastHeaderDiv = document.createElement("div");
    lastHeaderDiv.classList = 'logoHeader'

    const logoImg = document.createElement("img");
    logoImg.src = URL.createObjectURL(school.logo);
    logoImg.alt = "School Logo";
    logoImg.style.width = "90%";
    logoImg.style.height = "90%";
    logoImg.style.objectFit = "contain";
    logoImg.style.display = "block";
    logoImg.style.margin = "0 auto 5px";

    const schoolName = document.createElement("h1");
    schoolName.textContent = school.name;
    schoolName.style.margin = "0";
    schoolName.style.fontSize = "25px";

    const schoolAddress = document.createElement('h2');
    schoolAddress.textContent = school.address;
    schoolAddress.style.margin = "0";
    schoolAddress.style.fontSize = "18px";
    
    
    headerDiv.appendChild(logoImg);
    subHeaderDiv.appendChild(schoolName);
    subHeaderDiv.appendChild(schoolAddress);

    document.getElementById('schoolLogoDiv').appendChild(headerDiv)
    document.getElementById('schoolLogoDiv').appendChild(subHeaderDiv)
    document.getElementById('schoolLogoDiv').appendChild(lastHeaderDiv)

    // resultDiv.prepend(headerDiv); // ✅ Add to top of resultDiv
  };
}


// ===============================
// LOAD STUDENT INFO
// ===============================
function loadStudentInfo() {
  const transaction = db.transaction(['students', 'classes', 'session', 'session_students'], 'readonly');

  let studentTh = document.getElementById('studentTh');
  let studentTh2 = document.getElementById('studentTh2');

  studentTh.innerHTML = "";
  studentTh2.innerHTML = "";

  // ===============================
  // STUDENT NAME
  // ===============================
  const studentStore = transaction.objectStore('students');
  studentStore.get(studentId).onsuccess = (e) => {
    const student = e.target.result;
    if (!student) return;

    const row = document.createElement('tr');
    row.innerHTML = `<td>Student Name:</td><td>${student.surName} ${student.firstName} ${student.otherName}</td>`;
    studentTh.appendChild(row);
  };

  // ===============================
  // SESSION
  // ===============================
  const sessionStore = transaction.objectStore('session');
  sessionStore.get(sessionId).onsuccess = (s) => {
    const session = s.target.result;
    if (!session) return;

    const row = document.createElement('tr');
    row.innerHTML = `<td>Academic Session:</td><td>${session.session}</td>`;
    studentTh.appendChild(row);
  };

  // ===============================
  // CLASS + STUDENT COUNT
  // ===============================
  const mapStore = transaction.objectStore('session_students');
  const request = mapStore.openCursor();

  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const record = cursor.value;
      if (record.studentID === studentId && record.sessionID === sessionId) {
        const classStore = db.transaction('classes', 'readonly').objectStore('classes');
        classStore.get(record.classID).onsuccess = (c) => {
          const classData = c.target.result;

          // CLASS NAME IN studentTh
          const classRow = document.createElement('tr');
          classRow.innerHTML = `<td>Class:</td><td>${classData.className}</td>`;
          studentTh.appendChild(classRow);

          // COUNT STUDENTS IN SAME CLASS
          const tx2 = db.transaction("session_students", "readonly");
          const countStore = tx2.objectStore("session_students");
          const countReq = countStore.getAll();

          countReq.onsuccess = () => {
            const all = countReq.result.filter(
              r => r.classID === record.classID && r.sessionID === sessionId
            );
            const countRow = document.createElement('tr');
            countRow.innerHTML = `<td>Students in Class:</td><td>${all.length}</td>`;
            studentTh2.appendChild(countRow); // still show student count in Th2
          };
        };
        return;
      }
      cursor.continue();
    }
  };

  // ===============================
  // MOVE TERM TO studentTh2
  // ===============================
  function termDefined(terms) {
    if (terms == 1) return "1st";
    if (terms == 2) return "2nd";
    if (terms == 3) return "3rd";
    return "";
  }

  const termRow = document.createElement('tr');
  termRow.innerHTML = `<td>Term:</td><td>${termDefined(term)} Term</td>`;
  studentTh2.appendChild(termRow);

  // LOAD ATTENDANCE, VACATION, AND RESUMPTION
  loadAttendanceToStudentTh();
  loadTermDatesToStudentTh2();
}

// ===============================
// ATTENDANCE LOADER
// ===============================
function loadAttendanceToStudentTh() {
  const tx = db.transaction("attendance", "readonly");
  const store = tx.objectStore("attendance");
  const cursorRequest = store.openCursor();

  cursorRequest.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const record = cursor.value;

      if (
        record.studentID === studentId &&
        record.sessionID === sessionId &&
        Number(record.term) === Number(term)
      ) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>Attendance:</td><td>${record.presentDays} / ${record.totalDays}</td>`;
        document.getElementById("studentTh").appendChild(row);
      }
      cursor.continue();
    }
  };
}

// ===============================
// ADD VACATION & RESUMPTION TO studentTh2
// ===============================
function loadTermDatesToStudentTh2() {
  const tx = db.transaction("session", "readonly");
  const store = tx.objectStore("session");
  const req = store.get(sessionId);

  req.onsuccess = (event) => {
    const record = event.target.result;
    if (!record) return;

    let vacDate = "-";
    let resDate = "-";

    if (term === 1) {
      vacDate = record.firstVac || "-";
      resDate = record.firstRes || "-";
    } else if (term === 2) {
      vacDate = record.secondVac || "-";
      resDate = record.secondRes || "-";
    } else if (term === 3) {
      vacDate = record.thirdVac || "-";
      resDate = record.thirdRes || "-";
    }

    const vacRow = document.createElement("tr");
    vacRow.innerHTML = `<td>Vacation Date:</td><td>${vacDate}</td>`;

    const resRow = document.createElement("tr");
    resRow.innerHTML = `<td>Next Term Begins:</td><td>${resDate}</td>`;

    const studentTh2 = document.getElementById("studentTh2");
    studentTh2.appendChild(vacRow);
    studentTh2.appendChild(resRow);
  };
}


function loadResult() {
  let storeName;
  if (term === 1) storeName = 'firstTerm';
  if (term === 2) storeName = 'secondTerm';
  if (term === 3) storeName = 'thirdTerm';

  const transaction = db.transaction(storeName, 'readonly');
  const termStore = transaction.objectStore(storeName);

  renderSchoolHeaderAndFooter();

  const tableBody = document.querySelector("#resultTable tbody");
  tableBody.innerHTML = "";

  let totalOverall = 0;
  let subjectCount = 0;
  let classId = null; // ✅ we'll save the student's class ID here

  termStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const result = cursor.value;

      // ✅ only show result for this student & session
      if (result.studentID === studentId && result.session === sessionId) {
        const { ca1, ca2, ca3, exam, subjectID, classID } = result;
        classId = classID; // ✅ capture the class ID
        const subjectTotal = (ca1 || 0) + (ca2 || 0) + (ca3 || 0) + (exam || 0);
        subjectCount++;
        totalOverall += subjectTotal;

        // get subject name
        const subTransaction = db.transaction('subjectStore', 'readonly');
        const subjectStore = subTransaction.objectStore('subjectStore');
        subjectStore.get(subjectID).onsuccess = (s) => {
          const subject = s.target.result;

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${subject ? subject.subjects : "Unknown"}</td>
            <td>${ca1 ?? 0}</td>
            <td>${ca2 ?? 0}</td>
            <td>${ca3 ?? 0}</td>
            <td>${exam ?? 0}</td>
            <td>${subjectTotal}</td>
            <td>${getGrade(subjectTotal)}</td>
            <td>${getRemark(subjectTotal)}</td>
          `;
          tableBody.appendChild(row);
        };
      }
      cursor.continue();
    } else {
      if (subjectCount > 0) {
        const average = (totalOverall / subjectCount).toFixed(2);
        // 🧮 Pass classId safely
        calculateStudentPosition(studentId, sessionId, term, totalOverall, average, classId);
      } else {
        document.getElementById("summary").textContent =
          "No result found for this session and term.";
      }
    }
  };
}

/**
 * 🏆 Calculate and show student position (by class)
 */
function calculateStudentPosition(studentId, sessionId, term, totalOverall, average, classId) {
  if (!classId) {
    console.warn("No classId found for this student.");
    return;
  }

  let storeName;
  if (term === 1) storeName = 'firstTerm';
  if (term === 2) storeName = 'secondTerm';
  if (term === 3) storeName = 'thirdTerm';

  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);

  const allResults = [];
  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const record = cursor.value;

      // only include same class + same session
      if (record.classID === classId && record.session === sessionId) {
        const score = (record.ca1 || 0) + (record.ca2 || 0) + (record.ca3 || 0) + (record.exam || 0);
        const existing = allResults.find(r => r.studentID === record.studentID);
        if (existing) {
          existing.total += score;
          existing.subjectCount++;
        } else {
          allResults.push({
            studentID: record.studentID,
            total: score,
            subjectCount: 1
          });
        }
      }
      cursor.continue();
    } else {
      // calculate average per student
      allResults.forEach(r => {
        r.average = r.total / r.subjectCount;
      });

      // sort descending by average
      allResults.sort((a, b) => b.average - a.average);

      // assign positions (handle ties)
      let lastAvg = null;
      let lastPos = 0;
      allResults.forEach((r, i) => {
        if (r.average === lastAvg) {
          r.position = lastPos;
        } else {
          r.position = i + 1;
          lastPos = r.position;
          lastAvg = r.average;
        }
      });

      const studentRecord = allResults.find(r => r.studentID === studentId);

      // ✅ Display summary
      // const totalScore = document.getElementById('totalScore');
      // const averageScore = document.getElementById('averageScore');
      // const positionScore = document.getElementById('gradeScore');
      const resultPosition = document.getElementById('resultPosition');

      // totalScore.innerHTML = "";
      // averageScore.innerHTML = "";
      // positionScore.innerHTML = "";
      resultPosition.innerHTML = "";

      const positionInfo = document.createElement('div');
      positionInfo.style.marginBottom = '15px';
      positionInfo.innerHTML = `<h4>
      <span style="margin-right: 40px;">Total Score: ${totalOverall}</span>
       | <span style="margin-right: 40px;">Average: ${average}</span> 
       | <span style="margin-right: 5px;">Position: ${studentRecord
        ? `${studentRecord.position}${getPositionSuffix(studentRecord.position)}`
        : "N/A"
      } </span></h4>`;
      resultPosition.appendChild(positionInfo);

      // const totalTd = document.createElement('td');
      // const totalTd2 = document.createElement('td');
      // totalTd.textContent = `Total Score`;
      // totalTd2.textContent = `${totalOverall}`;

      // const averageTd = document.createElement('td');
      // const averageTd2 = document.createElement('td');
      // averageTd.textContent = `Average`;
      // averageTd2.textContent = `${average}`;

      // const positionTd = document.createElement('td');
      // const positionTd2 = document.createElement('td');
      // positionTd.textContent = `Position`;
      // positionTd2.textContent = studentRecord
      //   ? `${studentRecord.position}${getPositionSuffix(studentRecord.position)}`
      //   : "N/A";

      // totalScore.appendChild(totalTd);
      // totalScore.appendChild(totalTd2);
      // averageScore.appendChild(averageTd);
      // averageScore.appendChild(averageTd2);
      // positionScore.appendChild(positionTd);
      // positionScore.appendChild(positionTd2);
      resultPosition.appendChild(positionInfo);
    }
  };
}


/**
 * 🩵 Helper for 1st / 2nd / 3rd / etc.
 */
function getPositionSuffix(pos) {
  if (pos % 10 === 1 && pos % 100 !== 11) return "st";
  if (pos % 10 === 2 && pos % 100 !== 12) return "nd";
  if (pos % 10 === 3 && pos % 100 !== 13) return "rd";
  return "th";
}

//display vacation and resumption dates
// function loadTermInfo() {
//   const tx = db.transaction("session", "readonly");
//   const store = tx.objectStore("session");
//   const req = store.get(sessionId);

//   req.onsuccess = (event) => {
//     const record = event.target.result;

//     const vac = document.getElementById("vacationDateDisplay");
//     const res = document.getElementById("resumptionDateDisplay");
//     const title = document.getElementById("termTitle");

//     if (!record) {
//       title.textContent = "No session record found.";
//       vac.textContent = "-";
//       res.textContent = "-";
//       return;
//     }

//     // Choose correct term info
//     let vacDate = "-";
//     let resDate = "-";
//     let termName = "";

//     if (term === 1) {
//       vacDate = record.firstVac || "-";
//       resDate = record.firstRes || "-";
//       termName = "First Term";
//     } else if (term === 2) {
//       vacDate = record.secondVac || "-";
//       resDate = record.secondRes || "-";
//       termName = "Second Term";
//     } else if (term === 3) {
//       vacDate = record.thirdVac || "-";
//       resDate = record.thirdRes || "-";
//       termName = "Third Term";
//     }

//     // title.textContent = `${termName} `;
//     vac.textContent = `Vacation Date: ${vacDate}`;
//     res.textContent = `Next Term Begins: ${resDate}`;
//   };

//   req.onerror = () => {
//     console.error("Error loading session record.");
//   };
// }

//Print btn ======= ---=
document.getElementById('printBtn').addEventListener('click', ()=>{
  window.print();
})

function remarkDisplay(){
  const tx = db.transaction('remark', 'readonly');
  const store = tx.objectStore('remark');

  const secretKey = `${String(studentId)}_${String(sessionId)}_${String(term)}`;

  const getStudentRemark = store.get(secretKey);

  getStudentRemark.onsuccess = () =>{
    const cursor = getStudentRemark.result;

    document.getElementById('remarkfromDB')
    .textContent = `${cursor.remark}`
  }

}



function getGrade(score) {
  if(score >= 75) return "A";
  if(score >= 65) return "B";
  if(score >= 50) return "C";
  if(score >= 40) return "D";
  return "F";
}

function getRemark(score) {
  if(score >= 70) return "Excellent";
  if(score >= 60) return "Very Good";
  if(score >= 50) return "Good";
  if(score >= 45) return "Fair";
  if(score >= 40) return "Pass";
  return "Fail";
}

//code to load psychomotor data
function loadPsychomotor() {
  const tx = db.transaction("psychomotor", "readonly");
  const store = tx.objectStore("psychomotor");

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
      <h5>Psychomotor & Behaviour Assessment</h5>
      <div class="psychomotor-tables">
        <table border="1" cellspacing="0" cellpadding="4" width="100%">
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

        <table border="1" cellspacing="0" cellpadding="4" width="100%">
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
        <table border="1" cellspacing="0" cellpadding="4" width="100%">
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


