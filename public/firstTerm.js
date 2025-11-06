// ----- URL & UI -----
const urlParams = new URLSearchParams(window.location.search);
const userId = Number(urlParams.get("id"));

import { tog } from "./toggle.js";
import { DB_NAME, DB_VERSION } from "./app.js";

const regSubject = document.getElementById("regSubject");
const dismise = document.getElementById("dismise");
const registerFormDiv = document.getElementById("registerFormDiv");

regSubject.addEventListener("click", () => tog(registerFormDiv));
dismise.addEventListener("click", () => tog(registerFormDiv));

let db;

// ----- DB OPEN -----
const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event) => {
  db = event.target.result;
};

request.onerror = () => {
  console.error("Error opening database");
};

request.onsuccess = async (event) => {
  db = event.target.result;
  displayCheckbox();
  studentNameDisplay();
  await displayTable();
  addPsychomotor();
  autoLoadPsychomotor();
};

// ======== Helpers ========

function getCurrentSessionId() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("students", "readonly");
    const store = tx.objectStore("students");
    const req = store.get(userId);

    req.onsuccess = () => {
      if (!req.result) return;
      resolve(req.result.sessionID);
    };
    req.onerror = () => reject(new Error("Failed to read students store"));
  });
}

function getCurrentClassId() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("students", "readonly");
    const store = tx.objectStore("students");
    const req = store.get(userId);

    req.onsuccess = () => {
      if (!req.result) return;
      resolve(req.result.classID);
    };
    req.onerror = () => reject(new Error("Failed to read students store"));
  });
}

function toInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function getGrade(totalScore) {
  if (totalScore >= 75) return "A1";
  else if (totalScore >= 70) return "B2";
  else if (totalScore >= 65) return "B3";
  else if (totalScore >= 60) return "C4";
  else if (totalScore >= 55) return "C5";
  else if (totalScore >= 50) return "C6";
  else if (totalScore >= 45) return "D7";
  else if (totalScore >= 40) return "E8";
  else return "F9";
}

// ======== Subjects Checkbox ========

function displayCheckbox() {
  const transaction = db.transaction("subjectStore", "readonly");
  const subjectsStore = transaction.objectStore("subjectStore");

  const container = document.getElementById("checkboxContainer");
  container.innerHTML = "";

  subjectsStore.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const subject = cursor.value;

      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = subject.id;
      checkbox.name = "subjectCheckbox";

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" " + subject.subjects));
      container.appendChild(label);

      container.appendChild(document.createElement("br"));
      cursor.continue();
    }
  };
}

document.getElementById("submitSubjects").addEventListener("click", async function () {
  const checkboxes = document.querySelectorAll("input[name='subjectCheckbox']:checked");

  if (checkboxes.length === 0) {
    alert("No subjects selected.");
    return;
  }

  let sessionID;
  let classID;
  try {
    sessionID = await getCurrentSessionId();
    classID = await getCurrentClassId();
  } catch (err) {
    alert(err.message);
    return;
  }

  const tx = db.transaction("firstTerm", "readwrite");
  const store = tx.objectStore("firstTerm");

  checkboxes.forEach((checkbox) => {
    store.add({
      subjectID: toInt(checkbox.value),
      studentID: toInt(userId),
      classID: toInt(classID),
      ca1: 0,
      ca2: 0,
      ca3: 0,
      exam: 0,
      session: toInt(sessionID),
    });
  });

  tx.oncomplete = async () => {
    alert("Selected subjects saved.");
    await displayTable();
  };

  tx.onerror = () => {
    alert("Failed to save selected subjects.");
  };
});

// ======== Student Name ========

function studentNameDisplay() {
  const transaction = db.transaction("students", "readonly");
  const studentName = transaction.objectStore("students");

  studentName.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const result = cursor.value;
      if (result.id === userId) {
        const student = document.getElementById("studentName");
        const studentIdPsychomotor = document.getElementById("studentIdPsychomotor");
        studentIdPsychomotor.value = `${result.id}`;
        const psychomotorSession = document.getElementById('psychomotorSession')
        psychomotorSession.value = `${result.sessionID}`
        student.textContent = `${result.firstName} ${result.surName}`;
      }
      cursor.continue();
    }
  };
}

// ======== Table Display ========

