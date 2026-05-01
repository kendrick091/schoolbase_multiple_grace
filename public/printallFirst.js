let db;

import { DB_NAME, DB_VERSION } from "./app.js";

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = () => {
  console.log("❌ Error opening database");
};

request.onsuccess = (event) => {
  db = event.target.result;
  // Wait for user to click before printing
  document.getElementById("printAllBtn").addEventListener("click", printAllResults);
};

function printAllResults() {
  const studentsTx = db.transaction("students", "readonly");
  const studentsStore = studentsTx.objectStore("students");
  const students = [];

  studentsStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      students.push(cursor.value);
      cursor.continue();
    } else {
      loadSubjects(students);
    }
  };
}

function loadSubjects(students) {
  const subjectTx = db.transaction("subjectStore", "readonly");
  const subjectStore = subjectTx.objectStore("subjectStore");
  const subjectsMap = new Map();

  subjectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      subjectsMap.set(cursor.value.id, cursor.value.subjects);
      cursor.continue();
    } else {
      loadResults(students, subjectsMap);
    }
  };
}

function loadResults(students, subjectsMap) {
  const resultTx = db.transaction("firstTerm", "readonly");
  const resultStore = resultTx.objectStore("firstTerm");
  const allResults = [];

  resultStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      allResults.push(cursor.value);
      cursor.continue();
    } else {
      renderAllResults(students, subjectsMap, allResults);
    }
  };
}

function renderAllResults(students, subjectsMap, allResults) {
  const resultDiv = document.getElementById("allResultsDiv");
  resultDiv.innerHTML = ""; // Clear previous

  students.forEach((student) => {
    const studentResults = allResults.filter(
      (r) => r.studentID === student.id && r.session === student.sessionID
    );

    if (studentResults.length > 0) {
      const section = document.createElement("div");
      section.className = "resultPage";
      section.innerHTML = `
        <h2 style="text-align:center;">${student.firstName} ${student.surName} - First Term Result</h2>
        <p><strong>ID:</strong> ${student.id}</p>
        <p><strong>Class:</strong> ${student.class}</p>
        <p><strong>Session:</strong> ${student.sessionID}</p>
      `;

      const table = document.createElement("table");
      table.border = "1";
      table.style.width = "100%";
      table.innerHTML = `
        <thead>
          <tr>
            <th>Subject</th>
            <th>CA1</th>
            <th>CA2</th>
            <th>CA3</th>
            <th>Exam</th>
            <th>Total</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = table.querySelector("tbody");
      studentResults.forEach((r) => {
        const subjectName = subjectsMap.get(r.subjectID) || "Unknown";
        const total =
          Number(r.ca1 || 0) +
          Number(r.ca2 || 0) +
          Number(r.ca3 || 0) +
          Number(r.exam || 0);
        const grade = getGrade(total);

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${subjectName}</td>
          <td>${r.ca1}</td>
          <td>${r.ca2}</td>
          <td>${r.ca3}</td>
          <td>${r.exam}</td>
          <td>${total}</td>
          <td>${grade}</td>
        `;
        tbody.appendChild(row);
      });

      section.appendChild(table);
      resultDiv.appendChild(section);
    }
  });

  window.print();
}

function getGrade(score) {
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  if (score >= 40) return "E";
  return "F";
}
