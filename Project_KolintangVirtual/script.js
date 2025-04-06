const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const notes = {
  'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23,
  'G': 392.00, 'A': 440.00, 'B': 493.88, 'C2': 523.25
};

let sequence = [];
let playerSequence = [];
let score = 0;
let round = 0;
let isPlaying = false;
let currentMode = 'learn';
let currentLesson = 0;

let currentLanguage = 'en';

const translations = {
  en: {
    title: "Kolintang Virtual Experience",
    history: "History",
    learning: "Learning Mode",
    game: "Game Mode",
    theory: "Music Theory",
    startGame: "Start Game",
    score: "Score",
    gameInstructions: "Follow the sequence! Watch the highlighted bars and repeat the pattern.",
    keyboardInstructions: "Use your keyboard keys (1-8) or click the bars to play",
    historyTitle: "History of Kolintang",
    // English texts
  },
  id: {
    title: "Pengalaman Virtual Kolintang",
    history: "Sejarah",
    learning: "Mode Pembelajaran",
    game: "Mode Permainan", 
    theory: "Teori Musik",
    startGame: "Mulai Permainan",
    score: "Skor",
    gameInstructions: "Ikuti urutannya! Perhatikan bar yang disorot dan ulangi polanya.",
    keyboardInstructions: "Gunakan tombol keyboard (1-8) atau klik bar untuk bermain",
    historyTitle: "Sejarah Kolintang",
    // Indonesian texts
  }
};

const lessons = [
  {
    title: "Basic Notes",
    content: "Learn the basic Do-Re-Mi notes. Click each bar to hear its sound.",
    notes: ["C", "D", "E"]
  },
  {
    title: "Middle Range",
    content: "Practice the middle range notes: Fa-Sol-La",
    notes: ["F", "G", "A"]
  },
  {
    title: "Full Scale",
    content: "Now try the complete scale!",
    notes: ["C", "D", "E", "F", "G", "A", "B", "C2"]
  }
];

function toggleLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'id' : 'en';
  updateLanguage();
}

function updateLanguage() {
  const texts = translations[currentLanguage];
  
  document.querySelector('h1').textContent = texts.title;
  document.querySelector('.tab-button[onclick="showSection(\'history\')"]').textContent = texts.history;
  document.querySelector('.tab-button[onclick="showSection(\'learn\')"]').textContent = texts.learning;
  document.querySelector('.tab-button[onclick="showSection(\'game\')"]').textContent = texts.game;
  document.querySelector('.tab-button[onclick="showSection(\'theory\')"]').textContent = texts.theory;
  
  document.getElementById('startGame').textContent = texts.startGame;
  document.getElementById('gameInstructions').innerHTML = `
    <p>${texts.gameInstructions}</p>
    <p>${texts.keyboardInstructions}</p>
  `;
  
  document.querySelector('.history-section h2').textContent = texts.historyTitle;
}

function setMode(mode) {
  currentMode = mode;
  document.getElementById('gameInstructions').style.display = mode === 'game' ? 'block' : 'none';
  document.getElementById('scoreDisplay').style.display = mode === 'game' ? 'block' : 'none';
  document.getElementById('startGame').style.display = mode === 'game' ? 'block' : 'none';
  document.getElementById('lessonContent').style.display = mode === 'learn' ? 'block' : 'none';
  if (mode === 'learn') {
    updateLesson();
  }
}

function updateLesson() {
  const lesson = lessons[currentLesson];
  document.getElementById('currentLesson').innerHTML = `
    <h3>${lesson.title}</h3>
    <p>${lesson.content}</p>
  `;
}

function nextLesson() {
  currentLesson = (currentLesson + 1) % lessons.length;
  updateLesson();
}

function playNote(frequency) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  
  gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 1);
}

function highlightBar(note) {
  const bar = document.querySelector(`[data-note="${note}"]`);
  bar.classList.add('highlight');
  setTimeout(() => bar.classList.remove('highlight'), 500);
}

