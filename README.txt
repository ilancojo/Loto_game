# Lotto Game (Client-Side HW)

A client-side Lotto game built with **HTML + CSS (Grid/Flex + Media Queries) + JavaScript (DOM)**.  
The player starts with a fixed amount of money, selects **1 strong number (1–7)** and **6 unique numbers (1–37)**, pays for a ticket, and checks the round against the system draw.

> **UI note:** The project uses **Bootstrap only for Alerts + Modals** (UI), while the game logic is plain JavaScript.

---

## Demo
- Run locally by opening `index.html` (or using Live Server / Visual Studio).
- A **Welcome modal** appears on load; the game starts only after clicking **Start Game**.

---

## Features
- ✅ Dynamic number boards (generated in JS):
  - Strong board: **1–7**
  - Numbers board: **1–37**
- ✅ Instant selection feedback (no “second-click color change”)
- ✅ Round flow:
  - System generates hidden winning values per round
  - “Check lottery” validates picks → charges ticket → calculates prize → shows results
  - “Valid plays” counts only completed valid rounds
- ✅ Game locking with modal:
  - Out of money → blocking modal with remaining money + restart guidance
  - Finish → blocking modal with restart guidance
- ✅ Responsive layout:
  - Phone / Tablet / Above tablet breakpoints
  - Small screens show fewer grid columns and larger buttons for comfortable tapping
  - Small-screen buttons use **purple accent**
- ✅ Conservative utilities (loop-based helpers for array search, removal, string formatting)

---

## Tech Stack
- **HTML5**
- **CSS3** (Grid, Flexbox, Media Queries)
- **JavaScript (ES5-style)** DOM + Events
- **Bootstrap 5** (UI components only: Alerts & Modals)

---

## Project Structure
```text
/
├─ index.html
├─ styles.css
└─ app.js
