# Lotto Game (HW – Client Side)



### Project overview



This project is a client-side Lotto game built with HTML + CSS (Grid/Flex + Media Queries) + JavaScript (DOM).

The user starts with a fixed amount of money, selects 1 strong number (1–7) and 6 unique numbers (1–37), pays for a ticket, and checks the round against the system draw. The game tracks the number of valid plays and stops (locks) when the user finishes or runs out of money.



### What we implemented (summary of the work)

##### 1\) UI structure (HTML)



Built a clean page layout with:



Title + stats area (money, ticket cost, valid plays)



Two selection boards (strong + numbers)



Picked values display (what the user selected)



Action buttons (check / finish)



Result area (winning vs user picks)



Added a dedicated host container for Bootstrap alerts (no permanent message area on the page).



Added two modals:



Welcome modal (shown immediately on load, explains rules)



Block modal (shown when the game ends or user cannot continue)



##### 2\) Responsive design (CSS)



Used CSS Grid for boards and layout, and Flex for top bar/stats.



Implemented three responsive ranges:



Phone (base)



Tablet (min-width breakpoint)



Above tablet (larger screens)



On small screens:



Reduced board columns to avoid crowding



Increased button size for easier tapping



Changed button accent color to purple (as requested)



Fixed the “selected button color changes twice” issue by ensuring the .is-selected style remains consistent even during :focus / :active.



##### 3\) Game logic (JavaScript)



Created a clear game model:



config (rules/constants)



state (round/system draw + flags + valid plays)



player (money + current selections)



Dynamically generated the boards (1–7 and 1–37) in JS (clean HTML, flexible logic).



Implemented instant feedback:



Clicking a number immediately updates selection styling + picked display (no delay).



Enforced game rules:



Exactly 6 unique numbers



Exactly 1 strong number (toggle behavior)



Ticket cost is deducted only when the user performs a valid check



Implemented prize rules:



6 + strong → 1000



6 without strong → 600



4 + strong → 400



else → 0



Implemented game flow:



Welcome modal blocks play until the user starts



Each round generates hidden winning values



After “Check” → result is shown, money updated, valid plays incremented



Game locks with a modal when finished or out of money



Optional deposit flow can unlock the game (if enabled)



##### 4\) Debugging approach



Added a conservative debug helper (no apply/spread).



Added a dedicated debug function to print only the system winning numbers (for testing).



Used Chrome DevTools (Elements/Console/Sources breakpoints) to diagnose:



selection styling vs focus/active CSS conflicts



incorrect state paths / undefined values



event handling and immediate UI updates



##### How to play



Open the page → the Welcome modal appears with the rules.



Click Start Game.



Select:



1 strong number (1–7)



6 unique numbers (1–37)



Click Check lottery to play the round.



Review the result (winning vs your picks).



Continue until you finish or run out of money (a blocking modal will appear).



# Function list (short purpose, logical order)



Below is a short explanation for each function, ordered by the app flow.



### Boot / Setup



dbg(...) – Optional console logger (controlled by DEBUG).



cacheElements() – Caches DOM elements for fast access.



initBootstrapModals() – Initializes Bootstrap modal instances (if Bootstrap exists).



wireEvents() – Connects button clicks to handlers.



### Alerts / Modals



showAlert(message, type, autoHideMs) – Shows a styled Bootstrap alert message.



escapeHtml(s) – Escapes HTML to prevent injection inside alerts/result text.



openWelcomeModal() – Opens the welcome modal (rules).



closeWelcomeModal() – Closes the welcome modal.



openBlockModal(mode, text) – Locks the game and shows the blocking modal.



updateBlockModalContent(mode, text) – Updates block modal text/money and UI sections.



### Board building



buildBoards() – Creates strong and number boards dynamically.



createCellButton(value, isStrong) – Creates a single number button with data-value.



readCellValue(buttonEl) – Reads and parses the number from data-value.



clearElement(el) – Clears all child nodes from an element.



### Rendering



renderStatus() – Updates stats (money, ticket cost, valid plays).



renderPicked() – Displays the user’s currently selected numbers/strong.



renderSelectionStyles() – Adds/removes is-selected class on buttons.



setControlsEnabled(isEnabled) – Enables/disables all controls based on game state.



#### Round lifecycle



startNewRound() – Generates winning values and resets user picks for a new round.



### User actions (handlers)



onStrongClicked(value) – Toggles the selected strong number.



onNumberClicked(value) – Adds/removes a number, enforces max of 6.



onCheckLotteryClicked() – Validates picks, charges ticket, checks results, awards prize, advances.



onFinishClicked() – Ends the game by user choice.



onDepositClicked() – Adds money and unlocks the game when possible.



#### Result / Prize



renderResult(matchedCount, strongMatch, prize) – Renders the full round result and summary.



chipsHtml(values, hitFlags) – Creates badge HTML for displaying numbers and hits.



calculatePrize(matchedCount, strongMatch) – Applies the prize rules.



#### Utilities (no join/slice/splice)



generateUniqueNumbers(count, min, max) – Generates unique random numbers.



randomInt(min, max) – Returns a random integer in range.



countMatches(userArr, winArr) – Counts matches between user numbers and winning numbers.



buildHitArray(valuesToMark, winValues) – Builds a boolean “hit” array for rendering.



indexOfNumber(arr, value) – Finds value index (loop-based).



removeAt(arr, idx) – Removes one element (loop-based, no splice).



copyArray(arr) – Copies an array (loop-based).



arrayToString(arr, sep) – Converts array to string (loop-based, no join).

