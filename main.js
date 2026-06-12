const setupView = document.getElementById('setup-view');
const gameView = document.getElementById('game-view');
const mainGrid = document.getElementById('main-grid');
const timerText = document.getElementById('timer-text');

const wordInputsContainer = document.getElementById('word-inputs');
const regenerateBtn = document.getElementById('regenerate-btn');
const startGameBtn = document.getElementById('start-game-btn');

// Header elements
const drawBtn               = document.getElementById('draw-btn');
const passBtn               = document.getElementById('pass-btn');
const retryBtn              = document.getElementById('retry-btn');
const resizeBtn             = document.getElementById('resize-btn');
const exitBtn               = document.getElementById('exit-btn');
const gameTimer             = document.getElementById('game-timer');
const highlightCountdownBtn = document.getElementById('highlight-countdown-btn');

// Exit popup
const exitOverlay     = document.getElementById('exit-overlay');
const exitCancelBtn   = document.getElementById('exit-cancel-btn');
const exitConfirmBtn  = document.getElementById('exit-confirm-btn');

let isExiting = false; // ha igaz, a results bezárása visszavált a setup screenre

exitBtn.addEventListener('click', () => { exitOverlay.hidden = false; });
exitCancelBtn.addEventListener('click', () => { exitOverlay.hidden = true; });
exitConfirmBtn.addEventListener('click', () => {
    exitOverlay.hidden = true;
    isExiting = true;
    if (wrongGuesses.length > 0) {
        showResultsPopup();
    } else {
        returnToSetup();
    }
});

function returnToSetup() {
    isExiting = false;
    // Timer és intervallumok leállítása
    pauseTimer();
    if (raffleTimer) clearInterval(raffleTimer);
    clearTimeout(highlightTimeout);
    clearInterval(highlightInterval);
    clearHighlights();
    // Állapot reset
    wrongGuesses = [];
    currentRaffleCell = null;
    isGuessingPhase = false;
    secondsPassed = 0;
    timerText.textContent = '00:00';
    // UI reset
    gameTimer.hidden = true;
    exitBtn.hidden = true;
    resizeBtn.hidden = true;
    gameView.hidden = true;
    setupView.hidden = false;
    // Új szókészlet generálása
    generateRandomWords();
    renderInputs();
    updateButtonStates();
}

// Wrong guess popup
const wrongGuessOverlay  = document.getElementById('wrong-guess-overlay');
const wrongGuessInput    = document.getElementById('wrong-guess-input');
const wrongGuessSaveBtn  = document.getElementById('wrong-guess-save-btn');
const wrongGuessSkipBtn  = document.getElementById('wrong-guess-skip-btn');
// Results popup
const resultsOverlay  = document.getElementById('results-overlay');
const resultsList     = document.getElementById('results-list');
const resultsCloseBtn = document.getElementById('results-close-btn');

let wrongGuesses = [];
let pendingWrongCell = null;

wrongGuessInput.addEventListener('input', () => {
    wrongGuessSaveBtn.disabled = wrongGuessInput.value.trim() === '';
});

wrongGuessInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !wrongGuessSaveBtn.disabled) wrongGuessSaveBtn.click();
    if (e.key === 'Escape') wrongGuessSkipBtn.click();
});

wrongGuessSaveBtn.addEventListener('click', () => {
    const cell = pendingWrongCell;
    const colWord = currentWords[COL_LETTERS.indexOf(cell[0])];
    const rowWord = currentWords[5 + ROW_NUMBERS.indexOf(cell[1])];
    wrongGuesses.push({ cell, word: wrongGuessInput.value.trim(), colWord, rowWord });
    closeWrongGuessPopup();
});

wrongGuessSkipBtn.addEventListener('click', closeWrongGuessPopup);

function showWrongGuessPopup(cell) {
    pendingWrongCell = cell;
    wrongGuessInput.value = '';
    wrongGuessSaveBtn.disabled = true;
    wrongGuessOverlay.hidden = false;
    setTimeout(() => wrongGuessInput.focus(), 50);
}

