let db;

import { DB_NAME, DB_VERSION } from "./app.js";

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = () => {
  console.log("Error opening database");
};

request.onsuccess = (event) => {
  db = event.target.result;
  countStudentsByGender();
  showSession();
};

function countStudentsByGender() {
  const tx = db.transaction("students", "readonly");
  const store = tx.objectStore("students");

  let total = 0;
  let boys = 0;
  let girls = 0;

  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const student = cursor.value;
      total++;

      const gender = student.gender?.toLowerCase(); // Ensure it's lowercase
      if (gender === "male" || gender === "boy") {
        boys++;
      } else if (gender === "female" || gender === "girl") {
        girls++;
      }

      cursor.continue();
    } else {
      // Finished looping — you can display or return the counts
      console.log("Total Students:", total);
      console.log("Boys:", boys);
      console.log("Girls:", girls);

      // Example: Display in HTML
      document.getElementById("totalCount").textContent = total;
      document.getElementById("boyCount").textContent = boys;
      document.getElementById("girlCount").textContent = girls;
    }
  };
}

function showSession(){
  let transaction = db.transaction('sessionViewer', 'readonly');
  let sessionViewerStore = transaction.objectStore('sessionViewer');
  let showFirst = sessionViewerStore.get(1);

  showFirst.onsuccess = (event)=>{
    let dataID = event.target.result;
    let tx = db.transaction('session', 'readonly')
    let sessionStore = tx.objectStore('session');
    let ses = sessionStore.get(dataID.sessionID);

    ses.onsuccess = (event)=>{
      let showSes = event.target.result
      if(showSes){
      document.getElementById('sessionShow').innerHTML = 
          `<h2 style="border-radius: 14px; padding: 3px;
          margin: 20px 20px; background: rgba(161, 167, 78, 0.62)">Active session<br>
          <span style="padding: 3px; color: rgba(3, 86, 119, 0.79)">${showSes.session}</span></h2>`;
      }else{
        document.getElementById('sessionShow').innerHTML = 
          `<h2 style="border-radius: 14px; padding: 3px;
          margin: 20px 20px; background: rgba(161, 167, 78, 0.62)">Active session<br>
          <span style="padding: 3px; color: rgba(3, 86, 119, 0.79)">Add an Academic Session</span></h2>`
      }
    }
    }
  }


