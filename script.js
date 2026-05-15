const suits = ["m", "p", "s"];
const handContainer = document.getElementById("hand");
const nextButton = document.getElementById("nextButton");

const allTileIds = [
  ...suits.flatMap((suit) => Array.from({ length: 9 }, (_, i) => `${suit}${i + 1}`)),
  ...Array.from({ length: 7 }, (_, i) => `z${i + 1}`),
];

const wall = allTileIds.flatMap((id) => [id, id, id, id]);

function drawHand() {
  const pool = [...wall];
  const hand = [];

  for (let i = 0; i < 13; i += 1) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    hand.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  renderHand(hand);
}

function renderHand(hand) {
  handContainer.innerHTML = "";

  hand.forEach((tileId) => {
    const img = document.createElement("img");
    img.className = "tile";
    img.src = `asset/tiles/${tileId}.png`;
    img.alt = tileId;
    img.loading = "eager";

    img.onerror = () => {
      img.onerror = null;
      img.replaceWith(createFallbackTile(tileId));
    };

    handContainer.appendChild(img);
  });
}

function createFallbackTile(tileId) {
  const fallback = document.createElement("div");
  fallback.className = "tile";
  fallback.textContent = tileId;
  fallback.style.display = "flex";
  fallback.style.alignItems = "center";
  fallback.style.justifyContent = "center";
  fallback.style.color = "#1d1d1d";
  fallback.style.fontWeight = "700";
  return fallback;
}

nextButton.addEventListener("click", drawHand);

drawHand();