function closeWrongGuessPopup() {
    wrongGuessOverlay.hidden = true;
    pendingWrongCell = null;
    endGuessPhase();
}

function showResultsPopup() {
    if (wrongGuesses.length === 0) return;
    resultsList.innerHTML = '';
    wrongGuesses.forEach(({ cell, word, colWord, rowWord }) => {
        const item = document.createElement('div');
        item.className = 'results-item';
        item.innerHTML = `
            <span class="results-item-word">${word}</span>
            <span class="results-item-sep">–</span>
            <span class="results-item-cell">${cell}</span>
            <span class="results-item-sep">–</span>
            <span class="results-item-context">${colWord}</span>
            <span class="results-item-sep">–</span>
            <span class="results-item-context">${rowWord}</span>
        `;
        resultsList.appendChild(item);
    });
    resultsOverlay.hidden = false;
}

resultsCloseBtn.addEventListener('click', () => {
    resultsOverlay.hidden = true;
    if (isExiting) returnToSetup();
});

let gridFontSize = 20;
const FONT_MIN = 9;
const FONT_MAX = 60;

let currentWords = [];
let secondsPassed = 0;
let timerInterval = null;

// Raffle state
let currentRaffleCell = null;
let raffleTimer = null;
let raffleSecondsLeft = 0;
let isGuessingPhase = false;

// ─── Raffle button state ─────────────────────────────────────────────────────
function setRaffleState(state) {
    drawBtn.disabled  = (state !== 'idle');
    passBtn.disabled  = (state !== 'guessing');
    retryBtn.disabled = (state !== 'guessing');
}

// ─── Grid highlighting ────────────────────────────────────────────────────────
let highlightTimeout = null;
let highlightInterval = null;
const COL_LETTERS = ['A','B','C','D','E'];
const ROW_NUMBERS = ['1','2','3','4','5'];

