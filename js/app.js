'use strict';

/*
  HW4 - Lotto game (Basic JS + Grid/Flex + Media Queries)

  NOTE (design choice):
  - This version does NOT use Set. Instead, it uses a plain Array + indexOf() checks
    to keep the code more conservative (per your request).
*/

/* === Debugging helper === */

/* Toggle this to quickly enable/disable verbose console logs. */
var DEBUG = true;

/* Console logger that can be turned off by setting DEBUG = false. */
function dbg() {
    if (!DEBUG) return;
    console.log.apply(console, arguments);
}

/* === Game state === */

/*
  We keep all state in one object so it is easy to inspect in Chrome DevTools
  (Console: type `state` and press Enter).
*/
var state = {
    money: 1000,              /* Player starts with 1000₪ (course requirement) */
    ticketCost: 300,          /* Each lottery costs 300₪ (course requirement) */
    round: 1,                 /* How many rounds were played */
    isGameOver: false,        /* When true: disable all controls */

    /* User selections */
    selectedStrong: null,     /* Number between 1-7 */
    selectedNumbers: [],      /* Array of unique numbers (1-37), length max 6 */

    /* Hidden winning numbers for the current round */
    winningStrong: null,      /* Number between 1-7 */
    winningNumbers: []        /* Array of 6 unique numbers (1-37) */
};

/* === Cached DOM elements === */
var els = {
    moneyValue: null,
    ticketCostValue: null,
    roundValue: null,
    message: null,

    strongBoard: null,
    numbersBoard: null,

    pickedStrong: null,
    pickedNumbers: null,

    checkBtn: null,
    finishBtn: null,

    result: null,

    /* For fast UI updates: store button references by value */
    strongCellsByValue: [],
    numberCellsByValue: []
};

/* === Boot === */

document.addEventListener('DOMContentLoaded', function () {
    /* This event fires when the initial HTML document is fully parsed and ready. */
    dbg('[BOOT] DOMContentLoaded');

    cacheElements();
    buildBoards();
    wireEvents();

    renderStatus();
    startNewRound('מוכן. בחר מספר חזק ו-6 מספרים ואז לחץ על "בדיקת הגרלה".');
});

/* === Setup helpers === */

function cacheElements() {
    /* Grab all required elements once (faster + cleaner than querying repeatedly). */
    els.moneyValue = document.getElementById('moneyValue');
    els.ticketCostValue = document.getElementById('ticketCostValue');
    els.roundValue = document.getElementById('roundValue');
    els.message = document.getElementById('message');

    els.strongBoard = document.getElementById('strongBoard');
    els.numbersBoard = document.getElementById('numbersBoard');

    els.pickedStrong = document.getElementById('pickedStrong');
    els.pickedNumbers = document.getElementById('pickedNumbers');

    els.checkBtn = document.getElementById('checkBtn');
    els.finishBtn = document.getElementById('finishBtn');

    els.result = document.getElementById('result');

    dbg('[cacheElements] done', {
        moneyValue: !!els.moneyValue,
        ticketCostValue: !!els.ticketCostValue,
        roundValue: !!els.roundValue,
        message: !!els.message,
        strongBoard: !!els.strongBoard,
        numbersBoard: !!els.numbersBoard,
        pickedStrong: !!els.pickedStrong,
        pickedNumbers: !!els.pickedNumbers,
        checkBtn: !!els.checkBtn,
        finishBtn: !!els.finishBtn,
        result: !!els.result
    });
}

function buildBoards() {
    /*
      Create the button grids for:
      - Strong number: 1..7
      - Regular numbers: 1..37
      Buttons are created dynamically so the HTML stays clean and minimal.
    */
    dbg('[buildBoards] building strong(1..7) + numbers(1..37)');

    /* --- Strong board --- */
    clearElement(els.strongBoard);
    for (var s = 1; s <= 7; s++) {
        var strongBtn = createCellButton(s);
        strongBtn.classList.add('cell--strong');

        /* Store reference by value so we can update CSS quickly later */
        els.strongCellsByValue[s] = strongBtn;

        /* Add click handler for strong selection */
        strongBtn.addEventListener('click', function (ev) {
            var value = parseInt(ev.currentTarget.dataset.value, 10);
            onStrongClicked(value);
        });

        els.strongBoard.appendChild(strongBtn);
    }

    /* --- Numbers board --- */
    clearElement(els.numbersBoard);
    for (var n = 1; n <= 37; n++) {
        var numberBtn = createCellButton(n);
        numberBtn.classList.add('cell--number');

        els.numberCellsByValue[n] = numberBtn;

        numberBtn.addEventListener('click', function (ev) {
            var value = parseInt(ev.currentTarget.dataset.value, 10);
            onNumberClicked(value);
        });

        els.numbersBoard.appendChild(numberBtn);
    }
}

