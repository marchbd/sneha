
/* =========================================
   MADAM JII PUZZLE
   Sliding Image Puzzle
========================================= */

"use strict";


/* =========================================
   1. CONFIGURATION
========================================= */

const CONFIG = {
    gridSize: 3,
    gameDuration: 9 * 60 * 1000,
    imagePath: "assets/madam-image.jpeg",
    musicPath: "assets/background-music.mp3",
    transitionDuration: 2400,
    particleCount: 28
};


/* =========================================
   2. DOM ELEMENTS
========================================= */

const elements = {
    introScreen: document.getElementById("intro-screen"),
    startButton: document.getElementById("start-button"),

    previewScreen: document.getElementById("preview-screen"),
    previewImage: document.getElementById("preview-image"),
    shuffleStartButton: document.getElementById("shuffle-start-button"),

    transitionOverlay: document.getElementById("transition-overlay"),
    fragmentContainer: document.getElementById("fragment-container"),

    gameScreen: document.getElementById("game-screen"),
    puzzleBoard: document.getElementById("puzzle-board"),

    referenceButton: document.getElementById("reference-button"),
    referenceImage: document.getElementById("reference-image"),

    timer: document.getElementById("timer"),
    timerCard: document.getElementById("timer-card"),

    moveCount: document.getElementById("move-count"),
    progressCount: document.getElementById("progress-count"),
    gameMessage: document.getElementById("game-message"),

    restartButton: document.getElementById("restart-button"),

    musicButton: document.getElementById("music-button"),
    musicIcon: document.getElementById("music-icon"),
    musicLabel: document.getElementById("music-label"),

    imageModal: document.getElementById("image-modal"),
    victoryModal: document.getElementById("victory-modal"),
    timeoutModal: document.getElementById("timeout-modal"),
    revealModal: document.getElementById("reveal-modal"),

    finalStats: document.getElementById("final-stats"),

    playAgainButton: document.getElementById("play-again-button"),
    retryButton: document.getElementById("retry-button"),
    revealButton: document.getElementById("reveal-button"),
    revealPlayAgainButton: document.getElementById(
        "reveal-play-again-button"
    ),

    backgroundMusic: document.getElementById("background-music"),

    particleContainer: document.getElementById("particle-container"),

    uploadImageButton: document.getElementById("upload-image-button"),

    defaultImageButton: document.getElementById("default-image-button"),

    imageUploadInput: document.getElementById("image-upload-input"),

    cameraInput: document.getElementById("camera-input"),
    takePhotoButton: document.getElementById("take-photo-button")
        
};


/* =========================================
   3. GAME STATE
========================================= */

const TOTAL_TILES = CONFIG.gridSize ** 2;
const EMPTY_TILE = TOTAL_TILES - 1;

// The image currently being used by the puzzle.
let currentImagePath = CONFIG.imagePath;

// Holds the temporary browser URL for a custom image.
let customImageUrl = null;

let board = [];
let moveCount = 0;

let timeRemaining = CONFIG.gameDuration;
let deadline = null;
let timerInterval = null;

let gameStarted = false;
let gameOver = false;
let transitionRunning = false;

let musicMuted = false;
let audioStarted = false;


/* =========================================
   4. INITIALIZE GAME
========================================= */

function initializeGame() {

    // Prepare the puzzle board.
    board = Array.from(
        { length: TOTAL_TILES },
        (_, index) => index
    );

    // Prepare the background music.
    elements.backgroundMusic.loop = true;
    elements.backgroundMusic.volume = 0.35;

    // Load the image.
    elements.referenceImage.src = currentImagePath;

    // Start ambient particles.
    createFloatingParticles();

    // Render the initial board.
    renderBoard();

    // Initialize the timer display.
    updateTimerDisplay();

    // Initialize statistics.
    updateStatistics();

    // Set up all interactions.
    attachEventListeners();

    console.log("Madam Jii Puzzle initialized successfully! 💗");
}


/* =========================================
   5. IMAGE PRELOADING
========================================= */

const puzzleImage = new Image();

puzzleImage.src = CONFIG.imagePath;

puzzleImage.addEventListener("load", () => {
    console.log("Puzzle image loaded successfully! ✨");
});

puzzleImage.addEventListener("error", () => {
    console.error(
        "Could not load the puzzle image. Check the image filename and path."
    );

    elements.gameMessage.textContent =
        "Oops! The picture could not be loaded. Please check the image file.";
});


