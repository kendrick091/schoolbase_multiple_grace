const urlParams = new URLSearchParams(window.location.search);
const userId = Number(urlParams.get("id"));

let db;

import { DB_NAME, DB_VERSION } from './app.js';

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event)=>{
    db = event.targer.result;
}

request.onerror = (event)=>{
    console.error("Error", event.targer.error);
}

request.onsuccess = (event)=>{
    db = event.target.result;
    console.log("classStudent info connected to DB");
    displayInfo();
    className();
}

function displayInfo() {
    const transaction = db.transaction('students', 'readonly');
    const classStudents = transaction.objectStore('students');

    const table = document.querySelector('#student-table tbody');
    table.innerHTML = '';

    let students = [];

    classStudents.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const { id, firstName, surName, otherName, classID } = cursor.value;
            if (userId == classID) {
                students.push({ id, firstName, surName, otherName, classID });
            }
            cursor.continue();
        } else {
            // Sort students alphabetically by surName
            students.sort((a, b) => a.surName.localeCompare(b.surName));

            // Display sorted list
            students.forEach(({ id, firstName, surName, otherName }) => {
                const row = document.createElement('tr');

                const cellId = document.createElement('td');
                cellId.textContent = id;
                row.appendChild(cellId);

                const cellSurName = document.createElement('td');
                cellSurName.textContent = surName;
                row.appendChild(cellSurName);

                const cellFirstName = document.createElement('td');
                cellFirstName.textContent = firstName;
                row.appendChild(cellFirstName);

                // const cellOtherName = document.createElement('td');
                // cellOtherName.textContent = otherName;
                // row.appendChild(cellOtherName);

                const cellAction = document.createElement('td');

                // 1st term
                const firstTerm = document.createElement('button');
                firstTerm.textContent = '1st Term';
                firstTerm.onclick = () => window.location.href = `selectSession.html?id=${id}&term=1`;
                cellAction.appendChild(firstTerm);

                // 2nd term
                const secondTerm = document.createElement('button');
                secondTerm.textContent = '2nd Term';
                secondTerm.onclick = () => window.location.href = `selectSession.html?id=${id}&term=2`;
                cellAction.appendChild(secondTerm);

                // 3rd term
                const thirdTerm = document.createElement('button');
                thirdTerm.textContent = '3rd Term';
                thirdTerm.onclick = () => window.location.href = `selectSession.html?id=${id}&term=3`;
                cellAction.appendChild(thirdTerm);

                // Promote
                const promoteBtn = document.createElement('button');
                promoteBtn.textContent = 'Promote';
                promoteBtn.onclick = () => openPromotionModal(id, `${firstName} ${surName}`);
                cellAction.appendChild(promoteBtn);

                row.appendChild(cellAction);
                table.appendChild(row);
            });

            // Show total count
            const amountDiv = document.getElementById('amountOfStudent');
            amountDiv.innerHTML = ''; // Clear previous count if any
            const studentAmount = document.createElement('h2');
            studentAmount.textContent = `${students.length} Student(s)`;
            studentAmount.style.color = 'rgba(89, 154, 180, 0.89)';
            amountDiv.appendChild(studentAmount);

            console.log(students.length);
        }
    };
}

function className(){
    const transaction = db.transaction('classes', 'readonly');
    const classStore = transaction.objectStore('classes');
    const store = classStore.get(userId);

    store.onsuccess = ()=>{
        const classN = store.result;
        const selectedClass = document.getElementById('selectedClass');
        selectedClass.textContent = classN.className;
    }
}
