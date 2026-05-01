const urlParams = new URLSearchParams(window.location.search);
const userId = Number(urlParams.get("id"));

let db;

import { DB_NAME, DB_VERSION } from "./app.js";

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event)=>{
    db = event.target.result;
}

request.onerror = ()=>{
    console.log('Error loading data from teacherDB')
}

request.onsuccess = (event)=>{
    db = event.target.result;
    showDetails();
}

function showDetails(){
    const transaction = db.transaction(['teachers', 'classes'], 'readonly');
    const teacherStore = transaction.objectStore('teachers');
    const classStore = transaction.objectStore('classes');

    let infoList = document.getElementById('information');
    infoList.innerHTML = '';

    teacherStore.openCursor().onsuccess = (event)=>{
        const cursor = event.target.result;
        if(cursor){
            const teacher = cursor.value;
            //Get Class
                classStore.get(teacher.classAssigned).onsuccess = (event)=>{
                const classData = event.target.result;

                if(userId == teacher.id){
                const list = document.createElement('table')
                list.innerHTML = `
                <tr>
                    <td>First Name:</td>
                    <td>${teacher.firstName}</td>
                </tr>
                <tr>
                    <td>Sur Name:</td>
                    <td>${teacher.surName}</td>
                </tr>
                <tr>
                    <td>Class:</td>
                    <td>${classData ? classData.className : "unknow"}</td>
                </tr>
                <tr>
                    <td>Phone No:</td>
                    <td>${teacher.phoneNumber}</td>
                </tr>
                `;
                infoList.appendChild(list);
                }
            }
            cursor.continue();
            }
        }
    }
