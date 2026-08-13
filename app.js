const gallery = document.getElementById('gallery-container');
const statCount = document.getElementById('stat-count');
const statPinned = document.getElementById('stat-pinned');
const filterRow = document.getElementById('filter-row');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

let currentFilter = 'all';
let cardsData = [];

// Small helper: pull pinned ids from localStorage so pins survive a reload
function getPinned() {
    try {
        return JSON.parse(localStorage.getItem('pinnedMemories') || '[]');
    } catch (e) {
        return [];
    }
}

function setPinned(ids) {
    localStorage.setItem('pinnedMemories', JSON.stringify(ids));
}

function animateCount(el, target) {
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = current;
    }, 30);
}

function render() {
    const pinned = getPinned();
    const visible = currentFilter === 'pinned'
        ? cardsData.filter(c => pinned.includes(c.id))
        : cardsData;

    gallery.innerHTML = '';

    visible.forEach((card, i) => {
        const tilt = (i % 2 === 0 ? -1 : 1) * (2 + (i % 3));
        const isPinned = pinned.includes(card.id);

        const el = document.createElement('div');
        el.className = 'flashcard' + (isPinned ? ' is-pinned' : '');
        el.style.setProperty('--tilt', tilt + 'deg');

        el.innerHTML = `
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <img src="${card.image}" alt="${card.title}" loading="lazy">
              <p class="polaroid-caption">${card.title}</p>
              <button class="pin-btn" aria-label="Pin this memory" data-id="${card.id}">
                <svg viewBox="0 0 24 24" stroke-width="2"><path d="M12 2L15 9L22 10L17 15L18 22L12 18.5L6 22L7 15L2 10L9 9Z"/></svg>
              </button>
              <button class="expand-btn" aria-label="Enlarge photo" data-img="${card.image}">
                <svg viewBox="0 0 24 24" stroke-width="2"><path d="M4 9V4H9M20 9V4H15M4 15V20H9M20 15V20H15"/></svg>
              </button>
            </div>
            <div class="flashcard-back">
              <h3>${card.title}</h3>
              <p>${card.backText}</p>
            </div>
          </div>
        `;

        // Flip on tap, but ignore taps that land on the pin/expand buttons
        el.addEventListener('click', (e) => {
            if (e.target.closest('.pin-btn') || e.target.closest('.expand-btn')) return;
            el.classList.toggle('is-flipped');
        });

        el.querySelector('.pin-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const ids = getPinned();
            const idx = ids.indexOf(card.id);
            if (idx > -1) ids.splice(idx, 1); else ids.push(card.id);
            setPinned(ids);
            updateStats();
            render();
        });

        el.querySelector('.expand-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            lightboxImg.src = card.image;
            lightboxImg.alt = card.title;
            lightbox.classList.add('is-active');
        });

        gallery.appendChild(el);
    });

    observeCards();
}

function updateStats() {
    const pinned = getPinned();
    animateCount(statCount, cardsData.length);
    animateCount(statPinned, pinned.length);
}

function observeCards() {
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.flashcard:not(.in-view)').forEach(card => io.observe(card));
}

filterRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-pill');
    if (!btn) return;
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
});

lightboxClose.addEventListener('click', () => lightbox.classList.remove('is-active'));
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('is-active');
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') lightbox.classList.remove('is-active');
});

// Gentle note-sent confirmation without leaving the page early
const noteForm = document.getElementById('note-form');
if (noteForm) {
    noteForm.addEventListener('submit', () => {
        document.getElementById('sent-note').classList.add('show');
    });
}

fetch('data.json')
  .then(response => response.json())
  .then(cards => {
    cardsData = cards.map((c, i) => ({ id: i, ...c }));
    updateStats();
    render();
  })
  .catch(error => console.error('Error loading the memories:', error));