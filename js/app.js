'use strict';




/* =========================================================
   Debug helper  : show system winning numbers
   
   if DEBUG is true, logs to console the winning strong number and winning numbers.
   for debugging purposes only.
   you can disable it by setting DEBUG to false.
   ========================================================= */

/* Logs ONLY the system draw (winning strong + winning numbers). */
/*  Debug prints only when DEBUG is true. */

var DEBUG_WINNERS = true;
function dbgWinners(where) {
    if (!DEBUG_WINNERS) return;
    console.log('[WIN]', where, 'numbers=', game.state.winningNumbers, 'strong=', game.state.winningStrong);
}


/* =========================================================
   Game model
   ========================================================= */

var game = {
    config: {
        ticketCost: 300,
        startMoney: 1000,
        maxNumbers: 6,
        minNumber: 1,
        maxNumber: 37,
        minStrong: 1,
        maxStrong: 7
    },
    state: {
        isStarted: false,
        isLocked: false,
        lockMode: null,          /* out of money or plyer end the game */
        winningNumbers: [],
        winningStrong: null,
        validPlays: 0            /* Counts - completed valid plays */
    },
    player: {
        money: 1000,
        selectedNumbers: [],
        selectedStrong: null
    }
};

/* =========================================================
   DOM references (cached)
   ========================================================= */

var els = {
    /* Stats */
    moneyValue: null,
    ticketCostValue: null,
    playsValue: null,

    /* Boards */
    strongBoard: null,
    numbersBoard: null,

    /* Picks */
    pickedStrong: null,
    pickedNumbers: null,

    /* Controls */
    checkBtn: null,
    finishBtn: null,

    /* Result */
    result: null,

    /* Alerts */
    alertHost: null,

    /* Board button maps */
    strongCellsByValue: [],
    numberCellsByValue: [],

    /* Modals */
    welcomeModalEl: null,
    startGameBtn: null,
    welcomeModal: null,

    blockModalEl: null,
    blockModalTitle: null,
    blockModalMoney: null,
    blockModalText: null,
    depositSection: null,
    depositAmount: null,
    depositBtn: null,
    blockCloseBtn: null,
    blockModal: null
};

/* =========================================================
   Boot
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    cacheElements();
    initBootstrapModals();
    buildBoards();
    wireEvents();

    /* Initial money */
    game.player.money = game.config.startMoney;

    /* Render initial UI */
    renderStatus();
    renderPicked();
    renderSelectionStyles();

    /* Lock controls until the user explicitly starts */
    setControlsEnabled(false);

    /* Show welcome modal immediately */
    openWelcomeModal();
});

/* =========================================================
   Setup
   ========================================================= */

function cacheElements() {
    els.moneyValue = document.getElementById('moneyValue');
    els.ticketCostValue = document.getElementById('ticketCostValue');
    els.playsValue = document.getElementById('playsValue');

    els.strongBoard = document.getElementById('strongBoard');
    els.numbersBoard = document.getElementById('numbersBoard');

    els.pickedStrong = document.getElementById('pickedStrong');
    els.pickedNumbers = document.getElementById('pickedNumbers');

    els.checkBtn = document.getElementById('checkBtn');
    els.finishBtn = document.getElementById('finishBtn');

    els.result = document.getElementById('result');
    els.alertHost = document.getElementById('alertHost');

    els.welcomeModalEl = document.getElementById('welcomeModal');
    els.startGameBtn = document.getElementById('startGameBtn');

    els.blockModalEl = document.getElementById('blockModal');
    els.blockModalTitle = document.getElementById('blockModalTitle');
    els.blockModalMoney = document.getElementById('blockModalMoney');
    els.blockModalText = document.getElementById('blockModalText');
    els.depositSection = document.getElementById('depositSection');
    els.depositAmount = document.getElementById('depositAmount');
    els.depositBtn = document.getElementById('depositBtn');
    els.blockCloseBtn = document.getElementById('blockCloseBtn');

}

function initBootstrapModals() {
    /* Bootstrap is used only to display modals/alerts nicely. */
    if (typeof bootstrap === 'undefined') {
        return;
    }
    els.welcomeModal = new bootstrap.Modal(els.welcomeModalEl, { backdrop: 'static', keyboard: false });
    els.blockModal = new bootstrap.Modal(els.blockModalEl, { backdrop: 'static', keyboard: false });
}

function wireEvents() {
    els.checkBtn.addEventListener('click', onCheckLotteryClicked);
    els.finishBtn.addEventListener('click', onFinishClicked);
    els.startGameBtn.addEventListener('click', function () {

        game.state.isStarted = true;
        closeWelcomeModal();
        startNewRound();
        dbgWinners('after startNewRound'); // for debugging: show winning numbers

        setControlsEnabled(true);
        showAlert('Game started. Pick 1 strong number and 6 numbers, then click "Check lottery".', 'info', 4500);
    });

    els.depositBtn.addEventListener('click', onDepositClicked);

    els.blockCloseBtn.addEventListener('click', function () {
        /* Closing does not unlock the game. Refresh or deposit (if allowed). */
        if (els.blockModal) els.blockModal.hide();
    });
}