/* =========================================
   6. EVENT LISTENERS
========================================= */

function attachEventListeners() {

    // Start the game.
    elements.startButton.addEventListener(
        "click",
        startExperience
    );

    // Continue to the puzzle only after the full image preview.
    elements.shuffleStartButton.addEventListener(
        "click",
        beginPuzzleFromPreview
    );

    // Open the image picker.
    elements.uploadImageButton.addEventListener("click", () => {
        elements.imageUploadInput.click();
    });

    // Handle the selected image.
    elements.imageUploadInput.addEventListener(
        "change",
        handleCustomImageUpload
    );


    elements.takePhotoButton.addEventListener("click", () => {
        elements.cameraInput.click();
    });

    elements.cameraInput.addEventListener(
        "change",
        handleCustomImageUpload
    );



    // Restore the original photo.
    elements.defaultImageButton.addEventListener(
        "click",
        restoreDefaultImage
    );


    // Click a puzzle tile.
    elements.puzzleBoard.addEventListener(
        "click",
        handleBoardClick
    );

    // Restart the puzzle.
    elements.restartButton.addEventListener(
        "click",
        restartGame
    );

    // Music controls.
    elements.musicButton.addEventListener(
        "click",
        toggleMusic
    );

    // Open original image preview.
    elements.referenceButton.addEventListener(
        "click",
        openImagePreview
    );

    // Close modals when their close buttons are clicked.
    document.querySelectorAll("[data-close-modal]").forEach(button => {
        button.addEventListener("click", closeImageModals);
    });

    // Victory screen: play again.
    elements.playAgainButton.addEventListener(
        "click",
        restartGame
    );

    // Timeout screen: retry.
    elements.retryButton.addEventListener(
        "click",
        restartGame
    );

    // Timeout screen: reveal image.
    elements.revealButton.addEventListener(
        "click",
        revealOriginalImage
    );

    // Reveal screen: play again.
    elements.revealPlayAgainButton.addEventListener(
        "click",
        restartGame
    );

    // Close image previews with Escape.
    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeImageModals();
        }

    });

}


/* =========================================
   7. START EXPERIENCE
========================================= */

async function startExperience() {

    if (transitionRunning || gameStarted) {
        return;
    }

    // Start music from the user's click, then preview the exact image
    // that will be shuffled into the puzzle.
    await startMusic();
    showImagePreviewStage();

}


function showImagePreviewStage() {

    stopTimer();
    gameStarted = false;
    gameOver = false;
    transitionRunning = false;

    // Use the currently selected image (default, upload, or camera).
    elements.previewImage.src = currentImagePath;
    elements.referenceImage.src = currentImagePath;

    elements.introScreen.hidden = true;
    elements.gameScreen.hidden = true;
    elements.transitionOverlay.hidden = true;
    elements.transitionOverlay.classList.remove("active");
    elements.previewScreen.hidden = false;

    // Reset the countdown without starting it.
    timeRemaining = CONFIG.gameDuration;
    deadline = null;
    updateTimerDisplay();

}


function beginPuzzleFromPreview() {

    if (transitionRunning) {
        return;
    }

    transitionRunning = true;
    elements.shuffleStartButton.disabled = true;
    runCinematicTransition();

}


/* =========================================
   8. BACKGROUND MUSIC
========================================= */

async function startMusic() {

    if (musicMuted) {
        return;
    }

    try {

        elements.backgroundMusic.currentTime = 0;

        await elements.backgroundMusic.play();

        audioStarted = true;

        updateMusicButton();

    } catch (error) {

        console.warn(
            "Music playback was blocked or the audio file could not be loaded.",
            error
        );

        elements.gameMessage.textContent =
            "Your music could not start. Check the audio file and try again.";

    }

}


function toggleMusic() {

    musicMuted = !musicMuted;

    if (musicMuted) {

        elements.backgroundMusic.pause();

    } else {

        elements.backgroundMusic.play()
            .then(() => {
                audioStarted = true;
            })
            .catch(error => {
                console.warn("Could not resume music:", error);
            });

    }

    updateMusicButton();

}


function updateMusicButton() {

    elements.musicIcon.textContent =
        musicMuted ? "♪" : "♫";

    elements.musicLabel.textContent =
        musicMuted ? "Music off" : "Music on";

    elements.musicButton.setAttribute(
        "aria-label",
        musicMuted
            ? "Play background music"
            : "Mute background music"
    );

    elements.musicButton.setAttribute(
        "aria-pressed",
        String(!musicMuted)
    );

}