function updateSequenceDisplay() {
  const sequenceDiv = document.getElementById('sequence');
  sequenceDiv.innerHTML = '';
  sequence.forEach((note, index) => {
    const noteEl = document.createElement('div');
    noteEl.className = 'sequence-note';
    if (index < playerSequence.length) {
      noteEl.classList.add(playerSequence[index] === sequence[index] ? 'correct' : 'wrong');
    }
    noteEl.textContent = note[0];
    sequenceDiv.appendChild(noteEl);
  });
}

function playSequence() {
  isPlaying = true;
  sequence.forEach((note, index) => {
    setTimeout(() => {
      playNote(notes[note]);
      highlightBar(note);
      if (index === sequence.length - 1) {
        isPlaying = false;
      }
    }, index * 1000);
  });
}

function addToSequence() {
  const noteNames = Object.keys(notes);
  const randomNote = noteNames[Math.floor(Math.random() * noteNames.length)];
  sequence.push(randomNote);
}

function startRound() {
  playerSequence = [];
  addToSequence();
  updateSequenceDisplay();
  setTimeout(playSequence, 1000);
}

function checkSequence() {
  const lastIndex = playerSequence.length - 1;
  if (playerSequence[lastIndex] !== sequence[lastIndex]) {
    alert(`Game Over! Final Score: ${score}`);
    sequence = [];
    playerSequence = [];
    score = 0;
    round = 0;
    document.getElementById('scoreValue').textContent = score;
    return false;
  }
  
  if (playerSequence.length === sequence.length) {
    score += 10;
    document.getElementById('scoreValue').textContent = score;
    round++;
    setTimeout(startRound, 1000);
    return true;
  }
  return true;
}

document.querySelectorAll('.bar').forEach(bar => {
  bar.addEventListener('click', () => {
    if (isPlaying) return;
    
    const note = bar.dataset.note;
    playNote(notes[note]);
    highlightBar(note);
    
    if (currentMode === 'game' && sequence.length > 0) {
      playerSequence.push(note);
      updateSequenceDisplay();
      checkSequence();
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (isPlaying) return;
  
  const key = e.key;
  const bar = document.querySelector(`[data-key="${key}"]`);
  if (bar) {
    const note = bar.dataset.note;
    playNote(notes[note]);
    highlightBar(note);
    
    if (currentMode === 'game' && sequence.length > 0) {
      playerSequence.push(note);
      updateSequenceDisplay();
      checkSequence();
    }
  }
});

document.getElementById('startGame').addEventListener('click', () => {
  sequence = [];
  playerSequence = [];
  score = 0;
  round = 0;
  document.getElementById('scoreValue').textContent = score;
  startRound();
});

// history
showSection('history');

function showSection(section) {
  document.querySelectorAll('.content-section').forEach(el => {
    el.style.display = 'none';
  });
  
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  let sectionToShow;
  let modeToSet;
  
  switch(section) {
    case 'history':
      sectionToShow = document.getElementById('historySection');
      modeToSet = 'history';
      break;
    case 'learn':
      sectionToShow = document.getElementById('lessonContent');
      modeToSet = 'learn';
      break;
    case 'game':
      sectionToShow = document.querySelector('.game-controls').parentElement;
      modeToSet = 'game';
      break;
    case 'theory':
      sectionToShow = document.getElementById('theorySection');
      modeToSet = 'theory';
      break;
  }
  
  if (sectionToShow) {
    sectionToShow.style.display = 'block';
  }
  
  document.querySelector(`button[onclick="showSection('${section}')"]`).classList.add('active');
  
  if (modeToSet !== 'history') {
    setMode(modeToSet);
  }
}

function showTheoryContent(content) {
  document.querySelectorAll('.theory-content').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll('.theory-tab').forEach(el => {
    el.classList.remove('active');
  });
  
  document.getElementById(`${content}Content`).classList.add('active');
  document.querySelector(`button[onclick="showTheoryContent('${content}')"]`).classList.add('active');
}

function playChord(noteArray) {
  noteArray.forEach((note, index) => {
    setTimeout(() => {
      playNote(notes[note]);
      highlightBar(note);
    }, index * 100);
  });
}


// learning mode
setMode('learn');
updateLesson();
document.addEventListener('DOMContentLoaded', () => {
  updateLanguage();
});