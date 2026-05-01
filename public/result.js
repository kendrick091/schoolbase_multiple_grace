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
    console.log('DB open for Result')
    displayClass();
};

function displayClass() {
    const tx = db.transaction(["classes"], "readonly");
    const classStore = tx.objectStore("classes");
    const classList = document.getElementById('listClass');
    classList.innerHTML = "";

    classStore.openCursor().onsuccess = function(event){
        const cursor = event.target.result;
        if(cursor){
            const {id, className} = cursor.value;
            const classLink = document.createElement('button');

            classLink.textContent = `${className}`,
            classLink.style.color = 'green';
            classLink.style.background = 'white';
            classLink.style.boxShadow = `0 0 19px black`;
            classLink.style.padding = `20px`;
            classLink.onclick = function(){
                window.location.href = `classResult.html?id=${id}`
            }

            classList.appendChild(classLink);
            cursor.continue();
        }
    }
}