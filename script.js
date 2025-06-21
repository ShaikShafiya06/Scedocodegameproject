document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('grid');
  const scoreDisplay = document.getElementById('score');
  const highScoreDisplay = document.getElementById('high-score');
  const livesDisplay = document.getElementById('lives');
  const timerDisplay = document.getElementById('timer');
  const progressBar = document.getElementById('progress-bar');
  const motivationBox = document.getElementById('motivation');
  const useBombBtn = document.getElementById('use-bomb');
  const restartBtn = document.getElementById('restart');
  const movesDisplay = document.getElementById('moves');

  const matchSound = document.getElementById('match-sound');
  const errorSound = document.getElementById('error-sound');

  const width = 8;
  let squares = [];
  const candyColors = ['red', 'yellow', 'orange', 'green', 'blue', 'purple'];
  let score = 0, lives = 5, timeLeft = 180, moves = 0;
  let highScore = localStorage.getItem('highScore') || 0;
  let timerInterval;
  let colorBeingDragged, colorBeingReplaced;
  let squareIdBeingDragged, squareIdBeingReplaced;

  highScoreDisplay.textContent = highScore;

  function createBoard() {
    grid.innerHTML = '';
    squares = [];
    for (let i = 0; i < width * width; i++) {
      const square = document.createElement('div');
      square.setAttribute('draggable', true);
      square.setAttribute('id', i);
      square.classList.add('square');
      square.style.backgroundColor = candyColors[Math.floor(Math.random() * candyColors.length)];
      grid.appendChild(square);
      squares.push(square);
    }
    setupDragEvents();
  }

  function setupDragEvents() {
    squares.forEach(square => {
      square.addEventListener('dragstart', dragStart);
      square.addEventListener('dragover', e => e.preventDefault());
      square.addEventListener('drop', dragDrop);
      square.addEventListener('dragend', dragEnd);
    });
  }

  function dragStart() {
    colorBeingDragged = this.style.backgroundColor;
    squareIdBeingDragged = parseInt(this.id);
  }

  function dragDrop() {
    colorBeingReplaced = this.style.backgroundColor;
    squareIdBeingReplaced = parseInt(this.id);

    squares[squareIdBeingDragged].style.backgroundColor = colorBeingReplaced;
    this.style.backgroundColor = colorBeingDragged;

    const diff = squareIdBeingReplaced - squareIdBeingDragged;
    const d1 = squares[squareIdBeingDragged];
    const d2 = squares[squareIdBeingReplaced];
    if (diff === -1) { d1.classList.add('slide-left'); d2.classList.add('slide-right'); }
    else if (diff === 1) { d1.classList.add('slide-right'); d2.classList.add('slide-left'); }
    else if (diff === -width) { d1.classList.add('slide-up'); d2.classList.add('slide-down'); }
    else if (diff === width) { d1.classList.add('slide-down'); d2.classList.add('slide-up'); }

    setTimeout(() => {
      d1.classList.remove('slide-left', 'slide-right', 'slide-up', 'slide-down');
      d2.classList.remove('slide-left', 'slide-right', 'slide-up', 'slide-down');
    }, 300);
  }

  function dragEnd() {
    const validMoves = [
      squareIdBeingDragged - 1,
      squareIdBeingDragged + 1,
      squareIdBeingDragged - width,
      squareIdBeingDragged + width
    ];
    if (!squareIdBeingReplaced || !validMoves.includes(squareIdBeingReplaced)) {
      squares[squareIdBeingDragged].style.backgroundColor = colorBeingDragged;
      if (squareIdBeingReplaced !== undefined)
        squares[squareIdBeingReplaced].style.backgroundColor = colorBeingReplaced;
      lives--;
      livesDisplay.textContent = lives;
      errorSound.play();
      if (lives <= 0) endGame("😢 Out of lives!");
      return;
    }
    moves++;
    movesDisplay.textContent = moves;
    showMoveMessage(moves);
  }

  function showMoveMessage(moves) {
    const phrases = [
      "✨ Awesome!",
      "😋 Delicious!",
      "🔥 Great move!",
      "💥 Sweet combo!",
      "🚀 Keep it up!",
      "🎯 You're crushing it!",
      "🌈 Beautiful match!",
      "🎉 Incredible!"
    ];
    const milestoneMessages = {
      10: "💡 Smart move!",
      25: "🔥 You're on fire!",
      50: "🏆 Master Matcher!"
    };

    const randomMessage = phrases[Math.floor(Math.random() * phrases.length)];
    motivationBox.textContent = randomMessage;
    setTimeout(() => motivationBox.textContent = '', 1000);

    if (milestoneMessages[moves]) {
      setTimeout(() => {
        motivationBox.textContent = milestoneMessages[moves];
        setTimeout(() => motivationBox.textContent = '', 1500);
      }, 1000);
    }
  }

  function moveDown() {
    for (let i = 0; i < 56; i++) {
      if (squares[i + width].style.backgroundColor === '') {
        squares[i + width].style.backgroundColor = squares[i].style.backgroundColor;
        squares[i].style.backgroundColor = '';
      }
    }
    for (let i = 0; i < 8; i++) {
      if (squares[i].style.backgroundColor === '') {
        squares[i].style.backgroundColor = candyColors[Math.floor(Math.random() * candyColors.length)];
      }
    }
  }

  function spawnSparkle(x, y) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 600);
  }

  function checkMatches() {
    for (let i = 0; i < 61; i++) {
      const row = [i, i + 1, i + 2];
      const notValid = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55];
      if (notValid.includes(i)) continue;
      const color = squares[i].style.backgroundColor;
      if (row.every(idx => squares[idx].style.backgroundColor === color && color)) {
        row.forEach(idx => {
          squares[idx].classList.add("fade");
          const rect = squares[idx].getBoundingClientRect();
          spawnSparkle(rect.left + 20, rect.top + 20);
          setTimeout(() => squares[idx].style.backgroundColor = '', 300);
          squares[idx].classList.remove("fade");
        });
        score += 3;
        scoreDisplay.textContent = score;
        updateHighScore();
        matchSound.play();
      }
    }

    for (let i = 0; i < 47; i++) {
      const col = [i, i + width, i + width * 2];
      const color = squares[i].style.backgroundColor;
      if (col.every(idx => squares[idx].style.backgroundColor === color && color)) {
        col.forEach(idx => {
          squares[idx].classList.add("fade");
          const rect = squares[idx].getBoundingClientRect();
          spawnSparkle(rect.left + 20, rect.top + 20);
          setTimeout(() => squares[idx].style.backgroundColor = '', 300);
          squares[idx].classList.remove("fade");
        });
        score += 3;
        scoreDisplay.textContent = score;
        updateHighScore();
        matchSound.play();
      }
    }
  }

  function updateHighScore() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
      highScoreDisplay.textContent = highScore;
    }
  }

  function updateProgressBar() {
    const percent = (timeLeft / 180) * 100;
    progressBar.style.width = percent + '%';
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = timeLeft;
      updateProgressBar();
      moveDown();
      checkMatches();
      if (timeLeft <= 0) endGame("🎉 Time's Up!");
    }, 1000);
  }

  function endGame(message) {
    clearInterval(timerInterval);
    motivationBox.innerHTML = `<strong>${message}</strong>`;
    restartBtn.style.display = 'inline-block';
  }

  function useBomb() {
    for (let i = 0; i < 8; i++) {
      const r = i * width + Math.floor(Math.random() * 8);
      squares[r].style.backgroundColor = '';
    }
    score += 5;
    scoreDisplay.textContent = score;
    updateHighScore();
  }

  function resetGame() {
    score = 0; moves = 0; lives = 5; timeLeft = 180;
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    timerDisplay.textContent = timeLeft;
    movesDisplay.textContent = moves;
    restartBtn.style.display = 'none';
    motivationBox.textContent = '';
    clearInterval(timerInterval);
    createBoard();
    startTimer();
  }

  useBombBtn.addEventListener('click', useBomb);
  restartBtn.addEventListener('click', resetGame);

  createBoard();
  startTimer();
});