/* =========================================
   9. CINEMATIC TRANSITION
========================================= */

function runCinematicTransition() {

    elements.transitionOverlay.classList.add("active");

    // Create particles that burst out from the center.
    createTransitionFragments();

    // Hide the opening screen after the transition begins.
    window.setTimeout(() => {

        elements.introScreen.hidden = true;
        elements.previewScreen.hidden = true;

    }, 350);


    // Reveal the game after the cinematic animation.
    window.setTimeout(() => {

        elements.transitionOverlay.classList.remove("active");

        elements.transitionOverlay.hidden = true;

        elements.gameScreen.hidden = false;

        // Reset both buttons for the next play-through.
        elements.startButton.disabled = false;
        elements.shuffleStartButton.disabled = false;

        // Prepare a fresh, solvable puzzle.
        prepareNewPuzzle();

        // Start the timer.
        startTimer();

        gameStarted = true;

        transitionRunning = false;

    }, CONFIG.transitionDuration);

}


/* =========================================
   10. CINEMATIC FRAGMENTS
========================================= */

function createTransitionFragments() {

    elements.fragmentContainer.replaceChildren();

    const fragmentCount = 90;

    for (let i = 0; i < fragmentCount; i++) {

        const fragment = document.createElement("span");

        fragment.className = "transition-fragment";

        // Start each fragment near the screen center.
        fragment.style.left = `${45 + Math.random() * 10}%`;
        fragment.style.top = `${45 + Math.random() * 10}%`;

        const angle = Math.random() * Math.PI * 2;

        const distance = 100 + Math.random() * 600;

        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        fragment.style.setProperty(
            "--fragment-x",
            `${x}px`
        );

        fragment.style.setProperty(
            "--fragment-y",
            `${y}px`
        );

        fragment.style.setProperty(
            "--fragment-rotation",
            `${Math.random() * 720 - 360}deg`
        );

        fragment.style.animationDelay =
            `${Math.random() * 0.35}s`;

        elements.fragmentContainer.appendChild(fragment);

    }

}


/* =========================================
   11. CREATE FLOATING PARTICLES
========================================= */

function createFloatingParticles() {

    elements.particleContainer.replaceChildren();

    const symbols = ["✧", "✦", "⋆", "·", "✺", "⟡", "⌁"];

    const emojis = ["💗", "😇", "✨", "💖", "🥳", "😊"];

    for (let i = 0; i < CONFIG.particleCount; i++) {

        const particle = document.createElement("span");

        particle.className = "floating-particle";

        const useEmoji = Math.random() < 0.4;

        particle.textContent = useEmoji
            ? emojis[Math.floor(Math.random() * emojis.length)]
            : symbols[Math.floor(Math.random() * symbols.length)];

        if (useEmoji) {
            particle.classList.add("floating-emoji");
        }

        particle.style.left = `${Math.random() * 100}%`;

        particle.style.fontSize =
            `${10 + Math.random() * 14}px`;

        particle.style.animationDuration =
            `${12 + Math.random() * 15}s`;

        particle.style.animationDelay =
            `${-Math.random() * 25}s`;

        elements.particleContainer.appendChild(particle);

    }

}


/* =========================================
   12. PREPARE NEW PUZZLE
========================================= */

function prepareNewPuzzle() {

    stopTimer();

    gameOver = false;

    moveCount = 0;

    timeRemaining = CONFIG.gameDuration;

    deadline = null;

    // Start with the solved arrangement.
    board = Array.from(
        { length: TOTAL_TILES },
        (_, index) => index
    );

    // Shuffle using legal moves.
    shufflePuzzle();

    // Refresh the board and counters.
    renderBoard();

    updateStatistics();

    updateTimerDisplay();

    elements.timerCard.classList.remove("warning");

    elements.gameMessage.textContent =
        "One little move at a time, Madam Jii ✨";

    // Close any remaining game dialogs.
    closeAllModals();

}


/* =========================================
   13. SHUFFLE PUZZLE
========================================= */

