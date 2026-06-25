/* ─── timer / score ──────────────────────────────────────── */

var gameTimerInterval  = null;
var gameElapsedSeconds = 0;
var gameScore          = 0;
var gameMaxSeconds     = 180;

var ITEMS_POOL = [];
var gameCanvas = null;
var gameCtx = null;
var gameItems = [];
var gameAnimationFrame = null;
var spawnTimer = 0;
const GRAVITY = 0.45;

const aiImages = [
  "NYC_generated.jpg", 
  "abstract_art_generated.jpg", "architecture_generated.jpg", "banana-hound.png", 
  "banana-usb.jpg", "blue-runner-shark.jpg", "cactus-elephant-clock.jpg", 
  "capybara-call-center.png", "cat_loaf.jpg", "crocodile-wrestle.png", 
  "espresso-goose.png", "frog-tire.png", "glass-dachshund.png", 
  "greek-frog.png", "jogging_generated.jpg", "munich_generated.jpg", 
  "pelican-open-for-work.png", "port_generated.jpg", "rainforest_generated.jpg", 
  "shark-vase.png", "shrimp-benediction-20260617.png", "tree-figure.png", 
  "washing-machine.png", "white-collar-fish.jpg"
];

const realImages = [
  "abstract.webp", "architecture.webp", "art.webp", "car.webp", "fish_boy.webp", 
  "jogging.webp", "light.webp", "nature.webp", "vase.webp"
];

// Preload images right away
aiImages.forEach(src => {
  let img = new Image();
  img.src = "assets/images/AI/" + src;
  ITEMS_POOL.push({ image: img, type: "SLOP" });
});

realImages.forEach(src => {
  let img = new Image();
  img.src = "assets/images/real/" + src;
  ITEMS_POOL.push({ image: img, type: "REAL" });
});

function resizeCanvas() {
  if (gameCanvas) {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
  }
}

window.addEventListener("resize", resizeCanvas);

function throwItem() {
  if (!gameCanvas || ITEMS_POOL.length === 0) return;
  const proto = ITEMS_POOL[Math.floor(Math.random() * ITEMS_POOL.length)];
  
  // Toss mostly from underside into the frame
  const x = gameCanvas.width * (0.25 + Math.random() * 0.5);
  const y = gameCanvas.height + 60;
  
  // Don't throw too much outside left/right, keep it in frame
  const targetX = gameCanvas.width * (0.3 + Math.random() * 0.4);
  const peakHeight = gameCanvas.height * (0.1 + Math.random() * 0.4);
  
  const dy = peakHeight - y;
  const vy = -Math.sqrt(Math.abs(2 * GRAVITY * dy));
  
  const t = Math.abs(vy / GRAVITY);
  const vx = (targetX - x) / t;
  
  // Guarantee at least a bit of rotation, randomizing the direction
  let rotSpeed = Math.random() * 0.02 + 0.01;
  if (Math.random() < 0.5) rotSpeed = -rotSpeed;

  gameItems.push({
    image: proto.image,
    type: proto.type,
    x: x,
    y: y,
    vx: vx,
    vy: vy,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: rotSpeed
  });
}

