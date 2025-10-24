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
                    window.location.href = `selectSession.html?id=${id}&term=1`;
                }
                
                //2nd term button code
                const secondTerm = document.createElement('button');
                secondTerm.textContent = '2nd Term';
                cellAction.appendChild(secondTerm);
                secondTerm.onclick = function(){
                    window.location.href = `selectSession.html?id=${id}&term=2`;
                }
                
                //3rd term button code
                const thirdTerm = document.createElement('button');
                thirdTerm.textContent = '3rd Term';
                cellAction.appendChild(thirdTerm);
                thirdTerm.onclick = function(){
                    window.location.href = `selectSession.html?id=${id}&term=3`;
                }
                
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
