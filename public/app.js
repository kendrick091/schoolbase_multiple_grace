export const DB_NAME = "Multiple_Grace_Base";
export const DB_VERSION = 4;

let db;

const request = indexedDB.open(DB_NAME, DB_VERSION);

function openDataBase(){

    request.onupgradeneeded = function(event) {
        db = event.target.result;

        //School Name
        if(!db.objectStoreNames.contains('school')){
            const schoolNameStore = db.createObjectStore('school',{keyPath: 'id', autoIncrement: false});
        }

        //Session Store
        if(!db.objectStoreNames.contains('session')){
            const sessionStore = db.createObjectStore('session', {keyPath: 'id', autoIncrement: true});
        }

        // Ensure "session_students" object store exists
        if (!db.objectStoreNames.contains("session_students")) {
            const store = db.createObjectStore("session_students", { keyPath: "id", autoIncrement: true });
            store.createIndex("session_student_class", ["sessionID", "studentID", "classID"], { unique: true });
        }

        //Student Store
        if(!db.objectStoreNames.contains('students')){
            const studentStore = db.createObjectStore('students', {keyPath: 'id', autoIncrement: true});
            studentStore.createIndex('classID', 'classID', {unique: false});
            studentStore.createIndex('sessionID','sessionID',{unique: false});
        }

        // //Teacher store
        // if(!db.objectStoreNames.contains('teachers')){
        //     const teacherStore = db.createObjectStore('teachers', {keyPath: 'id', autoIncrement: true});
        //     teacherStore.createIndex('classID', 'classID', {unique: false})
        // }
        //Psychomotor store
        if(!db.objectStoreNames.contains('psychomotor')){
            const psychomotorStore = db.createObjectStore
            ('psychomotor', {keyPath: 'id', autoIncrement: true});
            psychomotorStore.createIndex("psychomotor_session_term", 
              ["sessionID", "studentID", "classID", 'term'], {unique: false})
        }

        //Session Viewer store
        if(!db.objectStoreNames.contains('sessionViewer')){
          const sessionViewer = db.createObjectStore('sessionViewer', {keyPath: 'id', autoIncrement: false})
        }
        //remark store
        if(!db.objectStoreNames.contains('remark')){
          const remarkStore = db.createObjectStore('remark', {keyPath: 'id', autoIncrement: true})
        }

        //Class store
        if(!db.objectStoreNames.contains('classes')){
            const classStore = db.createObjectStore('classes', {keyPath: 'id', autoIncrement: true});
            classStore.createIndex('className', 'className', {unique: false});
        }

        //Attendance store
        if (!db.objectStoreNames.contains("attendance")) {
            const store = db.createObjectStore("attendance", { keyPath: "id", autoIncrement: true });
            store.createIndex("student_session_term", ["studentID", "sessionID", "term"], { unique: true });
          }
        
        //Subject store
        if(!db.objectStoreNames.contains('subjectStore')){
            const subjectStore = db.createObjectStore('subjectStore', {keyPath: 'id', autoIncrement: true});
        }


        //FirstTerm store
        if(!db.objectStoreNames.contains('firstTerm')){
            const firstTermStore = db.createObjectStore('firstTerm', {keyPath: 'id', autoIncrement: true});
            firstTermStore.createIndex('studentId', 'studentId', {unique: false});
            firstTermStore.createIndex('subjectId', 'subjectId', {unique: false});
            firstTermStore.createIndex('sessionID','sessionID',{unique: false});

        }

        //secondTerm store
        if(!db.objectStoreNames.contains('secondTerm')){
            const secondTermStore = db.createObjectStore('secondTerm', {keyPath: 'id', autoIncrement: true});
            secondTermStore.createIndex('studentId', 'studentId', {unique: false});
            secondTermStore.createIndex('subjectId', 'subjectId', {unique: false});
            secondTermStore.createIndex('sessionID','sessionID',{unique: false});
        }

        //thirdTerm store
        if(!db.objectStoreNames.contains('thirdTerm')){
            const thirdTermStore = db.createObjectStore('thirdTerm', {keyPath: 'id', autoIncrement: true});
            thirdTermStore.createIndex('studentId', 'studentId', {unique: false});
            thirdTermStore.createIndex('subjectId', 'subjectId', {unique: false});
            thirdTermStore.createIndex('sessionID','sessionID',{unique: false});
        }
    }
    request.onerror = function(event){
        console.error("Database errorL", event.target.error);
    };

    request.onsuccess = function(event){
        db = event.target.result;
        console.log("Database opened successfully")
    }
}


if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js")
    .then((registration) => {
      console.log("Service Worker registered");

      // 🔥 Listen for new versions of the SW
      registration.onupdatefound = () => {
        const newWorker = registration.installing;
        newWorker.onstatechange = () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // Show update button
            document.getElementById("update-btn").style.display = "block";
          }
        };
      };
    })
    .catch((err) => console.error("SW registration failed:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  const updateBtn = document.getElementById("update-btn");

  if (updateBtn) {
    updateBtn.addEventListener("click", () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ action: "skipWaiting" });
      }
    });
  }
});

navigator.serviceWorker.addEventListener("controllerchange", () => {
  window.location.reload();
});

//offline code
const offlineBanner = document.getElementById("offline-banner");

// Show banner when offline
window.addEventListener("offline", () => {
  offlineBanner.style.display = "block";
});

// Hide banner when online
window.addEventListener("online", () => {
  offlineBanner.style.display = "none";
});

//go back button code
document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("back-btn");

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/index.html";
      }
    });
  }
});
//go back button code ends here



openDataBase();