function wireEvents() {
    dbg('[wireEvents]');

    els.checkBtn.addEventListener('click', onCheckLotteryClicked);
    els.finishBtn.addEventListener('click', onFinishClicked);
}

/* === UI rendering === */

function renderStatus() {
    /* Update top bar values. */
    els.moneyValue.textContent = state.money + ' ₪';
    els.ticketCostValue.textContent = state.ticketCost + ' ₪';
    els.roundValue.textContent = String(state.round);

    dbg('[renderStatus]', { money: state.money, ticketCost: state.ticketCost, round: state.round });
}

function setMessage(text) {
    /* Show a message to the player. */
    els.message.textContent = text;
    dbg('[message]', text);
}

function renderPicked() {
    /* Show the user's currently selected numbers on screen (easy to verify). */
    els.pickedStrong.textContent = state.selectedStrong === null ? '—' : String(state.selectedStrong);

    if (state.selectedNumbers.length === 0) {
        els.pickedNumbers.textContent = '—';
    } else {
        var sorted = copyAndSort(state.selectedNumbers);
        els.pickedNumbers.textContent = sorted.join(', ');
    }

    dbg('[renderPicked]', {
        selectedStrong: state.selectedStrong,
        selectedNumbers: state.selectedNumbers.slice()
    });
}

function renderSelectionStyles() {
    /*
      Add/remove the 'is-selected' class on each button.
      This replaces the old Set.has() usage with Array indexOf() checks.
    */
    for (var s = 1; s <= 7; s++) {
        var strongBtn = els.strongCellsByValue[s];
        var isSelectedStrong = (state.selectedStrong === s);

        /* Instead of classList.toggle(..., boolean), we do explicit add/remove. */
        if (isSelectedStrong) strongBtn.classList.add('is-selected');
        else strongBtn.classList.remove('is-selected');
    }

    for (var n = 1; n <= 37; n++) {
        var numberBtn = els.numberCellsByValue[n];
        var isSelectedNumber = (state.selectedNumbers.indexOf(n) !== -1);

        if (isSelectedNumber) numberBtn.classList.add('is-selected');
        else numberBtn.classList.remove('is-selected');
    }
}

function setControlsEnabled(isEnabled) {
    /* Enable/disable all user controls (used when the game ends). */
    els.checkBtn.disabled = !isEnabled;
    els.finishBtn.disabled = !isEnabled;

    for (var s = 1; s <= 7; s++) {
        els.strongCellsByValue[s].disabled = !isEnabled;
    }

    for (var n = 1; n <= 37; n++) {
        els.numberCellsByValue[n].disabled = !isEnabled;
    }

    dbg('[setControlsEnabled]', isEnabled);
}

/* === Round lifecycle === */

function startNewRound(messageText) {
    /*
      Called:
      - on first load
      - after each successful 'check' (if player still has money)
  
      Requirement:
      - At the beginning of each lottery, generate and store the winning numbers.
    */
    dbg('[startNewRound] round', state.round, 'money', state.money);

    if (state.money < state.ticketCost) {
        /* Requirement: do not allow playing if not enough money. */
        endGame('אין מספיק כסף כדי לבצע הגרלה נוספת. המשחק הסתיים. סכום סופי: ' + state.money + ' ₪');
        return;
    }

    /* Generate hidden winning numbers for this round. */
    state.winningNumbers = generateUniqueNumbers(6, 1, 37);
    state.winningStrong = randomInt(1, 7);

    dbg('[startNewRound] winningNumbers (hidden)', state.winningNumbers.slice(), 'winningStrong (hidden)', state.winningStrong);

    /* Reset user selections. */
    state.selectedStrong = null;
    state.selectedNumbers = [];

    renderStatus();
    renderPicked();
    renderSelectionStyles();
    setControlsEnabled(true);

    setMessage(messageText);
}

/* === Click handlers === */

function onStrongClicked(value) {
    if (state.isGameOver) return;

    dbg('[onStrongClicked]', value);

    /* Toggle behavior: click again to clear, or click a different number to change selection. */
    if (state.selectedStrong === value) state.selectedStrong = null;
    else state.selectedStrong = value;

    renderPicked();
    renderSelectionStyles();
}

