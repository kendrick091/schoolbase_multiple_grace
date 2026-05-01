let addStudent = document.getElementById('addStudent');
let dismise = document.getElementById('dismise');
let toggleFormAddForm = document.getElementById('toggleFormAddForm');

import { tog } from './toggle.js';

addStudent.addEventListener('click', function () {
  tog(toggleFormAddForm);
});
dismise.addEventListener('click', function () {
  tog(toggleFormAddForm);
});

let db;
import { DB_NAME, DB_VERSION } from './app.js';

const request = indexedDB.open(DB_NAME, DB_VERSION);

// SUCCESS
request.onsuccess = (event) => {
  db = event.target.result;
  console.log('Session opened');
  displayData();
};

request.onerror = (event) => {
  console.log('Error', event.target.result);
};

document.getElementById('formInput').addEventListener('submit', function (e) {
  e.preventDefault();

  if (!db) {
    alert('DataBase not ready');
    return;
  }

  // RANDOM NUMBER
  const num = Math.floor(Math.random() * 999) + 1;
  const sessionInput = document.getElementById('sessionInput').value;

  const transaction = db.transaction('session', 'readwrite');
  const store = transaction.objectStore('session');

  if (!sessionInput) {
    alert('Session should not be empty!');
  } else {
    const data = {
      id: num,
      session: sessionInput,
      firstVac: '-',
      firstRes: '-',
      secondVac: '-',
      secondRes: '-',
      thirdVac: '-',
      thirdRes: '-'
    };
    const addInput = store.add(data);

    addInput.onsuccess = function () {
      console.log('Session Added to DB successfully!');
      location.reload();
    };

    addInput.onerror = function () {
      alert('Error adding Session');
    };
  }
});

