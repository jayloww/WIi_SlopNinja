var gameTimerInterval = null;
var gameElapsedSeconds = 0;
var gameScore = 0;
var gameMaxSeconds = 180;

function formatGameTime(totalSeconds) {
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;
  return minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0");
}

function formatScore(value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getHighScore() {
  var stored = localStorage.getItem("wii-game-highscore");
  return stored ? parseInt(stored, 10) : 8750;
}

function setHighScore(value) {
  localStorage.setItem("wii-game-highscore", value);
}

function stopGameTimer() {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
}

function updateGameHud() {
  $("#game-timer").text(formatGameTime(gameElapsedSeconds));
  $("#game-score").text(formatScore(gameScore));
  $("#game-highscore").text(formatScore(getHighScore()));

  var progress = Math.min((gameElapsedSeconds / gameMaxSeconds) * 100, 100);
  $("#game-progress").css("width", progress + "%");
}

function initGame() {
  stopGameTimer();
  gameElapsedSeconds = 0;
  gameScore = 0;
  updateGameHud();

  gameTimerInterval = setInterval(function() {
    gameElapsedSeconds += 1;
    updateGameHud();
  }, 1000);
}

function startGame() {
  select();
  previousView = currentView || "menu";
  changeView("game", "fade");
}
