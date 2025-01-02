const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const canvasColor = document.getElementById('canvasColor');
const lineWidthSlider = document.getElementById('lineWidthSlider');
const lineWidthValue = document.getElementById('lineWidthValue');
const eraserButton = document.getElementById('eraserButton');
const undoButton = document.getElementById('undoButton');
const clearButton = document.getElementById('clearButton');
const saveButton = document.getElementById('saveButton');

// State management
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let drawingHistory = [];
let historyStep = -1;
let isEraser = false;
let lastColor = '#000000';
let lastLineWidth = 2;

// Initialize canvas size
function initCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = 400;

    if (historyStep >= 0) {
        const img = new Image();
        img.src = drawingHistory[historyStep];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    } else {
        clearCanvas();
    }
}

// Clear canvas and optionally save to history
function clearCanvas(save = true) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (save) saveToHistory();
}

// Save canvas state to history
function saveToHistory() {
    historyStep++;
    drawingHistory = drawingHistory.slice(0, historyStep);  // Truncate future history
    drawingHistory.push(canvas.toDataURL());
}

// Undo last drawing action
function undo() {
    if (historyStep > 0) {
        historyStep--;
        const img = new Image();
        img.src = drawingHistory[historyStep];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    } else {
        clearCanvas(false);  // Clear canvas on first state
    }
}

// Drawing handlers
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
}

function draw(e) {
    if (!isDrawing) return;

    const [currentX, currentY] = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    [lastX, lastY] = [currentX, currentY];
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveToHistory();
    }
}

// Get coordinates for mouse and touch events
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    return [x, y];
}

// Tool controls
colorPicker.addEventListener('change', (e) => {
    lastColor = e.target.value;
    if (!isEraser) ctx.strokeStyle = lastColor;
});

canvasColor.addEventListener('change', (e) => {
    if (e.target.value !== 'transparent') {
        ctx.fillStyle = e.target.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height); 
    } else {
        clearCanvas(false);
    }
    saveToHistory();
});

lineWidthSlider.addEventListener('input', (e) => {
    lastLineWidth = e.target.value;
    lineWidthValue.textContent = `${lastLineWidth}px`;
    if (!isEraser) ctx.lineWidth = lastLineWidth;
});

// Eraser functionality
eraserButton.addEventListener('click', () => {
    isEraser = !isEraser;
    eraserButton.classList.toggle('bg-blue-500', isEraser);
    eraserButton.classList.toggle('text-white', isEraser);
    eraserButton.classList.toggle('text-gray-700', !isEraser);
    eraserButton.classList.toggle('hover:bg-blue-600', isEraser);

    ctx.strokeStyle = isEraser ? canvasColor.value : lastColor;
    ctx.lineWidth = isEraser ? lastLineWidth * 2 : lastLineWidth;
});

undoButton.addEventListener('click', undo);

clearButton.addEventListener('click', () => {
    clearCanvas();
});

saveButton.addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png'); 
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'signature.png';
    link.click();
});

// Handle window resize
window.addEventListener('resize', initCanvas);
initCanvas();

// Event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
});
canvas.addEventListener('touchend', stopDrawing);

// Saving canvas data to local storage
window.addEventListener('beforeunload', () => {
    localStorage.setItem('signature', canvas.toDataURL());
});
