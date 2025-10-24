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

function displayInfo(){
    const transaction = db.transaction('students', 'readonly');
    const classStudents = transaction.objectStore('students');

    const table = document.querySelector('#student-table tbody');
    table.innerHTML = '';

    let count = 0;

    classStudents.openCursor().onsuccess = (event)=>{
        const cursor = event.target.result;
        if(cursor){
            const {id, firstName, surName, otherName, classID} = cursor.value;
            if(userId == classID){
                count++
                const row = document.createElement('tr');
                const cellId = document.createElement('td');
                cellId.textContent = id;
                row.appendChild(cellId);

                const cellFirstName = document.createElement('td');
                cellFirstName.textContent = firstName;
                row.appendChild(cellFirstName);

                const cellSurName = document.createElement('td');
                cellSurName.textContent = surName;
                row.appendChild(cellSurName);

                const cellOtherName = document.createElement('td');
                cellOtherName.textContent = otherName;
                row.appendChild(cellOtherName);

                const cellAction = document.createElement('td');

                //1st term button code
                const firstTerm = document.createElement('button');
                firstTerm.textContent = '1st Term';
                cellAction.appendChild(firstTerm);
                firstTerm.onclick = function(){
                    window.location.href = `firstTerm.html?id=${id}`;
                }
                
                //2nd term button code
                const secondTerm = document.createElement('button');
                secondTerm.textContent = '2nd Term';
                cellAction.appendChild(secondTerm);
                secondTerm.onclick = function(){
                    window.location.href = `secondTerm.html?id=${id}`;
                }
                
                //3rd term button code
                const thirdTerm = document.createElement('button');
                thirdTerm.textContent = '3rd Term';
                cellAction.appendChild(thirdTerm);
                thirdTerm.onclick = function(){
                    window.location.href = `thirdTerm.html?id=${id}`;
                }

                // Promotion button
                const promoteBtn = document.createElement('button');
                promoteBtn.textContent = 'Promote';
                cellAction.appendChild(promoteBtn);

                promoteBtn.onclick = function () {
                    openPromotionModal(id, `${firstName} ${surName}`);
                };
                
                row.appendChild(cellAction) 

                table.appendChild(row);
            }

            cursor.continue();
        }else{
            const studentAmount = document.createElement('h2');
                studentAmount.textContent = `${count} Student(s)`;
                studentAmount.style.color = `rgba(89, 154, 180, 0.89)`;
             document.getElementById('amountOfStudent').appendChild(studentAmount);
                console.log(count)
        }

    }

}

let selectedStudentId = null;

function openPromotionModal(studentId, name) {
    selectedStudentId = studentId;

    // Show student name
    document.getElementById('studentName').textContent = name;

    // Populate dropdown with classes
    const classSelect = document.getElementById('classSelect');
    classSelect.innerHTML = ''; // clear old options

    const classTx = db.transaction('classes', 'readonly');
    const classStore = classTx.objectStore('classes');
    classStore.openCursor().onsuccess = function (e) {
        const cursorClass = e.target.result;
        if (cursorClass) {
            const option = document.createElement('option');
            option.value = cursorClass.value.id;
            option.textContent = cursorClass.value.className;
            classSelect.appendChild(option);
            cursorClass.continue();
        }
    };

    // Show modal
    document.getElementById('promotionModal').style.display = 'flex';
}

// Cancel button
document.getElementById('cancelPromotion').onclick = function () {
    document.getElementById('promotionModal').style.display = 'none';
};

// Confirm promotion
document.getElementById('confirmPromotion').onclick = function () {
    const newClassId = Number(document.getElementById('classSelect').value);
    if (!selectedStudentId || isNaN(newClassId)) return;

    const tx = db.transaction('students', 'readwrite');
    const store = tx.objectStore('students');

    const getStudent = store.get(selectedStudentId);
    getStudent.onsuccess = function () {
        const studentData = getStudent.result;
        if (studentData) {
            studentData.classID = newClassId;
            store.put(studentData);
            console.log(`Student promoted to class ID ${newClassId}!`);
            document.getElementById('promotionModal').style.display = 'none';
            displayInfo(); // Refresh table
        }
    };
};


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

