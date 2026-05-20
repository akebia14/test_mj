const handContainer = document.getElementById("hand-area");
const nextButton = document.getElementById("nextButton");
const shantenDisplay = document.getElementById("shantenDisplay");
const shantenError = document.getElementById("shantenError");

const tileFileNames = [
  "1m.png", "2m.png", "3m.png", "4m.png", "5m.png", "6m.png", "7m.png", "8m.png", "9m.png",
  "1p.png", "2p.png", "3p.png", "4p.png", "5p.png", "6p.png", "7p.png", "8p.png", "9p.png",
  "1s.png", "2s.png", "3s.png", "4s.png", "5s.png", "6s.png", "7s.png", "8s.png", "9s.png",
  "東.png", "南.png", "西.png", "北.png", "白.png", "發.png", "中.png",
];

const tileToIndexMap = new Map(tileFileNames.map((fileName, index) => [fileName, index]));

const wall = tileFileNames.flatMap((fileName) => [fileName, fileName, fileName, fileName]);

let currentHand = [];
let draggingIndex = null;
let draggingPointerId = null;

function tileToIndex(tile) {
  if (!tileToIndexMap.has(tile)) {
    throw new Error(`未対応の牌です: ${tile}`);
  }
  return tileToIndexMap.get(tile);
}

function tilesToCounts(tiles) {
  const counts = Array(34).fill(0);
  tiles.forEach((tile) => {
    const index = tileToIndex(tile);
    counts[index] += 1;
  });
  return counts;
}

function calculateNormalShanten(counts) {
  let minShanten = 8;

  function dfs(start, melds, pairs, taatsu) {
    let i = start;
    while (i < 34 && localCounts[i] === 0) {
      i += 1;
    }

    if (i === 34) {
      const cappedTaatsu = Math.min(taatsu, 4 - melds);
      const shanten = 8 - melds * 2 - cappedTaatsu - pairs;
      if (shanten < minShanten) {
        minShanten = shanten;
      }
      return;
    }

    if (melds > 4 || pairs > 1) {
      return;
    }

    if (localCounts[i] >= 3) {
      localCounts[i] -= 3;
      dfs(i, melds + 1, pairs, taatsu);
      localCounts[i] += 3;
    }

    if (i < 27 && i % 9 <= 6 && localCounts[i + 1] > 0 && localCounts[i + 2] > 0) {
      localCounts[i] -= 1;
      localCounts[i + 1] -= 1;
      localCounts[i + 2] -= 1;
      dfs(i, melds + 1, pairs, taatsu);
      localCounts[i] += 1;
      localCounts[i + 1] += 1;
      localCounts[i + 2] += 1;
    }

    if (pairs === 0 && localCounts[i] >= 2) {
      localCounts[i] -= 2;
      dfs(i, melds, pairs + 1, taatsu);
      localCounts[i] += 2;
    }

    if (localCounts[i] >= 2) {
      localCounts[i] -= 2;
      dfs(i, melds, pairs, taatsu + 1);
      localCounts[i] += 2;
    }

    if (i < 27 && i % 9 <= 7 && localCounts[i + 1] > 0) {
      localCounts[i] -= 1;
      localCounts[i + 1] -= 1;
      dfs(i, melds, pairs, taatsu + 1);
      localCounts[i] += 1;
      localCounts[i + 1] += 1;
    }

    if (i < 27 && i % 9 <= 6 && localCounts[i + 2] > 0) {
      localCounts[i] -= 1;
      localCounts[i + 2] -= 1;
      dfs(i, melds, pairs, taatsu + 1);
      localCounts[i] += 1;
      localCounts[i + 2] += 1;
    }

    dfs(i + 1, melds, pairs, taatsu);
  }

  const localCounts = counts.slice();
  dfs(0, 0, 0, 0);
  return minShanten;
}

function calculateChiitoiShanten(counts) {
  let pairCount = 0;
  let uniqueCount = 0;

  counts.forEach((count) => {
    if (count >= 1) {
      uniqueCount += 1;
    }
    if (count >= 2) {
      pairCount += 1;
    }
  });

  return 6 - pairCount + Math.max(0, 7 - uniqueCount);
}

function calculateKokushiShanten(counts) {
  const kokushiIndices = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let uniqueTerminals = 0;
  let hasPair = false;

  kokushiIndices.forEach((index) => {
    if (counts[index] >= 1) {
      uniqueTerminals += 1;
    }
    if (counts[index] >= 2) {
      hasPair = true;
    }
  });

  return 13 - uniqueTerminals - (hasPair ? 1 : 0);
}

function calculateShanten(tiles) {
  const counts = tilesToCounts(tiles);
  const normal = calculateNormalShanten(counts);
  const chiitoi = calculateChiitoiShanten(counts);
  const kokushi = calculateKokushiShanten(counts);
  return Math.min(normal, chiitoi, kokushi);
}

function formatShantenForDisplay(shanten) {
  return `現在のシャンテン数：${shanten}`;
}

function updateShantenDisplay() {
  try {
    const shanten = calculateShanten(currentHand);
    shantenDisplay.textContent = formatShantenForDisplay(shanten);
    shantenError.textContent = "";
  } catch (error) {
    shantenDisplay.textContent = "現在のシャンテン数：-";
    shantenError.textContent = `シャンテン判定エラー: ${error.message}`;
  }
}

function drawHand() {
  const pool = [...wall];
  currentHand = [];

  for (let i = 0; i < 13; i += 1) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    currentHand.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  renderHand();
  updateShantenDisplay();
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
  updateShantenDisplay();
}

handContainer.addEventListener("pointerdown", onTilePointerDown);
handContainer.addEventListener("pointermove", onTilePointerMove);
handContainer.addEventListener("pointerup", onTilePointerEnd);
handContainer.addEventListener("pointercancel", onTilePointerEnd);

nextButton.addEventListener("click", drawHand);

drawHand();