// Table code
function displayData() {
  let transaction = db.transaction(['session'], 'readonly');
  let objectStore = transaction.objectStore('session');

  const sessionRequest = objectStore.getAll();
  sessionRequest.onsuccess = function () {
    const session = sessionRequest.result;
    let SessionTable = document.querySelector('#session-table tbody');
    SessionTable.innerHTML = '';

    session.forEach((session) => {
      const row = document.createElement('tr');

      const cellID = document.createElement('td');
      cellID.textContent = session.id;
      row.appendChild(cellID);

      // Editable Session name
      const cellSession = document.createElement('td');
      const editCellSession = document.createElement('input');
      editCellSession.style.width = '80px';
      editCellSession.value = session.session;
      cellSession.appendChild(editCellSession);
      row.appendChild(cellSession);

      // Editable first term
      const cellFirstTerm = document.createElement('td');
      const labelVac = document.createElement('label');
      const labelRes = document.createElement('label');
      labelVac.textContent = `Vacation Date`;
      labelRes.textContent = `Next_term begins`;
      const editCellFirstTermVac = document.createElement('input');
      editCellFirstTermVac.value = session.firstVac || '';
      const editCellFirstTermRes = document.createElement('input');
      editCellFirstTermRes.value = session.firstRes || '';

      cellFirstTerm.appendChild(labelVac);
      cellFirstTerm.appendChild(editCellFirstTermVac);
      cellFirstTerm.appendChild(labelRes);
      cellFirstTerm.appendChild(editCellFirstTermRes);
      row.appendChild(cellFirstTerm);

      // Editable second term
      const cellSecondTerm = document.createElement('td');
      const labelVac2 = document.createElement('label');
      const labelRes2 = document.createElement('label');
      labelVac2.textContent = `Vacation Date`;
      labelRes2.textContent = `Next_term begins`;
      const editCellSecondTermVac = document.createElement('input');
      editCellSecondTermVac.value = session.secondVac || '';
      const editCellSecondTermRes = document.createElement('input');
      editCellSecondTermRes.value = session.secondRes || '';

      cellSecondTerm.appendChild(labelVac2);
      cellSecondTerm.appendChild(editCellSecondTermVac);
      cellSecondTerm.appendChild(labelRes2);
      cellSecondTerm.appendChild(editCellSecondTermRes);
      row.appendChild(cellSecondTerm);

      // Editable third term
      const cellThirdTerm = document.createElement('td');
      const labelVac3 = document.createElement('label');
      const labelRes3 = document.createElement('label');
      labelVac3.textContent = `Vacation Date`;
      labelRes3.textContent = `Next_term begins`;
      const editCellThirdTermVac = document.createElement('input');
      editCellThirdTermVac.value = session.thirdVac || '';
      const editCellThirdTermRes = document.createElement('input');
      editCellThirdTermRes.value = session.thirdRes || '';

      cellThirdTerm.appendChild(labelVac3);
      cellThirdTerm.appendChild(editCellThirdTermVac);
      cellThirdTerm.appendChild(labelRes3);
      cellThirdTerm.appendChild(editCellThirdTermRes);
      row.appendChild(cellThirdTerm);

      // Action Btns
      const cellAction = document.createElement('td');

      // EDIT BUTTON (Now updates term data)
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.onclick = function () {
        const updatedSession = {
          id: session.id,
          session: editCellSession.value,
          firstVac: editCellFirstTermVac.value,
          firstRes: editCellFirstTermRes.value,
          secondVac: editCellSecondTermVac.value,
          secondRes: editCellSecondTermRes.value,
          thirdVac: editCellThirdTermVac.value,
          thirdRes: editCellThirdTermRes.value
        };

        const sessionUpdate = db.transaction('session', 'readwrite');
        const store = sessionUpdate.objectStore('session');
        const updateRequest = store.put(updatedSession);

        updateRequest.onsuccess = function () {
          alert('Session updated successfully!');
          console.log('Session updated with term data');
        };

        updateRequest.onerror = function () {
          console.log('Failed to update Session');
        };
      };
      cellAction.appendChild(editBtn);

      // ACTIVATE
      const useSession = document.createElement('button');
      useSession.textContent = 'Activate';
      useSession.style.background = 'rgb(160, 219, 155)';
      useSession.style.color = 'rgb(20, 92, 14)';
      useSession.onclick = function () {
        const sessionID = session.id;

        // Update all student records with the activated session ID
        const tx = db.transaction('students', 'readwrite');
        const studentStore = tx.objectStore('students');
        const studentReq = studentStore.getAll();

        studentReq.onsuccess = function () {
          const students = studentReq.result;

          students.forEach((student) => {
            student.sessionID = sessionID;
            studentStore.put(student);

            // also insert into session_students store if not exists
            const ssTx = db.transaction('session_students', 'readwrite');
            const ssStore = ssTx.objectStore('session_students');
            const index = ssStore.index('session_student_class');
            const checkReq = index.get([sessionID, student.id, student.classID]);

            checkReq.onsuccess = function () {
              if (!checkReq.result) {
                ssStore.add({
                  sessionID: sessionID,
                  studentID: student.id,
                  classID: student.classID
                });
                console.log(`Linked student ${student.id} -> session ${sessionID}`);
              } else {
                console.log(`Already linked: student ${student.id}, session ${sessionID}, class ${student.classID}`);
              }
            };
          });
        };

        tx.onerror = function () {
          alert('Failed to update students with session ID');
        };

        tx.oncomplete = function () {
          alert(`Activated session ${session.session} (ID: ${sessionID}) assigned to all students.`);

          // ✅ Update sessionViewer store
          const viewerTx = db.transaction('sessionViewer', 'readwrite');
          const viewerStore = viewerTx.objectStore('sessionViewer');
          const getAllReq = viewerStore.getAll();

          getAllReq.onsuccess = function () {
            const viewers = getAllReq.result;

            if (viewers.length > 0) {
              const viewer = viewers[0];
              viewer.sessionID = sessionID;

              const updateReq = viewerStore.put(viewer);
              updateReq.onsuccess = function () {
                console.log(`sessionViewer updated with sessionID ${sessionID}`);
              };
            } else {
              const addReq = viewerStore.add({ id: 1, sessionID });
              addReq.onsuccess = function () {
                console.log(`sessionViewer initialized with sessionID ${sessionID}`);
              };
            }
          };
        };
      };
      cellAction.appendChild(useSession);

      // DELETE
      const cellDelete = document.createElement('button');
      cellDelete.textContent = 'Del';
      cellDelete.style.background = 'red';
      cellDelete.style.border = 'none';
      cellDelete.onclick = function () {
        const deleteSub = db.transaction('session', 'readwrite');
        const store = deleteSub.objectStore('session');
        const subjectDel = store.delete(session.id);

        subjectDel.onsuccess = () => {
          alert('Session Deleted!');
          location.reload();
        };

        subjectDel.onerror = () => {
          console.error('Subject delete Error');
        };
      };
      cellAction.appendChild(cellDelete);

      row.appendChild(cellAction);
      SessionTable.appendChild(row);
    });
  };
}