function gameLoop() {
  if (!gameCanvas || !gameCtx) return;
  
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  
  spawnTimer++;
  
  // Dynamic spawn rate based on game progress
  const progress = Math.min(gameElapsedSeconds / gameMaxSeconds, 1.0);
  const baseFrames = 90;
  const minFrames = 25;
  const currentSpawnRate = Math.floor(baseFrames - (baseFrames - minFrames) * progress);
  
  if (spawnTimer >= currentSpawnRate) {
    spawnTimer = 0;
    
    // Throw more images at once as game progresses
    const burstCount = (progress > 0.4 && Math.random() < 0.4) ? 2 : 1;
    for (let j = 0; j < burstCount; j++) {
      setTimeout(throwItem, j * 250);
    }
  }
  
  for (let i = gameItems.length - 1; i >= 0; i--) {
    const item = gameItems[i];
    item.y += item.vy;
    item.x += item.vx;
    item.vy += GRAVITY;
    item.rotation += item.rotationSpeed;
    
    // Remove if it falls below screen
    if (item.y > gameCanvas.height + 200 && item.vy > 0) {
      gameItems.splice(i, 1);
      continue;
    }
    
    gameCtx.save();
    gameCtx.translate(item.x, item.y);
    gameCtx.rotate(item.rotation);
    
    // Draw image at original aspect ratio with increased size
    const img = item.image;
    if (img.complete && img.naturalWidth > 0) {
      const targetMaxDim = 280; // Increased size
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const scale = targetMaxDim / Math.max(w, h);
      w *= scale;
      h *= scale;
      
      const halfW = w / 2;
      const halfH = h / 2;

      // Add subtle shadow for depth
      gameCtx.shadowBlur = 12;
      gameCtx.shadowColor = "rgba(0, 0, 0, 0.4)";
      
      gameCtx.beginPath();
      gameCtx.roundRect(-halfW, -halfH, w, h, 16);
      gameCtx.fillStyle = "#fff";
      gameCtx.fill(); // fill to render shadow and background
      
      gameCtx.shadowColor = "transparent"; // disable shadow for image clip
      gameCtx.clip();
      
      gameCtx.drawImage(img, -halfW, -halfH, w, h);
    }
    
    gameCtx.restore();
  }
  
  gameAnimationFrame = requestAnimationFrame(gameLoop);
}

function formatGameTime(totalSeconds) {
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;
  return minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0");
}
function formatScore(v) {
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function getHighScore() {
  var s = localStorage.getItem("wii-game-highscore");
  return s ? parseInt(s, 10) : 8750;
}
function setHighScore(v) {
  localStorage.setItem("wii-game-highscore", v);
}
function stopGameTimer() {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
  if (gameAnimationFrame) {
    cancelAnimationFrame(gameAnimationFrame);
    gameAnimationFrame = null;
  }
  stopGameSlash();
}
function updateGameHud() {
  $("#game-timer").text(formatGameTime(gameElapsedSeconds));
  $("#game-score").text(formatScore(gameScore));
  $("#game-highscore").text(formatScore(getHighScore()));
  $("#game-progress").css("width", Math.min((gameElapsedSeconds / gameMaxSeconds) * 100, 100) + "%");
}

/* ─── slash renderer ─────────────────────────────────────── */

var slashCanvas  = null;
var slashCtx     = null;
var slashRAF     = null;
var slashDrawing = false;
var slashPath    = [];          // { x, y, time }  — timestamped points
var slashMouse   = { x: 0, y: 0 };

var TRAIL_MS = 190;             // how long (ms) each point lives

/* ── draw the timestamped trail ── */
function drawTrail() {
  var path = slashPath;
  if (path.length < 2) return;

  var ctx = slashCtx;

  for (var i = 1; i < path.length; i++) {
    var t = i / path.length;                  // 0 = tail, 1 = tip
    ctx.beginPath();
    ctx.moveTo(path[i - 1].x, path[i - 1].y);
    ctx.lineTo(path[i].x,     path[i].y);

    ctx.lineWidth   = t * 9 + 1;             // tail=1px, tip=10px
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.strokeStyle = "rgba(255,255,255," + (t * 0.85 + 0.15).toFixed(3) + ")";
    ctx.shadowColor = "rgba(200,220,255,0.6)";
    ctx.shadowBlur  = 10 * t;
    ctx.stroke();
  }
}

/* ── crosshair cursor ── */
function drawCursorRing(x, y) {
  var ctx = slashCtx;
  var arm = 10;
  var gap = 4;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = "round";
  ctx.shadowColor = "rgba(255,255,255,0.6)";
  ctx.shadowBlur  = 6;

  ctx.beginPath(); ctx.moveTo(x - arm - gap, y); ctx.lineTo(x - gap, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + gap, y);        ctx.lineTo(x + arm + gap, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - arm - gap);  ctx.lineTo(x, y - gap); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + gap);         ctx.lineTo(x, y + arm + gap); ctx.stroke();

  ctx.restore();
}

