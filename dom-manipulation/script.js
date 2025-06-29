// Array to store quote objects
let quotes = [
  { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
  { text: "Strive not to be a success, but rather to be of value.", category: "Motivation" },
  { text: "The mind is everything. What you think you become.", category: "Mindset" },
  { text: "An unexamined life is not worth living.", category: "Philosophy" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "Business" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" }
];

// Get DOM elements
const quoteDisplayText = document.getElementById('quoteText');
const quoteDisplayCategory = document.getElementById('quoteCategory');
const newQuoteButton = document.getElementById('newQuote');
const newQuoteTextInput = document.getElementById('newQuoteText');
const newQuoteCategoryInput = document.getElementById('newQuoteCategory');
// New DOM elements for import/export
const importFileInput = document.getElementById('importFile');
const exportQuotesButton = document.getElementById('exportQuotes');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const messageCloseButton = document.getElementById('messageCloseButton');


/**
 * Shows a message box with the given text.
 * @param {string} message - The message to display.
 */
function showMessageBox(message) {
  messageText.textContent = message;
  messageBox.classList.remove('hidden');
}

/**
 * Hides the message box.
 */
function hideMessageBox() {
  messageBox.classList.add('hidden');
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
    showMessageBox("Error: Could not save quotes to local storage.");
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
      saveQuotes(); // Save default quotes if none are present
    }
  } catch (e) {
    console.error("Error loading quotes from local storage:", e);
    showMessageBox("Error: Could not load quotes from local storage. Using default quotes.");
    // Fallback to default quotes if loading fails
    quotes = [
      { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
      { text: "Strive not to be a success, but rather to be of value.", category: "Motivation" },
      { text: "The mind is everything. What you think you become.", category: "Mindset" },
      { text: "An unexamined life is not worth living.", category: "Philosophy" },
      { text: "Innovation distinguishes between a leader and a follower.", category: "Business" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" }
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
      console.log("Last viewed quote loaded from session storage.");
      return JSON.parse(lastQuote);
    }
  } catch (e) {
    console.error("Error loading last viewed quote from session storage:", e);
  }
  return null;
}

/**
 * Displays a random quote from the 'quotes' array.
 * Updates the quote text and category in the DOM.
 */
function showRandomQuote() {
  // Try to load the last viewed quote from session storage first, if quotes are empty
  if (quotes.length === 0) {
    const lastViewed = loadLastViewedQuote();
    if (lastViewed) {
      quoteDisplayText.textContent = `"${lastViewed.text}"`;
      quoteDisplayCategory.textContent = `- ${lastViewed.category}`;
      showMessageBox("No new quotes available. Showing last viewed.");
      return;
    } else {
      quoteDisplayText.textContent = "No quotes available. Add some!";
      quoteDisplayCategory.textContent = "";
      return;
    }
  }

  // Generate a random index
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];

  // Update the DOM with the random quote
  quoteDisplayText.textContent = `"${randomQuote.text}"`;
  quoteDisplayCategory.textContent = `- ${randomQuote.category}`;

  // Save the displayed quote to session storage
  saveLastViewedQuote(randomQuote);
}

/**
 * Adds a new quote to the 'quotes' array from user input.
 * Clears the input fields after adding and displays the new quote.
 */
function addQuote() {
  const quoteText = newQuoteTextInput.value.trim();
  const quoteCategory = newQuoteCategoryInput.value.trim();

  // Validate input
  if (quoteText === "" || quoteCategory === "") {
    showMessageBox("Please enter both quote text and category.");
    return;
  }

  // Add the new quote to the array
  quotes.push({ text: quoteText, category: quoteCategory });

  // Clear the input fields
  newQuoteTextInput.value = "";
  newQuoteCategoryInput.value = "";

  // Save quotes to local storage after adding
  saveQuotes();

  // Show a success message
  showMessageBox('Quote added successfully!');

  // Optionally, show the newly added quote or a random one
  showRandomQuote();
  console.log("New quote added:", { text: quoteText, category: quoteCategory });
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
    showMessageBox('Quotes exported successfully!');
    console.log("Quotes exported to quotes.json");
  } catch (e) {
    console.error("Error exporting quotes:", e);
    showMessageBox("Error: Could not export quotes.");
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

      // Validate imported data structure (optional but recommended)
      if (!Array.isArray(importedQuotes) || !importedQuotes.every(q => typeof q.text === 'string' && typeof q.category === 'string')) {
        showMessageBox('Invalid JSON file format. Expected an array of quote objects with "text" and "category" properties.');
        return;
      }

      // Append imported quotes to the existing array
      quotes.push(...importedQuotes);
      saveQuotes(); // Save updated quotes to local storage
      showMessageBox('Quotes imported successfully!');
      showRandomQuote(); // Display a random quote including the new ones
      console.log("Quotes imported from file.");
    } catch (parseError) {
      console.error("Error parsing JSON file:", parseError);
      showMessageBox('Error parsing JSON file. Please ensure it\'s valid.');
    }
  };
  fileReader.onerror = function() {
    console.error("Error reading file.");
    showMessageBox('Error reading file.');
  };
  fileReader.readAsText(file);
}

// Event listeners
newQuoteButton.addEventListener('click', showRandomQuote);
if (exportQuotesButton) {
  exportQuotesButton.addEventListener('click', exportQuotes);
}
if (importFileInput) {
  importFileInput.addEventListener('change', importFromJsonFile);
}
if (messageCloseButton) {
  messageCloseButton.addEventListener('click', hideMessageBox);
}


// Initial setup when the page loads
window.onload = function() {
  loadQuotes(); // Load quotes from local storage
  showRandomQuote(); // Display an initial quote (either random or last viewed)
};