async function displayTable() {
  let sessionID;
  try {
    sessionID = await getCurrentSessionId();
  } catch (err) {
    alert(err.message);
    return;
  }

  const transaction = db.transaction(["firstTerm", "subjectStore"], "readonly");
  const firstTermStore = transaction.objectStore("firstTerm");
  const subjectStore = transaction.objectStore("subjectStore");

  const tbody = document.querySelector("#student-firstTerm tbody");
  tbody.innerHTML = "";

  const allRecords = [];

  // Collect all student records first
  await new Promise((resolve) => {
    firstTermStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const record = cursor.value;
        if (toInt(record.studentID) === toInt(userId) && toInt(record.session) === toInt(sessionID)) {
          allRecords.push(record);
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
  });

  // Attach subject names to records
  for (const rec of allRecords) {
    const subReq = subjectStore.get(toInt(rec.subjectID));
    await new Promise((res) => {
      subReq.onsuccess = () => {
        rec.subjectName = subReq.result ? subReq.result.subjects : "Unknown subject";
        res();
      };
      subReq.onerror = () => res();
    });
  }

  // Sort alphabetically by subjectName
  allRecords.sort((a, b) => (a.subjectName || "").localeCompare(b.subjectName || ""));

  // Render table rows
  allRecords.forEach((record) => {
    const row = document.createElement("tr");

    const subjectCell = document.createElement("td");
    subjectCell.textContent = record.subjectName;
    row.appendChild(subjectCell);

    const makeNumberInputCell = (value = 0) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.value = toInt(value);
      input.style.width = "4rem";
      td.appendChild(input);
      return { td, input };
    };

    const ca1 = makeNumberInputCell(record.ca1);
    const ca2 = makeNumberInputCell(record.ca2);
    const ca3 = makeNumberInputCell(record.ca3);
    const exam = makeNumberInputCell(record.exam);

    row.appendChild(ca1.td);
    row.appendChild(ca2.td);
    row.appendChild(ca3.td);

    const caSumCell = document.createElement("td");
    const calcCA = () => toInt(ca1.input.value) + toInt(ca2.input.value) + toInt(ca3.input.value);
    caSumCell.textContent = calcCA();
    caSumCell.style.fontWeight = "bold";
    row.appendChild(caSumCell);

    row.appendChild(exam.td);

    const grandTotalCell = document.createElement("td");
    const calcGrand = () => calcCA() + toInt(exam.input.value);
    grandTotalCell.textContent = calcGrand();
    grandTotalCell.style.fontWeight = "bold";
    row.appendChild(grandTotalCell);

    const gradeCell = document.createElement("td");
    gradeCell.textContent = getGrade(calcGrand());
    row.appendChild(gradeCell);

    [ca1.input, ca2.input, ca3.input, exam.input].forEach((inp) =>
      inp.addEventListener("input", () => {
        caSumCell.textContent = calcCA();
        grandTotalCell.textContent = calcGrand();
        gradeCell.textContent = getGrade(calcGrand());
      })
    );

    // Delete button
    const action = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.style.background = "red";
    deleteBtn.style.border = "none";

    deleteBtn.addEventListener("click", async () => {
      const confirmDelete = confirm("Are you sure you want to delete this subject?");
      if (!confirmDelete) return;

      const dTx = db.transaction("firstTerm", "readwrite");
      const ft = dTx.objectStore("firstTerm");
      const delReq = ft.delete(toInt(record.id));

      delReq.onsuccess = async () => {
        alert("Subject Deleted!");
        await displayTable();
      };

      delReq.onerror = () => {
        console.error("Subject delete error");
      };
    });

    action.appendChild(deleteBtn);
    row.appendChild(action);

    tbody.appendChild(row);
  });
}