function onNumberClicked(value) {
    if (state.isGameOver) return;

    dbg('[onNumberClicked]', value);

    var idx = state.selectedNumbers.indexOf(value);

    if (idx !== -1) {
        /* If the number is already selected -> remove it (toggle off). */
        state.selectedNumbers.splice(idx, 1);
        dbg('  removed', value, '=>', state.selectedNumbers.slice());
    } else {
        /* If not selected, make sure we don't exceed 6 numbers. */
        if (state.selectedNumbers.length >= 6) {
            setMessage('אפשר לבחור עד 6 מספרים בלבד. בטל מספר קיים או בחר מספר אחר.');
            dbg('  blocked: already have 6 numbers');
            return;
        }

        state.selectedNumbers.push(value);
        dbg('  added', value, '=>', state.selectedNumbers.slice());
    }

    renderPicked();
    renderSelectionStyles();
}

function onCheckLotteryClicked() {
    if (state.isGameOver) return;

    dbg('[onCheckLotteryClicked] BEFORE', snapshotStateForDebug());

    /* Requirement: do not allow playing if not enough money. */
    if (state.money < state.ticketCost) {
        endGame('אין מספיק כסף כדי לבצע הגרלה נוספת. המשחק הסתיים. סכום סופי: ' + state.money + ' ₪');
        return;
    }

    /* Requirement: if the form is incomplete, show a message. */
    if (state.selectedStrong === null || state.selectedNumbers.length !== 6) {
        setMessage('הטופס לא מלא. חובה לבחור מספר חזק אחד + 6 מספרים שונים (1–37).');
        dbg('[validation] incomplete', { selectedStrong: state.selectedStrong, count: state.selectedNumbers.length });
        return;
    }

    /* Deduct the cost of a round. */
    state.money -= state.ticketCost;

    /* Calculate matches. */
    var matchedCount = countMatches(state.selectedNumbers, state.winningNumbers);
    var strongMatch = (state.selectedStrong === state.winningStrong);

    var prize = calculatePrize(matchedCount, strongMatch);

    /* Add prize to money (could be 0). */
    state.money += prize;

    dbg('[result] matchedCount', matchedCount, 'strongMatch', strongMatch, 'prize', prize, 'moneyAfter', state.money);

    /* Requirement: show results on the page (winning numbers + user picks + success/failure). */
    renderResult(matchedCount, strongMatch, prize);

    /* Requirement: clean controls (reset) after the round. */
    state.round += 1;

    /* Start next round if possible (this also clears selections). */
    if (state.money >= state.ticketCost) {
        startNewRound('סבב חדש מוכן. בחר שוב מספר חזק ו-6 מספרים.');
    } else {
        endGame('אין מספיק כסף כדי לבצע הגרלה נוספת. המשחק הסתיים. סכום סופי: ' + state.money + ' ₪');
    }

    dbg('[onCheckLotteryClicked] AFTER', snapshotStateForDebug());
}

function onFinishClicked() {
    if (state.isGameOver) return;

    dbg('[onFinishClicked]');

    /* Requirement: stop the game and prevent more play. */
    endGame('המשחק הסתיים לפי בקשתך. סכום סופי: ' + state.money + ' ₪');
}

/* === Result rendering === */

function renderResult(matchedCount, strongMatch, prize) {
    /* Prepare display values. */
    var userNumsSorted = copyAndSort(state.selectedNumbers);
    var winNumsSorted = copyAndSort(state.winningNumbers);

    var userStrong = state.selectedStrong;
    var winStrong = state.winningStrong;

    /* Build chips (small styled spans) for both winning and user picks. */
    var winStrongHtml = chipsHtml([winStrong], [true]); /* winning strong is always shown as neutral */
    var userStrongHtml = chipsHtml([userStrong], [strongMatch]);

    var winNumsHtml = chipsHtml(winNumsSorted, buildHitArray(winNumsSorted, winNumsSorted)); /* all winning numbers = hit */
    var userNumsHtml = chipsHtml(userNumsSorted, buildHitArray(userNumsSorted, winNumsSorted));

    var summaryText = '';
    if (prize > 0) {
        summaryText = '✅ הצלחה! זכית ב-' + prize + ' ₪';
    } else {
        summaryText = '❌ לא זכית הפעם.';
    }

    var extraText = 'התאמות: ' + matchedCount + ' מספרים' + (strongMatch ? ' + מספר חזק ✅' : ' + מספר חזק ❌');

    /* Update the result container in the DOM. */
    els.result.innerHTML =
        '<div class="result-row">' +
        '<div class="result-label">מספר חזק</div>' +
        '<div>' +
        '<div><strong>הוגרל:</strong> <span class="chips">' + winStrongHtml + '</span></div>' +
        '<div><strong>בחרת:</strong> <span class="chips">' + userStrongHtml + '</span></div>' +
        '</div>' +
        '</div>' +

        '<div class="result-row">' +
        '<div class="result-label">מספרים</div>' +
        '<div>' +
        '<div><strong>הוגרלו:</strong> <span class="chips">' + winNumsHtml + '</span></div>' +
        '<div><strong>בחרת:</strong> <span class="chips">' + userNumsHtml + '</span></div>' +
        '</div>' +
        '</div>' +

        '<div class="result-row">' +
        '<div class="result-label">סיכום</div>' +
        '<div>' +
        '<div>' + summaryText + '</div>' +
        '<div>' + extraText + '</div>' +
        '<div>כסף נוכחי: <strong>' + state.money + ' ₪</strong></div>' +
        '</div>' +
        '</div>';

    dbg('[renderResult] done');
}

