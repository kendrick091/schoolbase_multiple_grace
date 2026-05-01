let db;

import { DB_NAME, DB_VERSION } from "./app.js";

window.onload = function () {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = function (e) {
    db = e.target.result;

    if (!db.objectStoreNames.contains("school")) {
      db.createObjectStore("school", { keyPath: "id" });
    }
  };

  request.onsuccess = function (e) {
    db = e.target.result;
    loadSchoolInfo();
  };

  request.onerror = function (e) {
    console.error("DB error:", e.target.error);
  };

  document.getElementById("saveButton").addEventListener("click", saveSchoolInfo);
};

function saveSchoolInfo() {
  const name = document.getElementById("schoolName").value;
  const logoFile = document.getElementById("logoInput").files[0];
  const extraFile = document.getElementById("extraImageInput").files[0];
  const address = document.getElementById('schoolAddress').value;

  if (!name || !logoFile || !extraFile || !address) {
    alert("Please provide all fields.");
    return;
  }

  const reader1 = new FileReader();
  const reader2 = new FileReader();

  reader1.onload = function (e1) {
    const logoBlob = new Blob([e1.target.result], { type: logoFile.type });

    reader2.onload = function (e2) {
      const extraBlob = new Blob([e2.target.result], { type: extraFile.type });

      // Step 1: Get existing data to preserve recharge
      const tx = db.transaction(["school"], "readonly");
      const store = tx.objectStore("school");
      const getRequest = store.get(1);

      getRequest.onsuccess = function () {
        const existingData = getRequest.result;
        const recharge = existingData ? existingData.recharge : 0;

        // Step 2: Save updated info, keeping recharge untouched
        const newData = {
          id: 1,
          name,
          address,
          logo: logoBlob,
          extra: extraBlob,
          recharge
        };

        const updateTx = db.transaction(["school"], "readwrite");
        const updateStore = updateTx.objectStore("school");
        updateStore.put(newData);

        updateTx.oncomplete = loadSchoolInfo;
      };
    };

    reader2.readAsArrayBuffer(extraFile);
  };

  reader1.readAsArrayBuffer(logoFile);
}

function loadSchoolInfo() {
  const transaction = db.transaction(["school"], "readonly");
  const store = transaction.objectStore("school");
  const request = store.get(1);

  request.onsuccess = function (e) {
    const data = e.target.result;
    if (data) {
      document.getElementById("storedName").textContent = data.name;
      document.getElementById("storedAddress").textContent = data.address;
      document.getElementById("storedLogo").src = URL.createObjectURL(data.logo);
      document.getElementById("storedExtraImage").src = URL.createObjectURL(data.extra);
      // Optionally show recharge:
      // document.getElementById("rechargeDisplay").textContent = data.recharge;
    }
  };
}
