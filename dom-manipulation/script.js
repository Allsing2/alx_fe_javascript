// Array to store quote objects
let quotes = [
  { text: "The only way to do great work is to love what you do.", category: "Inspiration", author: "Steve Jobs" },
  { text: "Strive not to be a success, but rather to be of value.", category: "Motivation", author: "Albert Einstein" },
  { text: "The mind is everything. What you think you become.", category: "Mindset", author: "Buddha" },
  { text: "An unexamined life is not worth living.", category: "Philosophy", author: "Socrates" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "Business", author: "Steve Jobs" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams", author: "Eleanor Roosevelt" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Motivation", author: "Nelson Mandela" },
  { text: "It is during our darkest moments that we must focus to see the light.", category: "Inspiration", author: "Aristotle" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life", author: "John Lennon" }
];

// Array to hold quotes after applying category filter
let filteredQuotes = [];

// Get DOM elements
const quoteDisplayDiv = document.getElementById('quoteDisplay');
const quoteAuthorDiv = document.getElementById('quoteAuthor');
const newQuoteButton = document.getElementById('newQuoteBtn'); // Updated ID
const newQuoteTextInput = document.getElementById('newQuoteText');
const newQuoteCategoryInput = document.getElementById('newQuoteCategory');
const addQuoteButton = document.getElementById('addQuoteBtn'); // Updated ID

// New DOM elements for category filter
const categoryFilterSelect = document.getElementById('categoryFilter');

// New DOM elements for import/export
const importFileInput = document.getElementById('importFile');
const exportQuotesButton = document.getElementById('exportQuotesBtn'); // Updated ID

// New DOM elements for Session Storage display
const lastViewedQuoteDisplay = document.getElementById('lastViewedQuoteDisplay');

// New DOM element for the notification system
const notificationDisplay = document.getElementById('notificationDisplay');

/**
 * Displays a notification message to the user.
 * @param {string} message - The message text.
 * @param {string} type - The type of message ('success', 'error', 'info').
 */
function displayNotification(message, type) {
  notificationDisplay.textContent = message;
  notificationDisplay.className = 'notification'; // Reset classes
  notificationDisplay.classList.add(type);
  notificationDisplay.style.display = 'block';

  // Hide the notification after 5 seconds
  setTimeout(() => {
    notificationDisplay.style.display = 'none';
  }, 5000);
}

/**
 * Saves the current 'quotes' array to local storage.
 */
function saveQuotes() {
  try {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    console.log("Quotes saved to local storage.");
  } catch (e) {
    console.error("Error saving quotes to local storage:", e);
    displayNotification("Error: Could not save quotes to local storage.", "error");
  }
}

/**
 * Loads quotes from local storage into the 'quotes' array.
 * If no quotes are found in local storage, the default quotes array is used.
 */
function loadQuotes() {
  try {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
      quotes = JSON.parse(storedQuotes);
      console.log("Quotes loaded from local storage.");
    } else {
      console.log("No quotes found in local storage. Using default quotes.");
      // If no quotes, save the initial default set to local storage
      saveQuotes();
    }
  } catch (e) {
    console.error("Error loading quotes from local storage:", e);
    displayNotification("Error: Could not load quotes from local storage. Using default quotes.", "error");
    // Fallback to default quotes if loading fails
    quotes = [
      { text: "The only way to do great work is to love what you do.", category: "Inspiration", author: "Steve Jobs" },
      { text: "Strive not to be a success, but rather to be of value.", category: "Motivation", author: "Albert Einstein" },
      { text: "The mind is everything. What you think you become.", category: "Mindset", author: "Buddha" },
      { text: "An unexamined life is not worth living.", category: "Philosophy", author: "Socrates" },
      { text: "Innovation distinguishes between a leader and a follower.", category: "Business", author: "Steve Jobs" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams", author: "Eleanor Roosevelt" },
      { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Motivation", author: "Nelson Mandela" },
      { text: "It is during our darkest moments that we must focus to see the light.", category: "Inspiration", author: "Aristotle" },
      { text: "Life is what happens when you're busy making other plans.", category: "Life", author: "John Lennon" }
    ];
    saveQuotes(); // Attempt to save defaults again
  }
}

/**
 * Saves the last viewed quote text and category to session storage.
 * @param {object} quote - The quote object to save.
 */
function saveLastViewedQuote(quote) {
  try {
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
    lastViewedQuoteDisplay.textContent = `Last viewed: "${quote.text}" - ${quote.author || quote.category}`;
    console.log("Last viewed quote saved to session storage.");
  } catch (e) {
    console.error("Error saving last viewed quote to session storage:", e);
  }
}

/**
 * Loads the last viewed quote from session storage.
 * @returns {object|null} The last viewed quote object, or null if not found.
 */
function loadLastViewedQuote() {
  try {
    const lastQuote = sessionStorage.getItem('lastViewedQuote');
    if (lastQuote) {
      const parsedQuote = JSON.parse(lastQuote);
      lastViewedQuoteDisplay.textContent = `Last viewed: "${parsedQuote.text}" - ${parsedQuote.author || parsedQuote.category}`;
      console.log("Last viewed quote loaded from session storage.");
      return parsedQuote;
    }
  } catch (e) {
    console.error("Error loading last viewed quote from session storage:", e);
  }
  return null;
}

/**
 * Displays a random quote from the currently filteredQuotes array.
 * If filteredQuotes is empty, it attempts to load from session storage or displays a default message.
 */
function showRandomQuote() {
  const quotesToDisplay = filteredQuotes.length > 0 ? filteredQuotes : quotes;

  if (quotesToDisplay.length === 0) {
    const lastViewed = loadLastViewedQuote();
    if (lastViewed) {
      quoteDisplayDiv.textContent = `"${lastViewed.text}"`;
      quoteAuthorDiv.textContent = `- ${lastViewed.author || lastViewed.category}`;
      quoteDisplayDiv.classList.remove('no-quote');
      displayNotification("No quotes in current filter. Showing last viewed.", "info");
      return;
    } else {
      quoteDisplayDiv.textContent = "No quotes available. Add some or import from JSON!";
      quoteAuthorDiv.textContent = "";
      quoteDisplayDiv.classList.add('no-quote');
      return;
    }
  }

  const randomIndex = Math.floor(Math.random() * quotesToDisplay.length);
  const randomQuote = quotesToDisplay[randomIndex];

  quoteDisplayDiv.textContent = `"${randomQuote.text}"`;
  quoteAuthorDiv.textContent = `- ${randomQuote.author || randomQuote.category}`; // Display author or category
  quoteDisplayDiv.classList.remove('no-quote');

  saveLastViewedQuote(randomQuote); // Save the displayed quote to session storage
}

/**
 * Adds a new quote to the 'quotes' array from user input.
 * Clears the input fields after adding.
 */
function addQuote() {
  const text = newQuoteTextInput.value.trim();
  const category = newQuoteCategoryInput.value.trim();
  const author = 'User Added'; // Default author for user-added quotes

  if (text === "" || category === "") {
    displayNotification("Please enter both quote text and category.", "error");
    return;
  }

  quotes.push({ text, category, author });

  newQuoteTextInput.value = "";
  newQuoteCategoryInput.value = "";

  saveQuotes(); // Save quotes to local storage
  populateCategories(); // Update categories dropdown with new category
  filterQuotes(); // Re-apply filter and show a new quote
  displayNotification('Quote added successfully!', "success");
}

/**
 * Extracts unique categories from the quotes array and populates the category filter dropdown.
 */
function populateCategories() {
  const categories = new Set(quotes.map(quote => quote.category));
  categoryFilterSelect.innerHTML = '<option value="all">All Categories</option>'; // Always start with "All"

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilterSelect.appendChild(option);
  });

  // Restore last selected filter from local storage
  const lastSelectedCategory = localStorage.getItem('lastCategoryFilter');
  if (lastSelectedCategory && Array.from(categories).includes(lastSelectedCategory)) {
    categoryFilterSelect.value = lastSelectedCategory;
  } else {
    categoryFilterSelect.value = 'all';
  }
}

