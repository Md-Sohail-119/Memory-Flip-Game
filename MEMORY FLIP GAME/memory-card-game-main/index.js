const gridContainer = document.querySelector(".grid-container");
let cards = [];
let firstCard, secondCard;
let lockBoard = false;
let score = 0;
let currentDifficulty = 'medium'; // Default difficulty
let timerInterval;
let seconds = 0; 
let isGameComplete = false;
let bestTime = localStorage.getItem('bestTime') ? parseInt(localStorage.getItem('bestTime')) : Infinity;
let bestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : Infinity;

document.querySelector(".score").textContent = score;
updateBestScores();

function startTimer() {
  if (!timerInterval) {
    timerInterval = setInterval(updateTimer, 1000);
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimer() {
  seconds++;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  document.getElementById("stopwatch").textContent =
    `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateBestScores() {
  if (bestScore === Infinity) {
    document.getElementById("best-score").textContent = "--";
  } else {
    document.getElementById("best-score").textContent = bestScore;
  }
  if (bestTime === Infinity) {
    document.getElementById("best-time").textContent = "--:--";
  } else {
    const minutes = Math.floor(bestTime / 60);
    const remainingSeconds = bestTime % 60;
    document.getElementById("best-time").textContent =
      `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

function checkGameComplete() {
  const flippedCards = document.querySelectorAll('.card.flipped');
  if (flippedCards.length === cards.length && !isGameComplete) {
    isGameComplete = true;
    stopTimer();

    // Update best scores
    if (score < bestScore || bestScore === Infinity) {
      bestScore = score;
      localStorage.setItem('bestScore', bestScore);
    }
    if (seconds < bestTime || bestTime === Infinity) {
      bestTime = seconds;
      localStorage.setItem('bestTime', bestTime);
    }
    updateBestScores();
  }
}

fetch("./data/cards.json")
  .then((res) => res.json())
  .then((data) => {
    cards = [...data, ...data];
    shuffleCards();
    generateCards();
  });

function shuffleCards() {
  let currentIndex = cards.length,
    randomIndex,
    temporaryValue;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = cards[currentIndex];
    cards[currentIndex] = cards[randomIndex];
    cards[randomIndex] = temporaryValue;
  }
}

function generateCards() {
  for (let card of cards) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.setAttribute("data-name", card.name);
    cardElement.innerHTML = `
      <div class="front">
        <img class="front-image" src=${card.image}>
      </div>
      <div class="back"></div>
    `;
    gridContainer.appendChild(cardElement);
    cardElement.addEventListener("click", flipCard);
  }
}

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;

  this.classList.add("flipped");

  if (!firstCard) {
    firstCard = this;
    startTimer(); // Start timer on first card flip
    return;
  }

  secondCard = this;
  score++;
  document.querySelector(".score").textContent = score;
  lockBoard = true;

  checkForMatch();
}

function checkForMatch() {
  let isMatch = firstCard.dataset.name === secondCard.dataset.name;

  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
  firstCard.removeEventListener("click", flipCard);
  secondCard.removeEventListener("click", flipCard);

  resetBoard();
  checkGameComplete();
}

function unflipCards() {
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    resetBoard();
  }, 1000);
}

function resetBoard() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function restart() {
  resetBoard();
  shuffleCards();
  score = 0;
  seconds = 0;
  isGameComplete = false;
  document.querySelector(".score").textContent = score;
  document.getElementById("stopwatch").textContent = "00:00";
  stopTimer();
  gridContainer.innerHTML = "";
  generateCards();
}

// Reset everything including stored best scores and start a fresh game
function resetAll() {
  // Remove stored best values
  try {
    localStorage.removeItem('bestScore');
    localStorage.removeItem('bestTime');
  } catch (e) {
    // ignore if storage not available
  }

  // Reset in-memory best values and update UI
  bestScore = Infinity;
  bestTime = Infinity;
  updateBestScores();

  // Start a fresh game
  restart();
}

function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
  let cardCount;
  
  switch(difficulty) {
    case 'easy':
      cardCount = 6; // 3 pairs
      break;
    case 'medium':
      cardCount = 12; // 6 pairs
      break;
    case 'hard':
      cardCount = 18; // 9 pairs for 6x3 grid
      break;
    default:
      cardCount = 12;
  }

  // Update grid layout based on difficulty
  if (difficulty === 'easy') {
    gridContainer.style.gridTemplateColumns = 'repeat(3, 140px)';
    gridContainer.style.gridTemplateRows = 'repeat(2, calc(140px / 2 * 3))';
  } else if (difficulty === 'medium') {
    gridContainer.style.gridTemplateColumns = 'repeat(4, 140px)';
    gridContainer.style.gridTemplateRows = 'repeat(3, calc(140px / 2 * 3))';
  } else {
    gridContainer.style.gridTemplateColumns = 'repeat(6, 140px)';
    gridContainer.style.gridTemplateRows = 'repeat(3, calc(140px / 2 * 3))';
  }

  // Reset game with new card count
  fetch("./data/cards.json")
    .then((res) => res.json())
    .then((data) => {
      // Take only the needed number of pairs
      const selectedCards = data.slice(0, cardCount/2);
      cards = [...selectedCards, ...selectedCards];
      resetAll();
    });
}