/* ── resize ── */
function resizeSlashCanvas() {
  if (!slashCanvas) return;
  var dpr = window.devicePixelRatio || 1;
  slashCanvas.width        = window.innerWidth  * dpr;
  slashCanvas.height       = window.innerHeight * dpr;
  slashCanvas.style.width  = window.innerWidth  + "px";
  slashCanvas.style.height = window.innerHeight + "px";
  slashCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* ── main render loop ── */
function slashLoop() {
  if (!slashCtx) return;

  /* drop points older than TRAIL_MS */
  var now = Date.now();
  while (slashPath.length > 0 && now - slashPath[0].time > TRAIL_MS) {
    slashPath.shift();
  }

  slashCtx.clearRect(0, 0, slashCanvas.width, slashCanvas.height);

  if (slashPath.length > 1) {
    drawTrail();
  }

  if (!slashDrawing && slashPath.length === 0) {
    drawCursorRing(slashMouse.x, slashMouse.y);
  }

  slashRAF = requestAnimationFrame(slashLoop);
}

/* ── event helpers ── */
function getSlashPos(e) {
  var r   = slashCanvas.getBoundingClientRect();
  var src = e.touches ? e.touches[0] : e;
  return { x: src.clientX - r.left, y: src.clientY - r.top, time: Date.now() };
}

function onSlashMouseDown(e) {
  if (e.button !== 0) return;
  slashDrawing = true;
  slashPath    = [getSlashPos(e)];
  e.preventDefault();
}
function onSlashMouseMove(e) {
  var pos = getSlashPos(e);
  slashMouse.x = pos.x;
  slashMouse.y = pos.y;
  if (slashDrawing) slashPath.push(pos);
  e.preventDefault();
}
function onSlashMouseUp(e) {
  if (e.button !== 0) return;
  slashDrawing = false;
}
function onSlashMouseLeave() {
  slashDrawing = false;
}

/* ── lifecycle ── */
function initGameSlash() {
  stopGameSlash();

  slashCanvas = document.getElementById("slash-canvas");
  if (!slashCanvas) return;
  slashCtx    = slashCanvas.getContext("2d");
  slashDrawing = false;
  slashPath    = [];

  resizeSlashCanvas();
  $(window).on("resize.slash", resizeSlashCanvas);

  slashCanvas.addEventListener("mousedown",  onSlashMouseDown,  { passive: false });
  slashCanvas.addEventListener("mousemove",  onSlashMouseMove,  { passive: false });
  slashCanvas.addEventListener("mouseup",    onSlashMouseUp);
  slashCanvas.addEventListener("mouseleave", onSlashMouseLeave);

  if (slashRAF) cancelAnimationFrame(slashRAF);
  slashRAF = requestAnimationFrame(slashLoop);
}

function stopGameSlash() {
  slashDrawing = false;
  slashPath    = [];

  if (slashRAF) { cancelAnimationFrame(slashRAF); slashRAF = null; }
  $(window).off("resize.slash");

  if (slashCanvas) {
    slashCanvas.removeEventListener("mousedown",  onSlashMouseDown);
    slashCanvas.removeEventListener("mousemove",  onSlashMouseMove);
    slashCanvas.removeEventListener("mouseup",    onSlashMouseUp);
    slashCanvas.removeEventListener("mouseleave", onSlashMouseLeave);
  }

  if (slashCtx && slashCanvas)
    slashCtx.clearRect(0, 0, slashCanvas.width, slashCanvas.height);

  slashCanvas = null;
  slashCtx    = null;
}

/* ─── game init ──────────────────────────────────────────── */
function initGame() {
  stopGameTimer();
  
  gameCanvas = document.getElementById("game-canvas");
  if (gameCanvas) {
    gameCtx = gameCanvas.getContext("2d");
    resizeCanvas();
    gameItems = [];
    spawnTimer = 0;
    gameLoop();
  }

  gameElapsedSeconds = 0;
  gameScore          = 0;
  updateGameHud();

  gameTimerInterval = setInterval(function() {
    gameElapsedSeconds += 1;
    updateGameHud();
  }, 1000);

  initGameSlash();
}

function startGame() {
  select();
  previousView = currentView || "menu";
  changeView("game", "fade");
}