function shufflePuzzle() {

    let emptyPosition = EMPTY_TILE;

    let previousEmptyPosition = -1;

    // More random legal moves make the puzzle harder.
    const shuffleMoves = 120;

    for (let i = 0; i < shuffleMoves; i++) {

        const neighbors = getAdjacentPositions(emptyPosition);

        // Avoid immediately undoing the previous move.
        const validNeighbors = neighbors.filter(
            position => position !== previousEmptyPosition
        );

        const choices = validNeighbors.length
            ? validNeighbors
            : neighbors;

        const chosenPosition =
            choices[Math.floor(Math.random() * choices.length)];

        // Swap the selected tile with the empty space.
        [
            board[emptyPosition],
            board[chosenPosition]
        ] = [
            board[chosenPosition],
            board[emptyPosition]
        ];

        previousEmptyPosition = emptyPosition;

        emptyPosition = chosenPosition;

    }

    // Never leave the puzzle solved at the start.
    if (isPuzzleSolved()) {
        shufflePuzzle();
    }

}


/* =========================================
   14. FIND ADJACENT POSITIONS
========================================= */

function getAdjacentPositions(position) {

    const row = Math.floor(position / CONFIG.gridSize);

    const col = position % CONFIG.gridSize;

    const neighbors = [];

    // Up.
    if (row > 0) {
        neighbors.push(position - CONFIG.gridSize);
    }

    // Down.
    if (row < CONFIG.gridSize - 1) {
        neighbors.push(position + CONFIG.gridSize);
    }

    // Left.
    if (col > 0) {
        neighbors.push(position - 1);
    }

    // Right.
    if (col < CONFIG.gridSize - 1) {
        neighbors.push(position + 1);
    }

    return neighbors;

}


/* =========================================
   15. RENDER PUZZLE BOARD
========================================= */

function renderBoard() {

    elements.puzzleBoard.replaceChildren();

    const backgroundSize =
        `${CONFIG.gridSize * 100}% ${CONFIG.gridSize * 100}%`;

    board.forEach((tileNumber, position) => {

        const tile = document.createElement("button");

        tile.type = "button";

        tile.className = "puzzle-tile";

        tile.dataset.position = String(position);

        tile.dataset.tile = String(tileNumber);

        const isEmpty = tileNumber === EMPTY_TILE;

        if (isEmpty) {

            tile.classList.add("empty-tile");

            tile.disabled = true;

            tile.setAttribute("aria-label", "Empty space");

        } else {

            const originalRow =
                Math.floor(tileNumber / CONFIG.gridSize);

            const originalCol =
                tileNumber % CONFIG.gridSize;

            tile.style.backgroundImage =
                `url("${currentImagePath}")`;

            tile.style.backgroundSize = backgroundSize;

            tile.style.backgroundPosition =
                `${originalCol * 50}% ${originalRow * 50}%`;

            tile.setAttribute(
                "aria-label",
                `Image tile ${tileNumber + 1}`
            );

        }

        if (!isEmpty && isCorrectPosition(position)) {

            tile.classList.add("correct");

        }

        if (!isEmpty && isMovable(position)) {

            tile.classList.add("movable");

        }

        elements.puzzleBoard.appendChild(tile);

    });

}


/* =========================================
   16. HANDLE TILE CLICKS
========================================= */

function handleBoardClick(event) {

    if (!gameStarted || gameOver) {
        return;
    }

    const tile = event.target.closest(".puzzle-tile");

    if (!tile || !elements.puzzleBoard.contains(tile)) {
        return;
    }

    const position = Number(tile.dataset.position);

    if (!Number.isInteger(position)) {
        return;
    }

    moveTile(position);

}


/* =========================================
   17. MOVE TILE
========================================= */

function moveTile(position) {

    if (gameOver) {
        return;
    }

    const emptyPosition = board.indexOf(EMPTY_TILE);

    // Only adjacent tiles can move.
    if (!getAdjacentPositions(emptyPosition).includes(position)) {
        return;
    }

    // Swap the selected tile with the empty position.
    [
        board[position],
        board[emptyPosition]
    ] = [
        board[emptyPosition],
        board[position]
    ];

    moveCount++;

    // Redraw the board.
    renderBoard();

    updateStatistics();

    elements.gameMessage.textContent =
        getEncouragementMessage();

    // Trigger a tiny sparkle.
    createPuzzleSparkle();

    // Check for victory.
    if (isPuzzleSolved()) {

        finishGame(true);

    }

}


/* =========================================
   18. CHECK MOVABLE TILES
========================================= */

function isMovable(position) {

    const emptyPosition = board.indexOf(EMPTY_TILE);

    return getAdjacentPositions(emptyPosition).includes(position);

}


/* =========================================
   19. CHECK CORRECT POSITIONS
========================================= */

function isCorrectPosition(position) {

    return board[position] === position;

}


/* =========================================
   20. CHECK PUZZLE COMPLETION
========================================= */

