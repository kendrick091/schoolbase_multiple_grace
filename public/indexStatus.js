const errContent = document.getElementById("errContent");
const successContent = document.getElementById("successContent");

function showErrContent() {
  errContent.style.display = "block";
  successContent.style.display = "none";
}

function showSuccessContent() {
  errContent.style.display = "none";
  successContent.style.display = "block";
}

showErrContent()