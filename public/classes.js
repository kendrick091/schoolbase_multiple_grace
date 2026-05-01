let dismise = document.getElementById('dismise');
let toggleFormAddForm = document.getElementById('toggleFormAddForm');
let addClassBtn = document.getElementById('addClass');

import {tog} from './toggle.js';

addClassBtn.addEventListener('click', ()=>{
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
    console.log('DB open for Classes')
    displayClass();
};


document.getElementById("formInput").addEventListener("submit", function(e){
    e.preventDefault();
    if(!db){
        alert("DataBase not ready");
        return;
    }
    //RANDOM NUMBER
    const classInput = document.getElementById('classInput').value;

    const transaction = db.transaction("classes", "readwrite");
    const store = transaction.objectStore("classes");
    const data = {className: classInput};

    const addInput = store.add(data);

    addInput.onsuccess = function(){
        console.log("Class Added to DB successfully!");
        location.reload()
    }

    addInput.onerror = function(){
        alert("Error added Class");
    }
})

function displayClass() {
    const tx = db.transaction(["classes"], "readonly");
    const classStore = tx.objectStore("classes");
    const classList = document.getElementById('listClass');
    classList.innerHTML = "";

    classStore.openCursor().onsuccess = function(event){
        const cursor = event.target.result;
        if(cursor){
            const {id, className} = cursor.value;
            const li = document.createElement('li');
            const btnDiv = document.createElement('div');
            btnDiv.style.display = 'flex';
            btnDiv.style.justifyContent = 'space-between';
            
            li.innerHTML = `${className}<br>`;

            const editBtn = document.createElement('button');
            let editDiv = document.getElementById('editDiv');
            editBtn.textContent = "edit";
            editBtn.style.color = 'blue';
            editBtn.addEventListener('click', ()=>{
                tog(editDiv)
                fillForm(id)
            })
            const dismiseEdit = document.getElementById('dismiseEdit');
            dismiseEdit.addEventListener('click', ()=>{
                editDiv.style.display = 'none'
            })

            const infoBtn = document.createElement('button');
            infoBtn.textContent = "info",
            infoBtn.style.color = 'green';
            infoBtn.onclick = function(){
                window.location.href = `classStudent.html?id=${id}`
            }

            // const deleteBtn = document.createElement('button');
            // deleteBtn.textContent = "Del"
            // deleteBtn.style.color = 'red';
            // deleteBtn.style.border = 'none';
            // deleteBtn.onclick = function(){
            //     const deleteTeacher = db.transaction('classes', 'readwrite');
            //     const store = deleteTeacher.objectStore('classes');
            //     const teacherDel = store.delete(id);

            //     teacherDel.onsuccess = ()=>{
            //         alert('Class Deleted!')
            //         location.reload();
            //     }
            //     teacherDel.onerror = ()=>{
            //         console.error('Class delete Error')
            //     }
            // }

            btnDiv.appendChild(editBtn)
            btnDiv.appendChild(infoBtn)
            // btnDiv.appendChild(deleteBtn)
            li.appendChild(btnDiv);

            classList.appendChild(li);
            cursor.continue();
        }
    }
}

function fillForm(id){ //call this function in the displayClass function
    const transaction = db.transaction(["classes"], "readonly");
    const objectStore = transaction.objectStore("classes");
    const request = objectStore.get(id);

    request.onsuccess = function(event){
        const classFill = event.target.result;
        if (classFill){
            document.getElementById("classId").value = classFill.id;
            document.getElementById("classEdit").value = classFill.className;
        }
    }
}

//Handle form submission
document.getElementById('editForm').addEventListener('submit', function(event){
    event.preventDefault();
    const id = parseInt(document.getElementById("classId").value);
    const classEdit = document.getElementById("classEdit").value;

    const transaction = db.transaction(['classes'], 'readwrite');
    const objectStore = transaction.objectStore('classes');
    const request = objectStore.put({id: id, className: classEdit});

    request.onsuccess = ()=>{
        location.reload(); //refresh list
        alert("class Updated!");

        document.getElementById("editForm").reset();
    }
})

// =========================================================
// NEW DELETE LOGIC
// =========================================================

// Button to open delete popup
const deleteClassBtn = document.getElementById("deleteClassBtn");
const overlay = document.getElementById("overlay");
const deleteClassForm = document.getElementById("deleteClassForm");
const closeDelete = document.getElementById("closeDelete");

deleteClassBtn.addEventListener("click", () => {
    overlay.style.display = "block";
    deleteClassForm.style.display = "block";
    loadDeleteClassList();
});

closeDelete.addEventListener("click", closeDeletePopup);
overlay.addEventListener("click", closeDeletePopup);

function closeDeletePopup() {
    overlay.style.display = "none";
    deleteClassForm.style.display = "none";
}

// Populate delete list
function loadDeleteClassList() {
    const tx = db.transaction('classes', 'readonly');
    const store = tx.objectStore('classes');
    const req = store.getAll();

    req.onsuccess = () => {
        const classes = req.result;
        const ul = document.getElementById("deleteClassList");
        ul.innerHTML = "";

        classes.forEach(cls => {
            const li = document.createElement("li");
            li.textContent = cls.className;
            li.onclick = () => confirmDeleteClass(cls.id, cls.className);
            ul.appendChild(li);
        });
    };
}

// Confirm and delete
function confirmDeleteClass(id, className) {
    if (confirm(`Are you sure you want to delete class: ${className}?`)) {
        const tx = db.transaction('classes', 'readwrite');
        const store = tx.objectStore('classes');
        const req = store.delete(id);

        req.onsuccess = () => {
            alert(`Class "${className}" deleted successfully`);
            closeDeletePopup();
            displayClass(); // refresh the list
        };

        req.onerror = () => {
            alert("Error deleting class");
        };
    }
}