/* =========================================================
   Alerts for the player
   ========================================================= */

function showAlert(message, type, autoHideMs) {
    /* type: success | info | warning | danger */
    var box = document.createElement('div');
    box.className = 'alert alert-' + type + ' alert-dismissible fade show shadow-sm';
    box.setAttribute('role', 'alert');

    box.innerHTML =
        '<div>' + escapeHtml(message) + '</div>' +
        '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

    els.alertHost.appendChild(box);

    if (typeof autoHideMs === 'number' && autoHideMs > 0) {
        setTimeout(function () {
            try {
                if (typeof bootstrap !== 'undefined') {
                    var inst = bootstrap.Alert.getOrCreateInstance(box);
                    inst.close();
                } else {
                    if (box.parentNode) box.parentNode.removeChild(box);
                }
            } catch (e) {
                if (box.parentNode) box.parentNode.removeChild(box);
            }
        }, autoHideMs);
    }
}

function escapeHtml(s) {
    var str = String(s);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* =========================================================
   Modals
   ========================================================= */

function openWelcomeModal() {
    if (els.welcomeModal) els.welcomeModal.show();
    else alert('Welcome to the Lotto Game.');
}

function closeWelcomeModal() {
    if (els.welcomeModal) els.welcomeModal.hide();
}

function openBlockModal(mode, text) {
 
    game.state.isLocked = true;
    game.state.lockMode = mode;

    updateBlockModalContent(mode, text);
    setControlsEnabled(false);

    if (els.blockModal) els.blockModal.show();
    else alert(text + '\nMoney left: ' + game.player.money + '\nRefresh (F5) to restart.');

}

function updateBlockModalContent(mode, text) {
    els.blockModalMoney.textContent = String(game.player.money);
    els.blockModalText.textContent = text;

    if (mode === 'OUT_OF_MONEY') {
        els.blockModalTitle.textContent = 'Not enough money';
        els.depositSection.style.display = '';
        els.depositBtn.style.display = '';
    } else {
        els.blockModalTitle.textContent = 'Game finished';
        els.depositSection.style.display = 'none';
        els.depositBtn.style.display = 'none';
    }
}

/* =========================================================
   Boards (dynamic creation)
   ========================================================= */

function buildBoards() {
    /* Strong board */
    clearElement(els.strongBoard);
    for (var s = game.config.minStrong; s <= game.config.maxStrong; s++) {
        var strongBtn = createCellButton(s, true);
        els.strongCellsByValue[s] = strongBtn;

        strongBtn.addEventListener('click', function (event) {
            var value = readCellValue(event.currentTarget);
            onStrongClicked(value);
        });

        els.strongBoard.appendChild(strongBtn);
    }

    /* Numbers board */
    clearElement(els.numbersBoard);
    for (var n = game.config.minNumber; n <= game.config.maxNumber; n++) {
        var numberBtn = createCellButton(n, false);
        els.numberCellsByValue[n] = numberBtn;

        numberBtn.addEventListener('click', function (event) {
            var value = readCellValue(event.currentTarget);
            onNumberClicked(value);
        });

        els.numbersBoard.appendChild(numberBtn);
    }

}

function createCellButton(value, isStrong) {
    var btn = document.createElement('button');
    btn.type = 'button';

    /* We keep Bootstrap "btn" for base sizing, but colors are controlled in our CSS for stability. */
    btn.className = 'cell btn ' + (isStrong ? 'cell--strong' : 'cell--number');

    btn.textContent = String(value);

    /* Conservative approach: use data-value attribute and getAttribute (no dataset dependency). */
    btn.setAttribute('data-value', String(value));

    return btn;
}

function readCellValue(buttonEl) {
    /* Always parse base-10 integer from our data-value attribute. */
    var raw = buttonEl.getAttribute('data-value');
    return parseInt(raw, 10);
}

function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}

/* =========================================================
   Rendering
   ========================================================= */

function renderStatus() {
    els.moneyValue.textContent = String(game.player.money);
    els.ticketCostValue.textContent = String(game.config.ticketCost);
    els.playsValue.textContent = String(game.state.validPlays);
}

function renderPicked() {
    els.pickedStrong.textContent = (game.player.selectedStrong === null) ? '—' : String(game.player.selectedStrong);

    if (game.player.selectedNumbers.length === 0) {
        els.pickedNumbers.textContent = '—';
    } else {
        /* No join(): build string with a loop. */
        els.pickedNumbers.textContent = arrayToString(game.player.selectedNumbers, ', ');
    }
}

