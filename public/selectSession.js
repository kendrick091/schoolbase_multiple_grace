import { DB_NAME, DB_VERSION } from './app.js';

const urlParams = new URLSearchParams(window.location.search);
const studentId = Number(urlParams.get("id"));
const term = Number(urlParams.get("term"));

let db;
const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onsuccess = (event) => {
  db = event.target.result;
  loadSession();
};

function loadSession() {
  const transaction = db.transaction('session', 'readonly');
  const sessiontore = transaction.objectStore('session');
  
  const list = document.getElementById("session-list");
  list.innerHTML = "";

  sessiontore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if(cursor) {
      const { id, session } = cursor.value;
      
      const li = document.createElement("li");
      li.style.margin = '12px'
      li.style.listStyle = 'none'
      const button = document.createElement("button");
      button.textContent = session;
      button.classList = 'shiny-btn'
      button.onclick = () => {
        // Redirect to the printable result with student, term, and session
        window.location.href = `printableResult.html?id=${studentId}&term=${term}&session=${id}`;
      };

      li.appendChild(button);
      list.appendChild(li);
      cursor.continue();
    }
  };
}
