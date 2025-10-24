let addStudent = document.getElementById('addStudent');
let dismise = document.getElementById('dismise');
let toggleFormAddForm = document.getElementById('toggleFormAddForm');

import { tog } from './toggle.js';

addStudent.addEventListener('click', function () {
    tog(toggleFormAddForm)
})
dismise.addEventListener('click', function () {
    tog(toggleFormAddForm)
})

let db;
import { DB_NAME, DB_VERSION } from './app.js';

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event) => {
    db = event.target.result;
}

// SUCCESS
request.onsuccess = (event) => {
    db = event.target.result;
    console.log('StudentDB opened')
    displayData();
    loadSelectData();
}

request.onerror = (event) => {
    console.log('Error', event.target.result);
}

// ----------------- ADD STUDENT -----------------
document.getElementById("formInput").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!db) {
        alert("DataBase not ready");
        return;
    }

    const firstNameInput = document.getElementById('firstNameInput').value;
    const surNameInput = document.getElementById('surNameInput').value;
    const otherNameInput = document.getElementById('otherNameInput').value;
    const phoneNumberInput = document.getElementById('phoneNumberInput').value;
    const selectGender = document.getElementById('selectGender').value;
    const selectClass = parseInt(document.getElementById('selectClass').value);

    const transaction = db.transaction("students", "readwrite");
    const store = transaction.objectStore("students");

    if (!selectGender) {
        alert("Gender should not be empty!")
    } else {
        const data = {
            firstName: firstNameInput,
            surName: surNameInput,
            otherName: otherNameInput,
            phoneNumber: phoneNumberInput,
            gender: selectGender,
            classID: selectClass,
            sessionID: ''
        }

        const addInput = store.add(data);

        addInput.onsuccess = function () {
            console.log("Student Added to DB successfully!");
            location.reload()
        }

        addInput.onerror = function () {
            alert("Error adding Student");
        }
    }
})

// ----------------- LOAD CLASS SELECT -----------------
function loadSelectData() {
    const tx = db.transaction('classes', 'readonly');
    const store = tx.objectStore('classes');

    store.openCursor().onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const option1 = document.createElement('option');
            option1.value = cursor.value.id;
            option1.textContent = cursor.value.className;
            document.getElementById('selectClass').appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = cursor.value.id;
            option2.textContent = cursor.value.className;
            document.getElementById('editClass').appendChild(option2);

            cursor.continue();
        }
    }
}

// ----------------- DISPLAY STUDENTS -----------------
function displayData() {
    let transaction = db.transaction(['students'], 'readonly');
    let objectStore = transaction.objectStore('students');
    const studentRequest = objectStore.getAll();

    studentRequest.onsuccess = function () {
        const students = studentRequest.result;

        // Sort alphabetically by firstName
        students.sort((a, b) => a.firstName.localeCompare(b.firstName));

        let StudentTable = document.querySelector('#student-table tbody');
        StudentTable.innerHTML = '';

        students.forEach((student) => {
            const row = document.createElement('tr');

            const cellID = document.createElement('td');
            cellID.textContent = student.id;
            row.appendChild(cellID);

            // First Name
            const cellFirstName = document.createElement('td');
            cellFirstName.textContent = student.firstName;
            row.appendChild(cellFirstName);

            // Sur Name
            const cellSurName = document.createElement('td');
            cellSurName.textContent = student.surName;
            row.appendChild(cellSurName);

            // Other Name
            const cellOtherName = document.createElement('td');
            cellOtherName.textContent = student.otherName;
            row.appendChild(cellOtherName);

            // Phone
            // const cellPhoneNumber = document.createElement('td');
            // cellPhoneNumber.textContent = student.phoneNumber;
            // row.appendChild(cellPhoneNumber);

            // Action Buttons
            const cellAction = document.createElement('td');

            // Edit
            const editBtn = document.createElement('button');
            editBtn.textContent = "Edit";
            editBtn.onclick = function () {
                openEditForm(student);
            }
            cellAction.appendChild(editBtn);

            // Info
            const cellInfo = document.createElement('button');
            cellInfo.textContent = 'Info';
            cellInfo.style.background = 'green';
            cellInfo.onclick = function () {
                window.location.href = `studentInfo.html?id=${student.id}`;
            }
            cellAction.appendChild(cellInfo);

            // Delete
            const cellDelete = document.createElement('button');
            cellDelete.textContent = 'delete';
            cellDelete.style.background = 'red';
            cellDelete.style.border = 'none'
            cellDelete.onclick = function () {
                const deleteSub = db.transaction('students', 'readwrite');
                const store = deleteSub.objectStore('students');
                const subjectDel = store.delete(student.id);

                subjectDel.onsuccess = () => {
                    alert('Student Deleted!')
                    location.reload();
                }
                subjectDel.onerror = () => {
                    console.error('Student delete Error')
                }
            }
            cellAction.appendChild(cellDelete);

            row.appendChild(cellAction);
            StudentTable.appendChild(row);
        })
    }
}

// ----------------- EDIT POPUP -----------------
function openEditForm(student) {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("editStudentForm").style.display = "block";

    document.getElementById("editStudentId").value = student.id;
    document.getElementById("editFirstName").value = student.firstName;
    document.getElementById("editSurName").value = student.surName;
    document.getElementById("editOtherName").value = student.otherName;
    document.getElementById("editPhoneNumber").value = student.phoneNumber;
    document.getElementById("editGender").value = student.gender;
    document.getElementById("editClass").value = student.classID;
}

// Close popup
function closeEditForm() {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("editStudentForm").style.display = "none";
}

document.getElementById("closeEdit").addEventListener("click", closeEditForm);
document.getElementById("overlay").addEventListener("click", closeEditForm);

// Save edits
document.getElementById("formEditStudent").addEventListener("submit", function (e) {
    e.preventDefault();

    let id = parseInt(document.getElementById("editStudentId").value);
    let updatedStudent = {
        id: id,
        firstName: document.getElementById("editFirstName").value,
        surName: document.getElementById("editSurName").value,
        otherName: document.getElementById("editOtherName").value,
        phoneNumber: document.getElementById("editPhoneNumber").value,
        gender: document.getElementById("editGender").value,
        classID: parseInt(document.getElementById("editClass").value),
        sessionID: '' // keep empty or handle properly
    };

    const tx = db.transaction("students", "readwrite");
    const store = tx.objectStore("students");
    const updateReq = store.put(updatedStudent);

    updateReq.onsuccess = function () {
        alert("Student updated successfully!");
        document.getElementById("editStudentForm").style.display = "none";
        displayData();
    };

    updateReq.onerror = function () {
        alert("Error updating student");
    };
});
