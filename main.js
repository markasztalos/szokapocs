const setupView = document.getElementById('setup-view');
const gameView = document.getElementById('game-view');
const mainGrid = document.getElementById('main-grid');
const gameTimer = document.getElementById('game-timer');
const timerText = document.getElementById('timer-text');

const wordInputsContainer = document.getElementById('word-inputs');
const regenerateBtn = document.getElementById('regenerate-btn');
const startGameBtn = document.getElementById('start-game-btn');

// Raffle Elements
const raffleDisplay = document.getElementById('raffle-display');
const raffleCellName = document.getElementById('raffle-cell-name');
const raffleCountdown = document.getElementById('raffle-countdown');
const raffleControls = document.getElementById('raffle-controls');
const drawBtn = document.getElementById('draw-btn');
const rafflePostDrawControls = document.getElementById('raffle-post-draw-controls');
const retryBtn = document.getElementById('retry-btn');
const passBtn = document.getElementById('pass-btn');

let currentWords = [];
let secondsPassed = 0;
let timerInterval = null;

// Raffle State
let currentRaffleCell = null;
let raffleTimer = null;
let raffleSecondsLeft = 0;
let isGuessingPhase = false;

/**
 * Initializes the game with 10 random words.
 */
function init() {
    generateRandomWords();
    renderInputs();
    updateButtonStates();
}

/**
 * Picks 10 unique random words from the database.
 */
function generateRandomWords() {
    const words = [...HUNGARIAN_WORDS];
    const selected = [];

    for (let i = 0; i < 10; i++) {
        if (words.length === 0) break;
        const randomIndex = Math.floor(Math.random() * words.length);
        const word = words.splice(randomIndex, 1)[0];
        selected.push(word.toLowerCase());
    }

    currentWords = selected;
}

/**
 * Renders the 10 input fields.
 */
function renderInputs() {
    wordInputsContainer.innerHTML = '';

    for (let i = 0; i < 10; i++) {
        const row = document.createElement('div');
        row.className = 'word-row';

        const num = document.createElement('div');
        num.className = 'row-num';
        num.textContent = (i + 1).toString().padStart(2, '0');

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'row-input';
        input.value = currentWords[i] || '';
        input.placeholder = 'Írj be egy szót...';
        input.dataset.index = i;

        input.addEventListener('input', (e) => {
            currentWords[i] = e.target.value.trim();
            updateButtonStates();
        });

        row.appendChild(num);
        row.appendChild(input);
        wordInputsContainer.appendChild(row);
    }
}

/**
 * Checks if all 10 words are filled and updates button states.
 */
function updateButtonStates() {
    const filledCount = currentWords.filter(word => word && word.length > 0).length;
    const allFilled = filledCount === 10;

    regenerateBtn.disabled = !allFilled;
    startGameBtn.disabled = !allFilled;
}

/**
 * Event Listener for Regenerate button.
 */
regenerateBtn.addEventListener('click', () => {
    generateRandomWords();
    renderInputs();
    updateButtonStates();

    // Simple micro-animation feedback
    regenerateBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        regenerateBtn.style.transform = 'scale(1)';
    }, 100);
});

/**
 * Event Listener for Start Game button.
 */
startGameBtn.addEventListener('click', () => {
    startGame();
});

/**
 * Transitions to the game screen and initializes game components.
 */
function startGame() {
    setupView.hidden = true;
    gameView.hidden = false;
    gameTimer.hidden = false;

    generateGrid();

    // Initialize timer display but don't start yet
    secondsPassed = 0;
    timerText.textContent = '00:00';

    // Show raffle controls
    raffleControls.hidden = false;
}

/**
 * Performs the raffle (drawing a random cell or showing the previous one).
 */
function performRaffle(reuse = false) {
    if (!reuse) {
        const colLetters = ['A', 'B', 'C', 'D', 'E'];
        const rowNumbers = ['1', '2', '3', '4', '5'];

        // Build a pool of cells that haven't been correctly guessed yet
        const correctCells = new Set(
            [...document.querySelectorAll('.game-cell.cell-correct')].map(el => el.textContent.trim())
        );
        const available = [];
        for (const col of colLetters) {
            for (const row of rowNumbers) {
                const id = `${col}${row}`;
                if (!correctCells.has(id)) available.push(id);
            }
        }

        if (available.length === 0) return; // All cells already selected

        currentRaffleCell = available[Math.floor(Math.random() * available.length)];

        // Start the game timer on the first raffle draw if it's not already running
        resumeTimer();
    }

    // UI state
    drawBtn.hidden = true;
    rafflePostDrawControls.hidden = true;
    raffleDisplay.hidden = false;
    raffleCellName.textContent = currentRaffleCell;
    isGuessingPhase = false;

    // Countdown logic
    raffleSecondsLeft = 4;
    raffleCountdown.textContent = raffleSecondsLeft;

    if (raffleTimer) clearInterval(raffleTimer);

    raffleTimer = setInterval(() => {
        raffleSecondsLeft--;
        if (raffleSecondsLeft <= 0) {
            clearInterval(raffleTimer);
            finishRaffle();
        } else {
            raffleCountdown.textContent = raffleSecondsLeft;
        }
    }, 1000);
}

/**
 * Called when the countdown ends (or is skipped by clicking).
 * Immediately activates the guessing phase.
 */
function finishRaffle() {
    if (raffleTimer) {
        clearInterval(raffleTimer);
        raffleTimer = null;
    }
    raffleDisplay.hidden = true;
    rafflePostDrawControls.hidden = true;

    // Immediately start guessing
    isGuessingPhase = true;
    document.querySelectorAll('.game-cell').forEach(cell => {
        const label = cell.textContent.trim();
        if (label.match(/^[A-D][1-5]$/) && !cell.classList.contains('cell-correct')) {
            cell.classList.add('cell-guess-hover');
        }
    });
}