function renderSelectionStyles() {
    /* Strong selection */
    for (var s = game.config.minStrong; s <= game.config.maxStrong; s++) {
        var sb = els.strongCellsByValue[s];
        if (!sb) continue;

        if (game.player.selectedStrong === s) sb.classList.add('is-selected');
        else sb.classList.remove('is-selected');
    }

    /* Number selection */
    for (var n = game.config.minNumber; n <= game.config.maxNumber; n++) {
        var nb = els.numberCellsByValue[n];
        if (!nb) continue;

        if (indexOfNumber(game.player.selectedNumbers, n) !== -1) nb.classList.add('is-selected');
        else nb.classList.remove('is-selected');
    }
}

function setControlsEnabled(isEnabled) {
    /* Controls are enabled only when started and not locked. */
    var enabled = isEnabled && game.state.isStarted && !game.state.isLocked;

    els.checkBtn.disabled = !enabled;
    els.finishBtn.disabled = !enabled;

    for (var s = game.config.minStrong; s <= game.config.maxStrong; s++) {
        if (els.strongCellsByValue[s]) els.strongCellsByValue[s].disabled = !enabled;
    }

    for (var n = game.config.minNumber; n <= game.config.maxNumber; n++) {
        if (els.numberCellsByValue[n]) els.numberCellsByValue[n].disabled = !enabled;
    }
}

/* =========================================================
   Round lifecycle
   ========================================================= */

function startNewRound() {
    if (game.player.money < game.config.ticketCost) {
        openBlockModal(
            'OUT_OF_MONEY',
            'You cannot continue because you do not have enough money. Deposit to keep playing, or refresh (F5) to restart.'
        );
        return;
    }

    /* Winning values are generated at the start of each round (hidden until check). */
    game.state.winningNumbers = generateUniqueNumbers(6, game.config.minNumber, game.config.maxNumber);
    game.state.winningStrong = randomInt(game.config.minStrong, game.config.maxStrong);

    /* Reset picks */
    game.player.selectedStrong = null;
    game.player.selectedNumbers = [];

    renderPicked();
    renderSelectionStyles();
    renderStatus();

}

/* =========================================================
   Click handlers (instant visual feedback)
   ========================================================= */

function onStrongClicked(value) {
    if (!game.state.isStarted || game.state.isLocked) return;

    /* Toggle selection */
    if (game.player.selectedStrong === value) game.player.selectedStrong = null;
    else game.player.selectedStrong = value;

    /* Immediate UI update (no waiting) */
    renderPicked();
    renderSelectionStyles();

}

function onNumberClicked(value) {
    if (!game.state.isStarted || game.state.isLocked) return;

    var idx = indexOfNumber(game.player.selectedNumbers, value);

    if (idx !== -1) {
        /* Toggle off */
        removeAt(game.player.selectedNumbers, idx);
    } else {
        /* Enforce max of 6 */
        if (game.player.selectedNumbers.length >= game.config.maxNumbers) {
            showAlert('You can select up to 6 numbers only.', 'warning', 4000);
            return;
        }
        game.player.selectedNumbers.push(value);
    }

    /* Immediate UI update (no waiting) */
    renderPicked();
    renderSelectionStyles();

}

function onCheckLotteryClicked() {

    dbgWinners('before check');// for debugging: show winning strong number

    if (!game.state.isStarted || game.state.isLocked) return;

    /* Money validation */
    if (game.player.money < game.config.ticketCost) {
        openBlockModal(
            'OUT_OF_MONEY',
            'You cannot continue because you do not have enough money. Deposit to keep playing, or refresh (F5) to restart.'
        );
        return;
    }

    /* Form validation */
    if (game.player.selectedStrong === null || game.player.selectedNumbers.length !== game.config.maxNumbers) {
        showAlert('Incomplete selection: pick 1 strong number and exactly 6 numbers.', 'danger', 4500);
        return;
    }

    /* Ticket payment */
    game.player.money -= game.config.ticketCost;

    /* This is a VALID play (a complete check was performed). */
    game.state.validPlays += 1;

    /* Compare results */
    var matchedCount = countMatches(game.player.selectedNumbers, game.state.winningNumbers);
    var strongMatch = (game.player.selectedStrong === game.state.winningStrong);
    var prize = calculatePrize(matchedCount, strongMatch);

    /* Prize payout */
    game.player.money += prize;

    /* Render UI */
    renderStatus();
    renderResult(matchedCount, strongMatch, prize);

    if (prize > 0) showAlert('You won ' + prize + '!', 'success', 4500);
    else showAlert('No prize this time.', 'info', 2500);

    /* Decide next step */
    if (game.player.money < game.config.ticketCost) {
        openBlockModal(
            'OUT_OF_MONEY',
            'You cannot continue because you do not have enough money. Deposit to keep playing, or refresh (F5) to restart.'
        );
    } else {
        startNewRound();
    }
}

