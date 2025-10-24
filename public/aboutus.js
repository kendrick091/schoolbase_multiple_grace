const audio = document.getElementById("click-sound");
const playPauseBtn = document.getElementById("playPauseBtn");

playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = "⏸ Pause";
  } else {
    audio.pause();
    playPauseBtn.textContent = "▶ Play";
  }
});
