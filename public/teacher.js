let dismise = document.getElementById('dismise');
let toggleFormAddForm = document.getElementById('toggleFormAddForm');
let addTeacherBtn = document.getElementById('addTeacher');

import {tog} from './toggle.js';

addTeacherBtn.addEventListener('click', ()=>{
    tog(toggleFormAddForm)
})

dismise.addEventListener('click', function(){
    tog(toggleFormAddForm)
})

let db;

import { DB_NAME, DB_VERSION } from './app.js';

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event)=>{
    db = event.target.result
}

request.onerror = (event)=>{
    console.Error('Error', event.target.error)
};

request.onsuccess = (event)=>{
    db = event.target.result;
    console.log('DB open for Teachers')
    loadSelectData();
    displayTeacher();
};

//load into select tag
function loadSelectData(){
    const tx = db.transaction('classes', 'readonly');
    const store = tx.objectStore('classes');

    store.openCursor().onsuccess = function(event){
        
        const cursor = event.target.result;
        if(cursor){
        const option = document.createElement('option');
        option.value = cursor.value.id;
        option.textContent = cursor.value.className;

        document.getElementById('selectClass').appendChild(option);
        cursor.continue();
    }
}
}

document.getElementById("formInput").addEventListener("submit", function(e){
    e.preventDefault();
    if(!db){
        alert("DataBase not ready");
        return;
    }
    //RANDOM NUMBER
    // const num = Math.floor(Math.random() * 90) + 1;
    const teacherFirstName = document.getElementById('teacherFirstNameInput').value;
    const teacherSurName = document.getElementById('teacherSurNameInput').value;
    const selectClass = parseInt(document.getElementById('selectClass').value);
    const phoneNumber = parseInt(document.getElementById('phoneNumber').value);

    const transaction = db.transaction("teachers", "readwrite");
    const store = transaction.objectStore("teachers");
    const data = {firstName: teacherFirstName,
        surName: teacherSurName, classAssigned: selectClass,
        phoneNumber: phoneNumber};

    const addInput = store.add(data);

    addInput.onsuccess = function(){
        console.log("Teacher Added to DB successfully!");
        location.reload()
    }

    addInput.onerror = function(){
        alert("Error added Subject");
    }
})

function displayTeacher() {
    const tx = db.transaction(["teachers"], "readonly");
    const teacherStore = tx.objectStore("teachers");
    const teacherList = document.getElementById('listTeacher');
    teacherList.innerHTML = "";

    teacherStore.openCursor().onsuccess = function(event){
        const cursor = event.target.result;
        if(cursor){
            const {id, firstName, surName} = cursor.value;
            const li = document.createElement('li');
            const btnDiv = document.createElement('div');
            
            li.innerHTML = `${firstName} ${surName}<br>`;

            const editBtn = document.createElement('button');
            let editDiv = document.getElementById('editDiv');
            editBtn.textContent = "edit";
            editBtn.style.color = 'blue';
            editBtn.addEventListener('click', ()=>{
                tog(editDiv);
                fillForm(id)
                loadEditClass();
            })
            const dismiseEdit = document.getElementById('dismiseEdit');
            dismiseEdit.addEventListener('click', ()=>{
                editDiv.style.display = 'none';
            })

            const infoBtn = document.createElement('button');
            infoBtn.textContent = "info",
            infoBtn.style.color = 'green';
            infoBtn.onclick = function(){
                window.location.href = `teacherInfo.html?id=${id}`
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = "Del"
            deleteBtn.style.color = 'red';
            deleteBtn.style.border = 'none';
            deleteBtn.onclick = function(){
                const deleteTeacher = db.transaction('teachers', 'readwrite');
                const store = deleteTeacher.objectStore('teachers');
                const teacherDel = store.delete(id);

                teacherDel.onsuccess = ()=>{
                    alert('Teacher Deleted!')
                    location.reload();
                }
                teacherDel.onerror = ()=>{
                    console.error('Teacher delete Error')
                }
            }

            btnDiv.appendChild(editBtn)
            btnDiv.appendChild(infoBtn)
            btnDiv.appendChild(deleteBtn)
            li.appendChild(btnDiv);

            teacherList.appendChild(li);
            cursor.continue();
        }
    }
}

function fillForm(id){ //call this function in the displayTeacher function
    const transaction = db.transaction(["teachers"], "readonly");
    const objectStore = transaction.objectStore("teachers");
    const request = objectStore.get(id);

    request.onsuccess = function(event){
        const teacher = event.target.result;
        if (teacher){
            document.getElementById("teacherId").value = teacher.id;
            document.getElementById("teacherFirstName").value = teacher.firstName;
            document.getElementById("teacherSurName").value = teacher.surName;
            document.getElementById("editClass").value = teacher.classAssigned;
            document.getElementById("teacherNumber").value = teacher.phoneNumber;
        }
    }
}

//load into select tag for editClass
function loadEditClass(){
    const tx = db.transaction('classes', 'readonly');
    const store = tx.objectStore('classes');
    const editSelect = document.getElementById('editClass');
    editSelect.innerHTML = ''; //

    store.openCursor().onsuccess = function(event){
        const cursor = event.target.result;
        if(cursor){
        const option = document.createElement('option');
        option.value = cursor.value.id;
        option.textContent = cursor.value.className;

        editSelect.appendChild(option);
        cursor.continue();
    }
}
}

//Handle form submission
document.getElementById('editForm').addEventListener('submit', function(event){
    event.preventDefault();
    const id = parseInt(document.getElementById('teacherId').value);
    const firstName = document.getElementById("teacherFirstName").value;
    const surName = document.getElementById('teacherSurName').value;
    const classAssigned = parseInt(document.getElementById('editClass').value);
    const phoneNumber = document.getElementById('teacherNumber').value;

    const transaction = db.transaction(['teachers'], 'readwrite');
    const objectStore = transaction.objectStore('teachers');
    const request = objectStore.put({id: id, firstName: firstName,
        surName: surName, classAssigned: classAssigned,
        phoneNumber: phoneNumber});

    request.onsuccess = ()=>{
        location.reload(); //refresh list
        alert("Teacher Updated!");

        document.getElementById("editForm").reset();
    }
})
