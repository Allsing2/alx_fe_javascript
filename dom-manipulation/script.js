// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, query, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Initial default quotes (used only if no quotes exist in Firestore for the current user)
const defaultQuotes = [
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

// Array to store quotes, kept in sync with Firestore via the real-time listener
let quotes = [];
// Array to hold quotes after applying category filter
let filteredQuotes = [];

// Firebase instances
let app;
let db;
let auth;
let userId; // Will hold the authenticated user's ID
let userQuotesCollectionRef; // Reference to the user's quotes collection in Firestore

// Get DOM elements
const quoteDisplayDiv = document.getElementById('quoteDisplay');
const quoteAuthorDiv = document.getElementById('quoteAuthor');
const newQuoteButton = document.getElementById('newQuoteBtn');
const newQuoteTextInput = document.getElementById('newQuoteText');
const newQuoteCategoryInput = document.getElementById('newQuoteCategory');
const addQuoteButton = document.getElementById('addQuoteBtn');

// DOM elements for category filter
const categoryFilterSelect = document.getElementById('categoryFilter');

// DOM elements for import/export
const importFileInput = document.getElementById('importFile');
const exportQuotesButton = document.getElementById('exportQuotesBtn');

// DOM elements for Session Storage display
const lastViewedQuoteDisplay = document.getElementById('lastViewedQuoteDisplay');

// DOM element for the notification system
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
 * Initializes Firebase and sets up authentication.
 * This is the entry point for connecting to the server.
 */
async function initializeFirebase() {
  try {
    // These global variables (__app_id, __firebase_config, __initial_auth_token)
    // are provided by the Canvas environment for Firebase setup.
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase config is not available. Please ensure __firebase_config is set.");
        displayNotification("Firebase not configured. Data will not sync.", "error");
        return;
    }

    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Authenticate the user. Firebase handles user sessions.
    if (initialAuthToken) {
      await signInWithCustomToken(auth, initialAuthToken);
      console.log("Signed in with custom token.");
    } else {
      await signInAnonymously(auth);
      console.log("Signed in anonymously.");
    }

    // Get the authenticated user's ID. This ID is used to store private user data in Firestore.
    userId = auth.currentUser?.uid || crypto.randomUUID(); // Fallback for userId if auth fails
    console.log("Current User ID:", userId);

    // Set up the Firestore collection reference for this specific user's quotes.
    // Data will be stored under 'artifacts/{appId}/users/{userId}/quotes'.
    userQuotesCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'quotes');

    // Start the real-time data synchronization listener with Firestore.
    setupFirestoreListener();
    displayNotification("Connected to server! Data syncing in real-time.", "info");

  } catch (error) {
    console.error("Error initializing Firebase:", error);
    displayNotification(`Firebase connection error: ${error.message}`, "error");
  }
}

/**
 * Sets up a real-time listener for quotes in Firestore.
 * This function is the core of the data syncing mechanism.
 * It automatically updates the local 'quotes' array whenever changes occur on the server,
 * ensuring the server's data always takes precedence.
 */
function setupFirestoreListener() {
  if (!userQuotesCollectionRef) {
    console.warn("Firestore collection reference not set. Cannot set up real-time listener.");
    return;
  }

  // onSnapshot provides real-time, push-based updates, eliminating the need for periodic polling.
  onSnapshot(query(userQuotesCollectionRef), (snapshot) => {
    const fetchedQuotes = [];
    snapshot.forEach(doc => {
      // Add Firestore document ID to the quote object for potential future updates/deletes
      fetchedQuotes.push({ id: doc.id, ...doc.data() });
    });
    quotes = fetchedQuotes; // Update local 'quotes' array with the server's latest data.

    console.log("Quotes updated from Firestore (Server Sync):", quotes);

    // If no quotes are loaded from Firestore for this user, seed with default quotes.
    // This happens only once when a new user accesses the app or their data is empty.
    if (quotes.length === 0 && defaultQuotes.length > 0) {
      displayNotification("No personal quotes found on server. Adding default quotes.", "info");
      defaultQuotes.forEach(async (quote) => {
        try {
          // Add default quotes to Firestore, which will then sync back to the local array
          await addDoc(userQuotesCollectionRef, { ...quote, timestamp: serverTimestamp() });
        } catch (e) {
          console.error("Error adding default quote to Firestore:", e);
        }
      });
    } else if (quotes.length > 0) {
      // If quotes were fetched, re-populate categories and apply the filter.
      populateCategories();
      filterQuotes();
      displayNotification("Quotes synced from server.", "info");
    } else {
      // If still no quotes after potentially seeding, display a "no quotes" message.
      quoteDisplayDiv.textContent = "No quotes available. Add some or import from JSON!";
      quoteAuthorDiv.textContent = "";
      quoteDisplayDiv.classList.add('no-quote');
    }
  }, (error) => {
    console.error("Error listening to Firestore (Real-time Sync Failed):", error);
    displayNotification(`Real-time sync error: ${error.message}`, "error");
  });
}

/**
 * Saves the last viewed quote text and category to session storage.
 * This is for temporary, session-specific user preference, not main data sync.
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
 * Adds a new quote to the 'quotes' array by adding it to Firestore.
 * The real-time listener will then update the local 'quotes' array.
 * Clears the input fields after adding.
 */