function onFinishClicked() {
    if (!game.state.isStarted || game.state.isLocked) return;

    openBlockModal(
        'FINISHED',
        'You chose to finish the game. To start again, refresh the page (F5).'
    );

}

/* =========================================================
   Deposit (optional continuation)
   ========================================================= */

function onDepositClicked() {
    if (game.state.lockMode !== 'OUT_OF_MONEY') return;

    var amount = parseInt(String(els.depositAmount.value), 10);

    if (isNaN(amount) || amount <= 0) {
        showAlert('Invalid deposit amount.', 'danger', 3500);
        return;
    }

    game.player.money += amount;
    renderStatus();

    /* Unlock and continue if enough */
    if (game.player.money >= game.config.ticketCost) {
        game.state.isLocked = false;
        game.state.lockMode = null;

        if (els.blockModal) els.blockModal.hide();

        showAlert('Deposit added. You can continue playing.', 'success', 3000);

        startNewRound();
        setControlsEnabled(true);
    } else {
        updateBlockModalContent('OUT_OF_MONEY', 'Still not enough money. Deposit more, or refresh (F5) to restart.');
    }
}

/* =========================================================
   Result rendering 
   ========================================================= */
function renderResult(matchedCount, strongMatch, prize) {
    var userNums = copyArray(game.player.selectedNumbers);
    var winNums = copyArray(game.state.winningNumbers);

    var userStrong = game.player.selectedStrong;
    var winStrong = game.state.winningStrong;

    var userHits = buildHitArray(userNums, winNums);

    /* result divs:*/
    var strongText = strongMatch ? 'Matched' : 'Not matched';

    els.result.innerHTML =
        '<div><strong>Winning strong:</strong> ' + chipsHtml([winStrong]) + '</div>' +
        '<div><strong>Your strong:</strong> ' + chipsHtml([userStrong], [strongMatch]) + '</div>' +
        '<div class="mt-2"><strong>Winning numbers:</strong> ' + chipsHtml(winNums) + '</div>' +
        '<div><strong>Your numbers:</strong> ' + chipsHtml(userNums, userHits) + '</div>' +
        '<div><strong>Round Summary :</div>' +
        '<div><strong>Successful guesses :</strong> ' + matchedCount + '</div > ' + 
        '<div><strong>Strong number :</strong> ' + strongText + '</div > ' + 
        '<div><strong>Prize :</strong> ' + prize + '</div > ' + 
        '<div><strong>Money now:</strong> ' + game.player.money + '</div>';
}

function chipsHtml(values, hitFlags) {
    /* If hitFlags is missing, treat all as "neutral" (success style) for display simplicity. */
    var html = '';
    for (var i = 0; i < values.length; i++) {
        var isHit = true;
        if (hitFlags && typeof hitFlags[i] !== 'undefined') isHit = !!hitFlags[i];

        var cls = isHit ? 'text-bg-success' : 'text-bg-secondary';
        html += '<span class="badge rounded-pill ' + cls + ' badge-space">' + values[i] + '</span>';
    }
    return html;
}


/* Prize rules*/
function calculatePrize(matchedCount, strongMatch) {
    if (matchedCount === 6 && strongMatch) return 1000;
    if (matchedCount === 6 && !strongMatch) return 600;
    if (matchedCount === 4 && strongMatch) return 400;
    return 0;
}

/* =========================================================
   Utilities - build the page lottery 
   ========================================================= */

function generateUniqueNumbers(count, min, max) {
    var arr = [];
    while (arr.length < count) {
        var n = randomInt(min, max);
        if (indexOfNumber(arr, n) === -1) arr.push(n);
    }
    return arr;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function countMatches(userArr, winArr) {
    var count = 0;
    for (var i = 0; i < userArr.length; i++) {
        if (indexOfNumber(winArr, userArr[i]) !== -1) count += 1;
    }
    return count;
}

function buildHitArray(valuesToMark, winValues) {
    var hits = [];
    for (var i = 0; i < valuesToMark.length; i++) {
        hits.push(indexOfNumber(winValues, valuesToMark[i]) !== -1);
    }
    return hits;
}

function indexOfNumber(arr, value) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === value) return i;
    }
    return -1;
}

function copyArray(arr) {
    var copy = [];
    for (var i = 0; i < arr.length; i++) copy.push(arr[i]);
    return copy;
}

function arrayToString(arr, sep) {
    var s = '';
    for (var i = 0; i < arr.length; i++) {
        if (i > 0) s += sep;
        s += String(arr[i]);
    }
    return s;
}

function removeAt(arr, idx) {
    /* Remove one element without splice() */
    for (var i = idx; i < arr.length - 1; i++) {
        arr[i] = arr[i + 1];
    }
    arr.pop();
}