function highlightCell(cellLabel) {
    clearHighlights();
    const colIdx = COL_LETTERS.indexOf(cellLabel[0]);
    const rowIdx = ROW_NUMBERS.indexOf(cellLabel[1]);
    const targetCol = colIdx + 3;
    const targetRow = rowIdx + 3;

    [...mainGrid.children].forEach(cell => {
        const gc = parseInt(cell.style.gridColumn);
        const gr = parseInt(cell.style.gridRow);
        if (gc === targetCol && gr === targetRow) {
            cell.classList.add('cell-highlight-primary');
        } else if (gc === targetCol || gr === targetRow) {
            cell.classList.add('cell-highlight-secondary');
        }
    });

    // Visszaszámláló gomb megjelenítése
    const xIcon = `<svg width="0.8em" height="0.8em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    let secondsLeft = 5;
    highlightCountdownBtn.innerHTML = `<span>${secondsLeft}</span>${xIcon}`;
    highlightCountdownBtn.hidden = false;

    clearInterval(highlightInterval);
    highlightInterval = setInterval(() => {
        secondsLeft--;
        highlightCountdownBtn.innerHTML = `<span>${secondsLeft}</span>${xIcon}`;
        if (secondsLeft <= 0) {
            clearInterval(highlightInterval);
        }
    }, 1000);

    clearTimeout(highlightTimeout);
    highlightTimeout = setTimeout(() => {
        clearHighlights();
        finishRaffle();
    }, 5000);
}

function clearHighlights() {
    clearInterval(highlightInterval);
    highlightInterval = null;
    highlightCountdownBtn.hidden = true;
    mainGrid.querySelectorAll('.cell-highlight-primary, .cell-highlight-secondary')
        .forEach(c => c.classList.remove('cell-highlight-primary', 'cell-highlight-secondary'));
}

// Kattintás a visszaszámláló gombra → azonnali eltüntetés
highlightCountdownBtn.addEventListener('click', () => {
    clearTimeout(highlightTimeout);
    highlightTimeout = null;
    clearHighlights();
    finishRaffle();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
    generateRandomWords();
    renderInputs();
    updateButtonStates();
}

function generateRandomWords() {
    const words = [...HUNGARIAN_WORDS];
    const selected = [];
    for (let i = 0; i < 10; i++) {
        if (words.length === 0) break;
        const idx = Math.floor(Math.random() * words.length);
        selected.push(words.splice(idx, 1)[0].toLowerCase());
    }
    currentWords = selected;
}

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

function updateButtonStates() {
    const allFilled = currentWords.filter(w => w && w.length > 0).length === 10;
    regenerateBtn.disabled = !allFilled;
    startGameBtn.disabled  = !allFilled;
}

regenerateBtn.addEventListener('click', () => {
    generateRandomWords();
    renderInputs();
    updateButtonStates();
    regenerateBtn.style.transform = 'scale(0.95)';
    setTimeout(() => regenerateBtn.style.transform = 'scale(1)', 100);
});

startGameBtn.addEventListener('click', startGame);

// ─── Game start ───────────────────────────────────────────────────────────────
function startGame() {
    setupView.hidden = true;
    gameView.hidden  = false;

    generateGrid();

    secondsPassed = 0;
    timerText.textContent = '00:00';
    gameTimer.hidden = false;

    wrongGuesses = [];
    exitBtn.hidden = false;
    resizeBtn.hidden = false;
    setRaffleState('idle');
    autoFitFontSize();
}

// ─── Font fit ─────────────────────────────────────────────────────────────────
function autoFitFontSize() {
    if (gameView.hidden) return;

    let lo = FONT_MIN, hi = FONT_MAX, best = FONT_MIN;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        mainGrid.style.fontSize = mid + 'px';
        const hOver = mainGrid.scrollWidth > mainGrid.clientWidth + 1;
        const vOver = [...mainGrid.children].some(el => el.scrollHeight > el.clientHeight + 2);
        if (!hOver && !vOver) { best = mid; lo = mid + 1; }
        else { hi = mid - 1; }
    }
    gridFontSize = best;
    mainGrid.style.fontSize = best + 'px';
    document.querySelector('.app-header').style.fontSize = best + 'px';
}

let resizeTimeout = null;
resizeBtn.addEventListener('click', autoFitFontSize);

window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(autoFitFontSize, 100);
});

// ─── Raffle ───────────────────────────────────────────────────────────────────
function performRaffle(reuse = false) {
    if (!reuse) {
        const colLetters  = ['A','B','C','D','E'];
        const rowNumbers  = ['1','2','3','4','5'];
        const correctCells = new Set(
            [...document.querySelectorAll('.game-cell.cell-correct')].map(el => el.textContent.trim())
        );
        const available = [];
        for (const col of colLetters)
            for (const row of rowNumbers)
                if (!correctCells.has(`${col}${row}`)) available.push(`${col}${row}`);

        if (available.length === 0) return;

        currentRaffleCell = available[Math.floor(Math.random() * available.length)];

        // Reset and restart timer
        pauseTimer();
        secondsPassed = 0;
        timerText.textContent = '00:00';
        resumeTimer();
    }

    isGuessingPhase = false;
    setRaffleState('counting');
    if (raffleTimer) clearInterval(raffleTimer);
    highlightCell(currentRaffleCell);
}

/**
 * 5 másodperc elteltével hívódik (highlightTimeout): tippelési fázis indul.
 */
function finishRaffle() {
    if (raffleTimer) { clearInterval(raffleTimer); raffleTimer = null; }
    isGuessingPhase = true;
    setRaffleState('guessing');
    document.querySelectorAll('.game-cell').forEach(cell => {
        if (cell.textContent.trim().match(/^[A-E][1-5]$/) && !cell.classList.contains('cell-correct'))
            cell.classList.add('cell-guess-hover');
    });
}

function resetRaffle() {
    currentRaffleCell = null;
    if (raffleTimer) clearInterval(raffleTimer);
    clearTimeout(highlightTimeout);
    clearHighlights();
    isGuessingPhase = false;
    pauseTimer();
    setRaffleState('idle');
    document.querySelectorAll('.game-cell').forEach(cell => cell.classList.remove('cell-guess-hover'));
}

drawBtn.addEventListener('click',  () => performRaffle(false));
retryBtn.addEventListener('click', () => performRaffle(true));
passBtn.addEventListener('click',  () => resetRaffle());

// ─── Guess phase end ──────────────────────────────────────────────────────────
function endGuessPhase() {
    isGuessingPhase   = false;
    currentRaffleCell = null;
    clearTimeout(highlightTimeout);
    clearHighlights();
    pauseTimer();
    secondsPassed = 0;
    timerText.textContent = '00:00';
    document.querySelectorAll('.game-cell').forEach(cell => cell.classList.remove('cell-guess-hover'));

    const total = 25;
    const done  = document.querySelectorAll('.game-cell.cell-correct').length;
    if (done >= total) {
        setRaffleState('done');
        setTimeout(showResultsPopup, 600);
    } else {
        setRaffleState('idle');
    }
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function resumeTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        secondsPassed++;
        const m = Math.floor(secondsPassed / 60).toString().padStart(2, '0');
        const s = (secondsPassed % 60).toString().padStart(2, '0');
        timerText.textContent = `${m}:${s}`;
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

// ─── Grid generation ─────────────────────────────────────────────────────────
function generateGrid() {
    mainGrid.innerHTML = '';
    mainGrid.style.gridTemplateColumns = '1.5em max-content minmax(max-content, 1fr) minmax(max-content, 1fr) minmax(max-content, 1fr) minmax(max-content, 1fr) minmax(max-content, 1fr)';
    mainGrid.style.gridTemplateRows    = '1.5em 1fr 1fr 1fr 1fr 1fr 1fr';

    const colLetters = ['A','B','C','D','E'];
    const rowNumbers = ['1','2','3','4','5'];
    const colWords   = currentWords.slice(0, 5);
    const rowWords   = currentWords.slice(5, 10);

    colLetters.forEach((l, i) => {
        const c = createCell(l, 'header-label');
        c.style.gridColumn = i + 3; c.style.gridRow = 1;
        mainGrid.appendChild(c);
    });
    colWords.forEach((w, i) => {
        const c = createCell(w, 'grid-cell word-card');
        c.style.gridColumn = i + 3; c.style.gridRow = 2;
        mainGrid.appendChild(c);
    });
    rowNumbers.forEach((n, i) => {
        const c = createCell(n, 'header-label');
        c.style.gridColumn = 1; c.style.gridRow = i + 3;
        mainGrid.appendChild(c);
    });
    rowWords.forEach((w, i) => {
        const c = createCell(w, 'grid-cell word-card');
        c.style.gridColumn = 2; c.style.gridRow = i + 3;
        mainGrid.appendChild(c);
    });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
        const label = `${colLetters[c]}${rowNumbers[r]}`;
        const cell  = createCell(label, 'grid-cell game-cell');
        cell.style.gridColumn = c + 3; cell.style.gridRow = r + 3;
        mainGrid.appendChild(cell);
    }

    mainGrid.addEventListener('click', (e) => {
        if (!isGuessingPhase) return;
        const cell = e.target.closest('.game-cell');
        if (!cell) return;
        const label = cell.textContent;
        if (!label.match(/^[A-E][1-5]$/) || cell.classList.contains('cell-correct')) return;
        if (label === currentRaffleCell) {
            cell.classList.add('cell-correct');
            endGuessPhase();
        } else {
            cell.classList.add('cell-wrong-guess');
            setTimeout(() => cell.classList.remove('cell-wrong-guess'), 1500);
            // Popup mutatása a helyes cella megadásával
            showWrongGuessPopup(currentRaffleCell);
        }
    });
}

function createCell(text, className) {
    const div = document.createElement('div');
    div.className  = className;
    div.textContent = text;
    return div;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();

window.addEventListener('beforeunload', (e) => {
    if (gameView.hidden) return;
    e.preventDefault();
    e.returnValue = '';
});
