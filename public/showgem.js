let db;

import { DB_NAME, DB_VERSION } from "./app.js";

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = () => {
  console.log("Error opening database");
};

request.onsuccess = (event) => {
  db = event.target.result;
  gemShow();
};

function gemShow(){
    const transaction = db.transaction('school', 'readonly');
    const objectStore = transaction.objectStore('school');
    
    const gemAmount = document.getElementById('gemAmount');

    let show = objectStore.get(1)

    show.onsuccess = (event)=>{
        let gem = event.target.result;
        console.log(gem)
        if(gem.recharge > 5){
        gemAmount.innerHTML = `<h2>Gem = <span style="color: rgba(188, 250, 198, 0.93)">${gem.recharge}</span></h2>`;
        }else{
        gemAmount.innerHTML = `<h2>Gem = <span style="color: rgba(224, 72, 26, 1)">${gem.recharge}</span></h2>`;
        }
    }
  }
