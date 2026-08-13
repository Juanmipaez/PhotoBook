const gallery = document.getElementById('gallery-container');

// 1. Get the data from the JSON file
fetch('data.json')
  .then(response => response.json())
  .then(cards => {
    
    // 2. Loop through each memory
    cards.forEach(card => {
      
      // 3. Build the HTML for the card
      // Notice the loading="lazy" attribute - this fixes your speed issue!
      const cardHTML = `
        <div class="flashcard" onclick="this.classList.toggle('is-flipped')">
          <div class="flashcard-inner">
            
            <div class="flashcard-front">
              <img src="${card.image}" alt="${card.title}" loading="lazy">
            </div>
            
            <div class="flashcard-back">
              <h3>${card.title}</h3>
              <p>${card.backText}</p>
            </div>
            
          </div>
        </div>
      `;

      // 4. Inject it into the page
      gallery.innerHTML += cardHTML;
    });
  })
  .catch(error => console.error('Error loading the memories:', error));