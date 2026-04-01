const setupView = document.getElementById('setup-view');
const gameView = document.getElementById('game-view');
const mainGrid = document.getElementById('main-grid');
const gameTimer = document.getElementById('game-timer');
const timerText = document.getElementById('timer-text');

const wordInputsContainer = document.getElementById('word-inputs');
const regenerateBtn = document.getElementById('regenerate-btn');
const startGameBtn = document.getElementById('start-game-btn');

let currentWords = [];
let secondsPassed = 0;
let timerInterval = null;

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
    startTimer();
}

/**
 * Starts the count-up timer.
 */
function startTimer() {
    secondsPassed = 0;
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        secondsPassed++;
        const mins = Math.floor(secondsPassed / 60).toString().padStart(2, '0');
        const secs = (secondsPassed % 60).toString().padStart(2, '0');
        timerText.textContent = `${mins}:${secs}`;
    }, 1000);
}

/**
 * Generates the 7x7 grid (including labels and words).
 */
function generateGrid() {
    mainGrid.innerHTML = '';
    
    // Grid settings: 7 columns (fixed + words + 5 cells)
    mainGrid.style.gridTemplateColumns = '30px 140px 1fr 1fr 1fr 1fr 1fr';
    mainGrid.style.gridTemplateRows = '30px 100px 1fr 1fr 1fr 1fr 1fr';

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
