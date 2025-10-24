let db;
import { DB_NAME,DB_VERSION } from './app.js';

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event)=>{
    db = event.target.result;
}

request.onsuccess = (event)=>{
    db = event.target.result;
    console.log(`Database opened successfully`)
}

request.onerror = ()=>{
    console.log("Error opening database!")
}

function exportIndexedDB(DB_NAME) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);
        request.onsuccess = event => {
            const db = event.target.result;
            const transaction = db.transaction(db.objectStoreNames, "readonly");

            let exportData = {};
            let storesProcessed = 0;

            for (let storeName of db.objectStoreNames) {
                if (storeName === "school") { 
                    storesProcessed++; // Skip school store
                    if (storesProcessed === db.objectStoreNames.length) {
                        resolve(exportData);
                    }
                    continue;
                }

                let store = transaction.objectStore(storeName);
                let getAllReq = store.getAll();

                getAllReq.onsuccess = () => {
                    exportData[storeName] = getAllReq.result;
                    storesProcessed++;
                    if (storesProcessed === db.objectStoreNames.length) {
                        resolve(exportData);
                    }
                };

                getAllReq.onerror = () => reject(getAllReq.error);
            }
        };
        request.onerror = () => reject(request.error);
    });
}


// Example: download all DB data
exportIndexedDB(DB_NAME).then(data => {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${DB_NAME}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
});


// ====== IMPORT & MERGE FUNCTION (Admin) ======
function importAndMergeFirstTerm(data) {
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = event => {
        const db = event.target.result;

        STORES.forEach(storeName => {
            if (!data[storeName] || !Array.isArray(data[storeName])) return;

            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            data[storeName].forEach(record => {
                const getReq = store.get(record.id);

                getReq.onsuccess = () => {
                    if (getReq.result) {
                        // Update existing record
                        const updated = { ...getReq.result, ...record };
                        store.put(updated);
                    } else {
                        // Add new record
                        store.add(record);
                    }
                };
            });
        });

        alert("First Term Data merged successfully!");
    };
}

// ====== EVENT LISTENERS ======
document.getElementById("exportBtn")?.addEventListener("click", exportFirstTermData);

document.getElementById("importBtn")?.addEventListener("click", () => {
    document.getElementById("importFile").click();
});

document.getElementById("importFile")?.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);
        importAndMergeFirstTerm(data);
    } catch {
        alert("Invalid file format!");
    }
});