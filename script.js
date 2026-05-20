const handContainer = document.getElementById("hand-area");
const nextButton = document.getElementById("nextButton");

const tileFileNames = [
  "1m.png", "2m.png", "3m.png", "4m.png", "5m.png", "6m.png", "7m.png", "8m.png", "9m.png",
  "1p.png", "2p.png", "3p.png", "4p.png", "5p.png", "6p.png", "7p.png", "8p.png", "9p.png",
  "1s.png", "2s.png", "3s.png", "4s.png", "5s.png", "6s.png", "7s.png", "8s.png", "9s.png",
  "東.png", "南.png", "西.png", "北.png", "白.png", "發.png", "中.png",
];

const wall = tileFileNames.flatMap((fileName) => [fileName, fileName, fileName, fileName]);

let currentHand = [];
let draggingIndex = null;
let draggingPointerId = null;

function drawHand() {
  const pool = [...wall];
  currentHand = [];

  for (let i = 0; i < 13; i += 1) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    currentHand.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  renderHand();
}

function renderHand() {
  handContainer.innerHTML = "";

  currentHand.forEach((fileName, index) => {
    const img = document.createElement("img");
    img.className = "tile";
    img.src = `asset/tiles/${fileName}`;
    img.alt = fileName.replace(/\.png$/u, "");
    img.draggable = false;
    img.dataset.index = String(index);
    img.loading = "eager";

    if (index === draggingIndex) {
      img.classList.add("tile-dragging");
    }

    handContainer.appendChild(img);
  });
}

function onTilePointerDown(event) {
  const tile = event.target.closest(".tile");
  if (!tile || !handContainer.contains(tile)) {
    return;
  }

  event.preventDefault();
  draggingIndex = Number(tile.dataset.index);
  if (Number.isNaN(draggingIndex)) {
    draggingIndex = null;
    return;
  }

  draggingPointerId = event.pointerId;

  handContainer.setPointerCapture(event.pointerId);

  renderHand();
}

function onTilePointerMove(event) {
  if (event.pointerId !== draggingPointerId || draggingIndex === null) {
    return;
  }

  event.preventDefault();

  const target = document.elementFromPoint(event.clientX, event.clientY);
  const targetTile = target?.closest(".tile");

  if (!targetTile || !handContainer.contains(targetTile)) {
    return;
  }

  const targetIndex = Number(targetTile.dataset.index);
  if (Number.isNaN(targetIndex) || targetIndex === draggingIndex) {
    return;
  }

  const [moved] = currentHand.splice(draggingIndex, 1);
  currentHand.splice(targetIndex, 0, moved);
  draggingIndex = targetIndex;

  renderHand();
}

function onTilePointerEnd(event) {
  if (event.pointerId !== draggingPointerId) {
    return;
  }

  if (handContainer.hasPointerCapture(event.pointerId)) {
    handContainer.releasePointerCapture(event.pointerId);
  }

  draggingIndex = null;
  draggingPointerId = null;
  renderHand();
}

handContainer.addEventListener("pointerdown", onTilePointerDown);
handContainer.addEventListener("pointermove", onTilePointerMove);
handContainer.addEventListener("pointerup", onTilePointerEnd);
handContainer.addEventListener("pointercancel", onTilePointerEnd);

nextButton.addEventListener("click", drawHand);

drawHand();