// Function to add or update psychomotor data
function addPsychomotor() {
  document.getElementById('savePsychomotor').addEventListener('click', () => {
    const studentID = document.getElementById('studentIdPsychomotor').value.trim();
    const psychomotorSession = document.getElementById('psychomotorSession').value.trim();
    const psychomotorTerm = document.getElementById('psychomotorTerm').value.trim(); // e.g. "First", "Second", etc.

    // ✅ Validate input
    if (!studentID || !psychomotorSession || !psychomotorTerm) {
      alert('Please enter Student ID, Session, and Term.');
      return;
    }

    // ✅ Combine student, session, and term into a unique key
    const recordKey = `${studentID}_${psychomotorSession}_${psychomotorTerm}`;

    // Psychomotor fields
    const handwriting = parseInt(document.getElementById('handwriting').value) || 0;
    const fluency = parseInt(document.getElementById('fluency').value) || 0;
    const sports = parseInt(document.getElementById('sports').value) || 0;
    const handlingOfTools = parseInt(document.getElementById('handlingOfTools').value) || 0;
    const drawing = parseInt(document.getElementById('drawing').value) || 0;
    const crafts = parseInt(document.getElementById('crafts').value) || 0;

    // Behaviour fields
    const punctuality = parseInt(document.getElementById('punctuality').value) || 0;
    const attendanceAtClass = parseInt(document.getElementById('attendanceAtClass').value) || 0;
    const reliability = parseInt(document.getElementById('reliability').value) || 0;
    const honesty = parseInt(document.getElementById('honesty').value) || 0;
    const relationshipWithStaff = parseInt(document.getElementById('relationshipWithStaff').value) || 0;
    const relationshipWithOtherStudents = parseInt(document.getElementById('relationshipWithOtherStudents').value) || 0;
    const spiritOfCooperation = parseInt(document.getElementById('spiritOfCooperation').value) || 0;
    const senseOfResponsibility = parseInt(document.getElementById('senseOfResponsibility').value) || 0;
    const attentiveness = parseInt(document.getElementById('attentiveness').value) || 0;
    const organizationalAbility = parseInt(document.getElementById('organizationalAbility').value) || 0;
    const perseverance = parseInt(document.getElementById('perseverance').value) || 0;
    const physicalDev = parseInt(document.getElementById('physicalDev').value) || 0;
    const selfControl = parseInt(document.getElementById('selfControl').value) || 0;

    // Start IndexedDB transaction
    const tx = db.transaction('psychomotor', 'readwrite');
    const store = tx.objectStore('psychomotor');

    // Check if record already exists
    const checkReq = store.get(recordKey);

    checkReq.onsuccess = () => {
      const existingData = checkReq.result;

      if (existingData) {
        const confirmEdit = confirm(
          `Psychomotor record already exists for Student ${studentID} (${psychomotorSession}, ${psychomotorTerm} Term).\nDo you want to update it?`
        );
        if (!confirmEdit) return;
      }

      // Prepare psychomotor data
      const psychomotorData = {
        id: recordKey, // Primary key
        studentID,
        session: psychomotorSession,
        term: psychomotorTerm, // e.g., First Term
        assessment: [{
          handwriting,
          fluency,
          sports,
          handlingOfTools,
          drawing,
          crafts,
        }],
        behaviour: [{
          punctuality,
          attendanceAtClass,
          reliability,
          honesty,
          relationshipWithStaff,
          relationshipWithOtherStudents,
          spiritOfCooperation,
          senseOfResponsibility,
          attentiveness,
          organizationalAbility,
          perseverance,
          physicalDev,
          selfControl,
        }],
      };

      // Save or update record
      const addReq = store.put(psychomotorData);

      addReq.onsuccess = () => {
        console.log(`Psychomotor record for ${studentID} (${psychomotorSession}, ${psychomotorTerm}) saved successfully.`);
        alert('Psychomotor information saved successfully!');
      };

      addReq.onerror = () => {
        console.error(`Error saving psychomotor record for ${studentID} (${psychomotorSession}, ${psychomotorTerm}).`);
        alert('Error saving psychomotor information.');
      };
    };

    checkReq.onerror = () => {
      console.error('Error checking if student record exists.');
    };
  });
}

// Function to automatically load psychomotor data when form is opened or student info is set
function autoLoadPsychomotor() {
  // Observe when student ID and session fields change or become available
  const observer = new MutationObserver(() => {
    const studentID = document.getElementById('studentIdPsychomotor').value.trim();
    const session = document.getElementById('psychomotorSession').value.trim();
    const term = document.getElementById('psychomotorTerm').value.trim();

    if (!studentID || !session || !term) return;

    // Combined key
    const recordKey = `${studentID}_${session}_${term}`;

    const tx = db.transaction('psychomotor', 'readonly');
    const store = tx.objectStore('psychomotor');
    const request = store.get(recordKey);

    request.onsuccess = () => {
      const record = request.result;
      if (!record) {
        console.log(`No psychomotor record found for ${recordKey}.`);
        return;
      }

      console.log(`Auto-loaded psychomotor record for ${recordKey}:`, record);

      // Fill in assessment values
      const a = record.assessment[0];
      document.getElementById('handwriting').value = a.handwriting || '';
      document.getElementById('fluency').value = a.fluency || '';
      document.getElementById('sports').value = a.sports || '';
      document.getElementById('handlingOfTools').value = a.handlingOfTools || '';
      document.getElementById('drawing').value = a.drawing || '';
      document.getElementById('crafts').value = a.crafts || '';

      // Fill in behaviour values
      const b = record.behaviour[0];
      document.getElementById('punctuality').value = b.punctuality || '';
      document.getElementById('attendanceAtClass').value = b.attendanceAtClass || '';
      document.getElementById('reliability').value = b.reliability || '';
      document.getElementById('honesty').value = b.honesty || '';
      document.getElementById('relationshipWithStaff').value = b.relationshipWithStaff || '';
      document.getElementById('relationshipWithOtherStudents').value = b.relationshipWithOtherStudents || '';
      document.getElementById('spiritOfCooperation').value = b.spiritOfCooperation || '';
      document.getElementById('senseOfResponsibility').value = b.senseOfResponsibility || '';
      document.getElementById('attentiveness').value = b.attentiveness || '';
      document.getElementById('organizationalAbility').value = b.organizationalAbility || '';
      document.getElementById('perseverance').value = b.perseverance || '';
      document.getElementById('physicalDev').value = b.physicalDev || '';
      document.getElementById('selfControl').value = b.selfControl || '';

      console.log('Psychomotor data displayed automatically.');
    };

    request.onerror = () => {
      console.error('Error fetching psychomotor data automatically.');
    };
  });

  // Watch for changes to hidden input values (when you set them dynamically)
  observer.observe(document.getElementById('psychomotorForm'), {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['value'],
  });
}