function isPuzzleSolved() {

    return board.every(
        (tileNumber, position) => tileNumber === position
    );

}


/* =========================================
   21. UPDATE STATISTICS
========================================= */

function updateStatistics() {

    elements.moveCount.textContent = String(moveCount);

    // Count correctly positioned numbered tiles.
    // The empty tile is excluded.
    let correctTiles = 0;

    for (let i = 0; i < EMPTY_TILE; i++) {

        if (board[i] === i) {
            correctTiles++;
        }

    }

    elements.progressCount.textContent =
        `${correctTiles} / ${EMPTY_TILE}`;

}


/* =========================================
   22. ENCOURAGEMENT MESSAGES
========================================= */

function getEncouragementMessage() {

    const messages = [
        "Looking good, Madam ji! ✨",
        "One step closer! ♡",
        "You're getting there! 💗",
        "That was a clever move!",
        "Keep going, pretty genius! ✨",
        "Piece by piece, you've got this! ♡",
        "The picture is coming together!",
        "A little patience goes a long way. 💗"
    ];

    return messages[
        Math.floor(Math.random() * messages.length)
    ];

}


/* =========================================
   23. PUZZLE SPARKLE
========================================= */

function createPuzzleSparkle() {

    const sparkle = document.createElement("span");

    sparkle.className = "puzzle-sparkle";

    sparkle.textContent =
        Math.random() > 0.5 ? "✧" : "✦";

    sparkle.style.left = `${15 + Math.random() * 70}%`;

    sparkle.style.top = `${15 + Math.random() * 70}%`;

    elements.puzzleBoard.parentElement
        .querySelector(".puzzle-sparkles")
        .appendChild(sparkle);

    sparkle.addEventListener("animationend", () => {
        sparkle.remove();
    }, { once: true });

}


/* =========================================
   24. START TIMER
========================================= */

function startTimer() {

    stopTimer();

    timeRemaining = CONFIG.gameDuration;

    // Use a deadline to avoid accumulating interval drift.
    deadline = Date.now() + timeRemaining;

    updateTimerDisplay();

    timerInterval = window.setInterval(() => {

        if (gameOver || deadline === null) {
            stopTimer();
            return;
        }

        timeRemaining = Math.max(
            0,
            deadline - Date.now()
        );

        updateTimerDisplay();

        // Highlight the timer during the final minute.
        if (timeRemaining <= 60_000) {

            elements.timerCard.classList.add("warning");

        }

        if (timeRemaining <= 0) {

            finishGame(false);

        }

    }, 200);

}


/* =========================================
   25. STOP TIMER
========================================= */

function stopTimer() {

    if (timerInterval !== null) {

        window.clearInterval(timerInterval);

        timerInterval = null;

    }

}


/* =========================================
   26. UPDATE TIMER DISPLAY
========================================= */

function updateTimerDisplay() {

    const totalSeconds = Math.ceil(
        timeRemaining / 1000
    );

    const minutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;

    const formattedTime =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;

    elements.timer.textContent = formattedTime;

    elements.timer.dateTime = `PT${minutes}M${seconds}S`;

    elements.timer.setAttribute(
        "aria-label",
        `${minutes} minutes and ${seconds} seconds remaining`
    );

}


/* =========================================
   27. FINISH GAME
========================================= */

function finishGame(won) {

    if (gameOver) {
        return;
    }

    gameOver = true;

    stopTimer();

    elements.timerCard.classList.remove("warning");

    if (won) {

        showVictoryScreen();

    } else {

        showTimeoutScreen();

    }

}


/* =========================================
   28. VICTORY SCREEN
========================================= */


function showVictoryScreen() {

    closeAllModals();

    // Display the uploaded photo on the congratulations screen.
    const victoryImage = elements.victoryModal.querySelector("img");

    if (victoryImage) {
        victoryImage.src = currentImagePath;
    }

    elements.finalStats.textContent =
        `Solved in ${moveCount} moves • ` +
        `${formatDuration(CONFIG.gameDuration - timeRemaining)} taken ✨`;

    elements.victoryModal.hidden = false;

    elements.gameMessage.textContent =
        "YOU DID IT, MADAM JII! 💗";

    // Small celebratory burst.
    createVictoryParticles();

}



/* =========================================
   29. FORMAT DURATION
========================================= */