async function addQuote() {
  const text = newQuoteTextInput.value.trim();
  const category = newQuoteCategoryInput.value.trim();
  const author = 'User Added'; // Default author for user-added quotes

  if (text === "" || category === "") {
    displayNotification("Please enter both quote text and category.", "error");
    return;
  }
  if (!userQuotesCollectionRef) {
      displayNotification("Server not ready. Please wait or refresh the page.", "error");
      return;
  }

  try {
    // Add the new quote document to Firestore. This is the "posting data" to server.
    await addDoc(userQuotesCollectionRef, { text, category, author, timestamp: serverTimestamp() });

    newQuoteTextInput.value = "";
    newQuoteCategoryInput.value = "";

    // The Firestore listener (setupFirestoreListener) will automatically update
    // the local 'quotes' array and trigger UI updates (populateCategories, filterQuotes).
    displayNotification('Quote added successfully and synced to server!', "success");
  } catch (e) {
    console.error("Error adding quote to Firestore:", e);
    displayNotification(`Error adding quote: ${e.message}`, "error");
  }
}

/**
 * Extracts unique categories from the quotes array and populates the category filter dropdown.
 * This function reflects the categories currently present in the synchronized 'quotes' array.
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

  // Restore last selected filter from local storage. This is a local preference, not server data.
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
    filteredQuotes = [...quotes]; // Copy all quotes from the synchronized array
  } else {
    filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
  }

  showRandomQuote(); // Display a random quote from the filtered list
}

/**
 * Exports the current quotes array to a JSON file.
 * Data is fetched directly from Firestore for export to ensure it's the latest server data.
 */
async function exportQuotes() {
  if (!userQuotesCollectionRef) {
    displayNotification("Server not ready. Cannot export quotes.", "error");
    return;
  }
  displayNotification("Preparing to export quotes...", "info");
  try {
    const querySnapshot = await getDocs(userQuotesCollectionRef);
    const quotesToExport = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      // Exclude internal Firestore fields like 'timestamp' and 'id' from the exported JSON
      const { timestamp, id, ...rest } = data;
      quotesToExport.push(rest);
    });

    const dataStr = JSON.stringify(quotesToExport, null, 2); // Pretty print JSON
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json'; // Default file name
    document.body.appendChild(a);
    a.click(); // Programmatically trigger the download
    document.body.removeChild(a); // Clean up the temporary link

    URL.revokeObjectURL(url); // Release the object URL
    displayNotification('Quotes exported successfully to quotes.json!', "success");
    console.log("Quotes exported to quotes.json");
  } catch (e) {
    console.error("Error exporting quotes:", e);
    displayNotification(`Error exporting quotes: ${e.message}`, "error");
  }
}

/**
 * Imports quotes from a JSON file selected by the user.
 * Implements a basic conflict resolution strategy: skips adding exact duplicates
 * (based on text and category) that already exist in the Firestore-synced 'quotes' array.
 * @param {Event} event - The change event from the file input.
 */
async function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  if (!userQuotesCollectionRef) {
      displayNotification("Server not ready. Cannot import quotes.", "error");
      return;
  }

  displayNotification("Importing quotes. Checking for conflicts...", "info");
  const fileReader = new FileReader();
  fileReader.onload = async function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);

      // Validate imported data structure: array of objects with 'text' and 'category' strings.
      if (!Array.isArray(importedQuotes) || !importedQuotes.every(q => typeof q.text === 'string' && typeof q.category === 'string')) {
        displayNotification('Invalid JSON file format. Expected an array of quote objects with "text" and "category" properties.', "error");
        return;
      }

      let addedCount = 0;
      let skippedCount = 0;

      // Conflict Resolution Logic:
      // Iterate through imported quotes and check if they are duplicates of existing quotes.
      // 'quotes' array is always kept up-to-date by the Firestore listener, so we check against it.
      for (const importedQuote of importedQuotes) {
        const isDuplicate = quotes.some(existingQuote =>
          existingQuote.text === importedQuote.text && existingQuote.category === importedQuote.category
        );

        if (!isDuplicate) {
          // If not a duplicate, add the new quote document to Firestore.
          await addDoc(userQuotesCollectionRef, {
            text: importedQuote.text,
            category: importedQuote.category,
            author: importedQuote.author || 'Imported', // Use 'Imported' if author not specified in the file
            timestamp: serverTimestamp() // Add a server timestamp
          });
          addedCount++;
        } else {
          skippedCount++; // Increment skipped count for duplicates
        }
      }

      // Provide feedback on the import process and conflict resolution.
      let message = `Import complete: ${addedCount} quotes added, ${skippedCount} skipped (duplicates resolved).`;
      if (addedCount > 0) {
          displayNotification(message, "success");
      } else {
          displayNotification(message, "info");
      }

      console.log("Quotes imported from file. Added:", addedCount, "Skipped (duplicates):", skippedCount);
      // The Firestore listener will automatically update the local 'quotes' array and trigger UI updates.
      event.target.value = ''; // Clear the file input value to allow re-importing the same file
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
// Attach event listeners to buttons and selects for user interaction.
newQuoteButton.addEventListener('click', showRandomQuote);
addQuoteButton.addEventListener('click', addQuote);
exportQuotesButton.addEventListener('click', exportQuotes);
// The categoryFilterSelect and importFileInput have inline onchange attributes in HTML
// (e.g., onchange="filterQuotes()" and onchange="importFromJsonFile(event)").

// --- Initial Setup on Page Load ---
// This function runs once the entire page (including all DOM elements) has loaded.
window.onload = function() {
  initializeFirebase(); // Initialize Firebase and authentication first to connect to the server.
  // The Firestore listener (setupFirestoreListener) will then automatically
  // handle loading data from the server, populating categories, and filtering.
  loadLastViewedQuote(); // Load and display the last viewed quote from session storage (local preference).
};
