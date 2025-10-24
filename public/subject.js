let addSubjectBtn = document.getElementById('addSubjectBtn');
let dismise = document.getElementById('dismise');
let toggleFormAddForm = document.getElementById('toggleFormAddForm');

import {tog} from './toggle.js';

addSubjectBtn.addEventListener('click', ()=>{
    tog(toggleFormAddForm)
})

dismise.addEventListener('click', function(){
    tog(toggleFormAddForm)
})

//Database code below
let db;
import { DB_NAME, DB_VERSION } from './app.js';

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = function(event) {
    db = event.target.result;
}

//ONSUCCESS
request.onsuccess = function(event){
    db = event.target.result;
    console.log('Database opened for subject')
    displayData();
}

request.onerror = (event)=>{
    console.error('Error', event.target.error)
}

document.getElementById("formInput").addEventListener("submit", function(e){
    e.preventDefault();
    if(!db){
        alert("DataBase not ready");
        return;
    }
    //RANDOM NUMBER
    // const num = Math.floor(Math.random() * 90) + 1;
    const subjectName = document.getElementById('subjectName').value;

    const transaction = db.transaction("subjectStore", "readwrite");
    const store = transaction.objectStore("subjectStore");
    const data = {subjects: subjectName};

    const addInput = store.add(data);

    addInput.onsuccess = function(){
        console.log("Subject Added to DB successfully!");
        location.reload()
    }

    addInput.onerror = function(){
        alert("Error added Subject");
    }
})

//Table code
function displayData(){
    let transaction = db.transaction('subjectStore', 'readonly');
    let objectStore = transaction.objectStore('subjectStore');

    let subjectTable = document.querySelector('#subject-table tbody');
    subjectTable.innerHTML = '';

    objectStore.openCursor().onsuccess = function(event){
        const cursor = event.target.result;
        if(cursor){
            const {id, subjects} = cursor.value;
            const row =  document.createElement('tr');

            const cellID = document.createElement('td');
            cellID.textContent = id;
            row.appendChild(cellID);

            //Editable
            const cellSubject = document.createElement('td');
            const editSubject = document.createElement('input');
            editSubject.value = subjects;
            cellSubject.appendChild(editSubject);

            row.appendChild(cellSubject);

            //AddBtn
            const cellAction = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.textContent = "Update";

            editBtn.onclick = function(){
                const updateSubject = {
                    id: id,
                    subjects: editSubject.value
                };

                const subjectupdate = db.transaction('subjectStore', 'readwrite');
                const store = subjectupdate.objectStore('subjectStore');
                const updateRequest = store.put(updateSubject);

                updateRequest.onsuccess = function(){
                    alert('subject updated')
                    console.log('subject updated')
                }
                updateRequest.onerror = function(){
                    console.log('failed to update subject')
                }
            }
            cellAction.appendChild(editBtn);

            //DeleteBtn
            const cellDelete = document.createElement('button');
            cellDelete.textContent = 'delete';
            cellDelete.style.background = 'red';
            cellDelete.style.border = 'none'
            cellDelete.onclick = function(){
                const deleteSub = db.transaction('subjectStore', 'readwrite');
                const store = deleteSub.objectStore('subjectStore');
                const subjectDel = store.delete(id);

                subjectDel.onsuccess = ()=>{
                    alert('Subject Deleted!')
                    location.reload();
                }
                subjectDel.onerror = ()=>{
                    console.error('Subject delete Error')
                }
            }

            cellAction.appendChild(cellDelete);
            row.appendChild(cellAction);

            subjectTable.appendChild(row);
            cursor.continue();
        }
    }
}