/* === Prize rules === */

function calculatePrize(matchedCount, strongMatch) {
    /*
      Prize rules (course requirement):
      1) 6 matches + strong => 1000
      2) 6 matches (no strong) => 600
      3) 4 matches + strong => 400
      4) Anything else => 0
      NOTE: player can win only one prize per round.
    */
    if (matchedCount === 6 && strongMatch) return 1000;
    if (matchedCount === 6 && !strongMatch) return 600;
    if (matchedCount === 4 && strongMatch) return 400;
    return 0;
}

/* === Utilities (no Set) === */

function generateUniqueNumbers(count, min, max) {
    /*
      Generates `count` unique random integers between min..max (inclusive),
      WITHOUT using Set (uses Array + indexOf()).
    */
    var arr = [];
    while (arr.length < count) {
        var n = randomInt(min, max);
        if (arr.indexOf(n) === -1) arr.push(n);
    }
    return arr;
}

function randomInt(min, max) {
    /* Returns an integer in the range [min, max]. */
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function countMatches(userArr, winArr) {
    /* Counts how many values from userArr appear inside winArr (no Set). */
    var count = 0;
    for (var i = 0; i < userArr.length; i++) {
        if (winArr.indexOf(userArr[i]) !== -1) count += 1;
    }
    return count;
}

function copyAndSort(arr) {
    /* Copy an array and sort numerically ascending. */
    var copy = arr.slice();
    copy.sort(function (a, b) { return a - b; });
    return copy;
}

function buildHitArray(valuesToMark, winValues) {
    /*
      Returns an array of booleans aligned with valuesToMark:
      true if the value is inside winValues, else false.
    */
    var hits = [];
    for (var i = 0; i < valuesToMark.length; i++) {
        hits.push(winValues.indexOf(valuesToMark[i]) !== -1);
    }
    return hits;
}

function chipsHtml(values, hitFlags) {
    /*
      Build small HTML spans for each number.
      hitFlags[i] === true -> "hit" styling
    */
    var html = '';
    for (var i = 0; i < values.length; i++) {
        var cls = hitFlags[i] ? 'chip hit' : 'chip miss';
        html += '<span class="chip ' + (hitFlags[i] ? 'hit' : 'miss') + '">' + values[i] + '</span>';
    }
    return html;
}

function createCellButton(value) {
    /* Create a clickable number button with dataset value. */
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell';
    btn.textContent = String(value);

    /* dataset.value keeps the number on the element so click handlers can read it. */
    btn.dataset.value = String(value);

    return btn;
}

function clearElement(el) {
    /* Remove all child nodes from an element. */
    while (el.firstChild) el.removeChild(el.firstChild);
}

function endGame(finalMessage) {
    /* End the game and disable all controls. */
    state.isGameOver = true;
    setControlsEnabled(false);
    renderStatus();
    setMessage(finalMessage);

    dbg('[endGame]', finalMessage, snapshotStateForDebug());
}

function snapshotStateForDebug() {
    /* A small safe snapshot for console logging. */
    return {
        money: state.money,
        ticketCost: state.ticketCost,
        round: state.round,
        isGameOver: state.isGameOver,
        selectedStrong: state.selectedStrong,
        selectedNumbers: state.selectedNumbers.slice(),
        winningStrong: state.winningStrong,
        winningNumbers: state.winningNumbers.slice()
    };
}