function formatDuration(milliseconds) {

    const totalSeconds = Math.floor(
        Math.max(0, milliseconds) / 1000
    );

    const minutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;

    if (minutes === 0) {
        return `${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;

}


/* =========================================
   30. VICTORY PARTICLES
========================================= */

function createVictoryParticles() {

    const symbols = ["♡", "✦", "✧", "♥","😊","😇"];

    for (let i = 0; i < 24; i++) {

        const particle = document.createElement("span");

        particle.className = "floating-particle";

        particle.textContent =
            symbols[Math.floor(Math.random() * symbols.length)];

        particle.style.left = `${Math.random() * 100}%`;

        particle.style.bottom = `${Math.random() * 20}%`;

        particle.style.fontSize =
            `${15 + Math.random() * 15}px`;

        particle.style.animationDuration =
            `${5 + Math.random() * 5}s`;

        particle.style.animationDelay =
            `${Math.random() * 1.5}s`;

        elements.particleContainer.appendChild(particle);

        particle.addEventListener("animationend", () => {
            particle.remove();
        }, { once: true });

    }

}


/* =========================================
   31. TIMEOUT SCREEN
========================================= */

function showTimeoutScreen() {

    closeAllModals();

    elements.timeoutModal.hidden = false;

    elements.gameMessage.textContent =
        "Time's up! Want to give it another try? ♡";

}


/* =========================================
   32. IMAGE PREVIEW
========================================= */


function openImagePreview() {

    if (gameOver) {
        return;
    }

    // Find the image inside the preview modal.
    const previewImage = elements.imageModal.querySelector("img");

    // Display the currently selected puzzle image.
    if (previewImage) {
        previewImage.src = currentImagePath;
    }

    // Open the preview modal.
    elements.imageModal.hidden = false;

}


function closeImageModals() {

    elements.imageModal.hidden = true;

    elements.revealModal.hidden = true;

}


function closeAllModals() {

    elements.imageModal.hidden = true;

    elements.victoryModal.hidden = true;

    elements.timeoutModal.hidden = true;

    elements.revealModal.hidden = true;

}


/* =========================================
   33. REVEAL ORIGINAL IMAGE
========================================= */

function revealOriginalImage() {

    elements.timeoutModal.hidden = true;

    elements.revealModal.hidden = false;

}


/* =========================================
   34. RESTART GAME
========================================= */

function restartGame() {

    closeAllModals();

    // Return to the game screen.
    elements.introScreen.hidden = true;

    elements.transitionOverlay.hidden = true;

    elements.transitionOverlay.classList.remove("active");

    elements.gameScreen.hidden = false;

    transitionRunning = false;

    gameStarted = true;

    // Prepare a fresh puzzle.
    prepareNewPuzzle();

    // Start a new nine-minute countdown.
    startTimer();

    // Resume music if it was not muted.
    if (!musicMuted) {

        elements.backgroundMusic.play()
            .then(() => {
                audioStarted = true;
            })
            .catch(error => {
                console.warn("Music could not resume:", error);
            });

    }

}


function handleCustomImageUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        elements.imageUploadInput.value = "";
        elements.cameraInput.value = "";
        return;
    }

    const newImageUrl = URL.createObjectURL(file);
    const testImage = new Image();

    testImage.onload = () => {
        // Remove the previous custom image URL, if any.
        if (customImageUrl) {
            URL.revokeObjectURL(customImageUrl);
        }

        customImageUrl = newImageUrl;
        currentImagePath = customImageUrl;

        // Show the button for restoring the original image.
        elements.defaultImageButton.hidden = false;

        // Preview this exact custom photo before it is shuffled.
        showImagePreviewStage();

        elements.imageUploadInput.value = "";
        elements.cameraInput.value = "";
    };

    testImage.onerror = () => {
        URL.revokeObjectURL(newImageUrl);
        alert("Unable to load this image. Please try another one.");
        elements.imageUploadInput.value = "";
        elements.cameraInput.value = "";
    };

    testImage.src = newImageUrl;
}


function restoreDefaultImage() {
    // Release the custom image from memory.
    if (customImageUrl) {
        URL.revokeObjectURL(customImageUrl);
        customImageUrl = null;
    }

    // Restore the original image and preview it before shuffling.
    currentImagePath = CONFIG.imagePath;
    elements.referenceImage.src = currentImagePath;

    // Hide the restore button.
    elements.defaultImageButton.hidden = true;

    // Clear the file input.
    elements.imageUploadInput.value = "";

    showImagePreviewStage();
}



/* =========================================
   35. START THE GAME
========================================= */

initializeGame();