/**
 * Filters the quotes based on the selected category in the dropdown.
 * Updates the filteredQuotes array and displays a random quote from it.
 * Saves the selected filter to local storage.
 */
function filterQuotes() {
  const selectedCategory = categoryFilterSelect.value;
  localStorage.setItem('lastCategoryFilter', selectedCategory); // Save selected filter

  if (selectedCategory === 'all') {
    filteredQuotes = [...quotes]; // Copy all quotes
  } else {
    filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
  }

  showRandomQuote(); // Display a random quote from the filtered list
}


/**
 * Exports the current quotes array to a JSON file.
 */
function exportQuotes() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2); // Pretty print JSON
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json'; // Default file name
    document.body.appendChild(a); // Append to body to make it clickable
    a.click(); // Programmatically click the link to trigger download
    document.body.removeChild(a); // Clean up the link

    URL.revokeObjectURL(url); // Release the object URL
    displayNotification('Quotes exported successfully to quotes.json!', "success");
    console.log("Quotes exported to quotes.json");
  } catch (e) {
    console.error("Error exporting quotes:", e);
    displayNotification("Error: Could not export quotes.", "error");
  }
}

/**
 * Imports quotes from a JSON file selected by the user.
 * @param {Event} event - The change event from the file input.
 */
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);

      // Validate imported data structure: array of objects with text, category (and optionally author)
      if (!Array.isArray(importedQuotes) || !importedQuotes.every(q => typeof q.text === 'string' && typeof q.category === 'string')) {
        displayNotification('Invalid JSON file format. Expected an array of quote objects with "text" and "category" properties.', "error");
        return;
      }

      // Append imported quotes to the existing array
      quotes.push(...importedQuotes);
      saveQuotes(); // Save updated quotes to local storage
      populateCategories(); // Update categories dropdown with new categories
      filterQuotes(); // Re-apply filter and display a quote
      displayNotification('Quotes imported successfully!', "success");
      console.log("Quotes imported from file.");
      // Clear the file input value to allow re-importing the same file
      event.target.value = '';
    } catch (parseError) {
      console.error("Error parsing JSON file:", parseError);
      displayNotification('Error parsing JSON file. Please ensure it\'s valid JSON.', "error");
      event.target.value = ''; // Clear input on error
    }
  };
  fileReader.onerror = function() {
    console.error("Error reading file.");
    displayNotification('Error reading file.', "error");
    event.target.value = ''; // Clear input on error
  };
  fileReader.readAsText(file);
}

// --- Event Listeners ---
newQuoteButton.addEventListener('click', showRandomQuote);
addQuoteButton.addEventListener('click', addQuote);
exportQuotesButton.addEventListener('click', exportQuotes);
// categoryFilterSelect has an inline onchange="filterQuotes()" as per prompt.
// importFileInput has an inline onchange="importFromJsonFile(event)" as per prompt.

// --- Initial Setup on Page Load ---
window.onload = function() {
  loadQuotes(); // Load quotes from local storage
  populateCategories(); // Populate filter dropdown based on loaded quotes
  filterQuotes(); // Apply the default/last-selected filter and show an initial quote
  loadLastViewedQuote(); // Load and display last viewed quote from session storage
};