// Clicking the raffle display skips the countdown immediately
raffleDisplay.addEventListener('click', () => {
    if (!raffleDisplay.hidden) finishRaffle();
});

/**
 * Resets the raffle state and returns to the initial "Sorolás" button.
 */
function resetRaffle() {
    currentRaffleCell = null;
    if (raffleTimer) clearInterval(raffleTimer);
    raffleDisplay.hidden = true;
    rafflePostDrawControls.hidden = true;
    drawBtn.hidden = false;
    isGuessingPhase = false;

    // Stop the game timer when raffle is passed
    pauseTimer();

    document.querySelectorAll('.game-cell').forEach(cell => {
        cell.classList.remove('cell-guess-hover');
    });
}

// Raffle Event Listeners
drawBtn.addEventListener('click', () => performRaffle(false));
retryBtn.addEventListener('click', () => performRaffle(true));
passBtn.addEventListener('click', () => resetRaffle());



/**
 * End the guess phase and reset the state.
 */
function endGuessPhase() {
    isGuessingPhase = false;
    currentRaffleCell = null;

    raffleDisplay.hidden = true;
    rafflePostDrawControls.hidden = true;

    // Reset timer to 0 and stop
    pauseTimer();
    secondsPassed = 0;
    timerText.textContent = '00:00';

    // Remove hover effects
    document.querySelectorAll('.game-cell').forEach(cell => {
        cell.classList.remove('cell-guess-hover');
    });

    // Check if all A1-D5 cells have been correctly guessed
    const total = 4 * 5; // A-D × 1-5
    const done = document.querySelectorAll('.game-cell.cell-correct').length;
    if (done >= total) {
        drawBtn.hidden = true; // All cells done — hide Sorolás
    } else {
        drawBtn.hidden = false;
    }
}

/**
 * Resumes or starts the game timer interval.
 */
function resumeTimer() {
    if (timerInterval) return; // Already running

    timerInterval = setInterval(() => {
        secondsPassed++;
        const mins = Math.floor(secondsPassed / 60).toString().padStart(2, '0');
        const secs = (secondsPassed % 60).toString().padStart(2, '0');
        timerText.textContent = `${mins}:${secs}`;
    }, 1000);
}

/**
 * Pauses the game timer interval.
 */
function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Generates the 7x7 grid (including labels and words).
 */
function generateGrid() {
    mainGrid.innerHTML = '';

    // Grid settings: 7 columns (fixed + words + 5 cells)
    mainGrid.style.gridTemplateColumns = '30px 140px 1fr 1fr 1fr 1fr 1fr';
    mainGrid.style.gridTemplateRows = '30px 1fr 1fr 1fr 1fr 1fr 1fr';

    const colLetters = ['A', 'B', 'C', 'D', 'E'];
    const rowNumbers = ['1', '2', '3', '4', '5'];

    const colWords = currentWords.slice(0, 5);
    const rowWords = currentWords.slice(5, 10);

    // 1. Column Labels (A-E)
    for (let i = 0; i < 5; i++) {
        const cell = createCell(colLetters[i], 'header-label');
        cell.style.gridColumn = i + 3;
        cell.style.gridRow = 1;
        mainGrid.appendChild(cell);
    }

    // 2. Column Words
    for (let i = 0; i < 5; i++) {
        const cell = createCell(colWords[i], 'grid-cell word-card');
        cell.style.gridColumn = i + 3;
        cell.style.gridRow = 2;
        mainGrid.appendChild(cell);
    }

    // 3. Row Numbers (1-5)
    for (let i = 0; i < 5; i++) {
        const cell = createCell(rowNumbers[i], 'header-label');
        cell.style.gridColumn = 1;
        cell.style.gridRow = i + 3;
        mainGrid.appendChild(cell);
    }

    // 4. Row Words
    for (let i = 0; i < 5; i++) {
        const cell = createCell(rowWords[i], 'grid-cell word-card');
        cell.style.gridColumn = 2;
        cell.style.gridRow = i + 3;
        mainGrid.appendChild(cell);
    }

    // 5. Game Cells (A1-E5)
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const label = `${colLetters[c]}${rowNumbers[r]}`;
            const cell = createCell(label, 'grid-cell game-cell');
            cell.style.gridColumn = c + 3;
            cell.style.gridRow = r + 3;
            mainGrid.appendChild(cell);
        }
    }

    // Grid Guess Listener
    mainGrid.addEventListener('click', (e) => {
        if (!isGuessingPhase) return;

        const cell = e.target.closest('.game-cell');
        if (!cell) return;

        const label = cell.textContent;
        // Only A1-D5 can be guessed, and ignore already correct cells
        if (!label.match(/^[A-D][1-5]$/) || cell.classList.contains('cell-correct')) return;

        if (label === currentRaffleCell) {
            cell.classList.add('cell-correct');
            // Remove the cell's original label? Or keep it? We can keep it.
        } else {
            cell.classList.add('cell-wrong-guess');
            setTimeout(() => cell.classList.remove('cell-wrong-guess'), 1500);
        }

        endGuessPhase();
    });
}

/**
 * Utility to create a cell element.
 */
function createCell(text, className) {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    return div;
}

// Start the app
init();

/**
 * Warn the user before leaving the page if a game is in progress.
 */
window.addEventListener('beforeunload', (e) => {
    if (gameView.hidden) return; // Only warn during active game
    e.preventDefault();
    e.returnValue = ''; // Triggers browser's native confirm dialog
});
