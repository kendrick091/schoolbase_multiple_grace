const urlParams = new URLSearchParams(window.location.search);
const userId = Number(urlParams.get("id"));

let db;

import { DB_NAME, DB_VERSION } from "./app.js";

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event)=>{
    db = event.target.result;
}

request.onerror = ()=>{
    console.log('Error loading data from studentDB')
}

request.onsuccess = (event)=>{
    db = event.target.result;
    showDetails();
}

function showDetails(){
    const transaction = db.transaction(['students', 'classes'], 'readonly');
    const studentStore = transaction.objectStore('students');
    const classStore = transaction.objectStore('classes');

    let infoList = document.getElementById('information');
    infoList.innerHTML = '';

    studentStore.openCursor().onsuccess = (event)=>{
        const cursor = event.target.result;
        if(cursor){
            const student = cursor.value;
            //Get Class
                classStore.get(parseInt(student.classID)).onsuccess = (event)=>{
                const classData = event.target.result;

                if(userId == student.id){
                const list = document.createElement('table')
                list.innerHTML = `
                <tr>
                    <td>First Name:</td>
                    <td>${student.firstName}</td>
                </tr>
                <tr>
                    <td>Sur Name:</td>
                    <td>${student.surName}</td>
                </tr>
                <tr>
                    <td>Other Name:</td>
                    <td>${student.otherName}</td>
                </tr>
                <tr>
                    <td>Gender:</td>
                    <td>${student.gender}</td>
                </tr>
                <tr>
                    <td>Class:</td>
                    <td>${classData ? classData.className : "unknow"}</td>
                </tr>
                <tr>
                    <td>Phone No:</td>
                    <td>${student.phoneNumber}</td>
                </tr>
                `;
                infoList.appendChild(list);
                }
            }
            cursor.continue();
            }
        }
    }
