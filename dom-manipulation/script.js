// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  query,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// -- Global Variables --
let app, db, auth, userId, userQuotesCollectionRef;
let quotes = [];
let filteredQuotes = [];
const defaultQuotes = [...]; // Same as before

// DOM Elements
const quoteDisplayDiv = document.getElementById('quoteDisplay');
const quoteAuthorDiv = document.getElementById('quoteAuthor');
const newQuoteButton = document.getElementById('newQuoteBtn');
const newQuoteTextInput = document.getElementById('newQuoteText');
const newQuoteCategoryInput = document.getElementById('newQuoteCategory');
const addQuoteButton = document.getElementById('addQuoteBtn');
const categoryFilterSelect = document.getElementById('categoryFilter');
const importFileInput = document.getElementById('importFile');
const exportQuotesButton = document.getElementById('exportQuotesBtn');
const lastViewedQuoteDisplay = document.getElementById('lastViewedQuoteDisplay');
const notificationDisplay = document.getElementById('notificationDisplay');
const manualSyncButton = document.getElementById('manualSyncBtn');
const syncIntervalSelect = document.getElementById('syncIntervalSelect');

// Mock Server URL
const MOCK_SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Replace with your mock server if needed

// Notification Display
function displayNotification(message, type) {
  notificationDisplay.textContent = message;
  notificationDisplay.className = 'notification';
  notificationDisplay.classList.add(type);
  notificationDisplay.style.display = 'block';
  setTimeout(() => notificationDisplay.style.display = 'none', 5000);
}

// Firebase Initialization
async function initializeFirebase() {
  try {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
      displayNotification("Firebase not configured. Data will not sync.", "error");
      return;
    }

    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
    else await signInAnonymously(auth);

    userId = auth.currentUser?.uid || crypto.randomUUID();
    userQuotesCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'quotes');

    setupFirestoreListener();
    displayNotification("Connected to server! Data syncing in real-time.", "info");
  } catch (error) {
    displayNotification(`Firebase connection error: ${error.message}`, "error");
  }
}

// Firestore Listener
function setupFirestoreListener() {
  if (!userQuotesCollectionRef) return;

  onSnapshot(query(userQuotesCollectionRef), (snapshot) => {
    const fetchedQuotes = [];
    snapshot.forEach(doc => {
      fetchedQuotes.push({ id: doc.id, ...doc.data() });
    });
    quotes = fetchedQuotes;

    if (quotes.length === 0) {
      defaultQuotes.forEach(async quote => {
        await addDoc(userQuotesCollectionRef, { ...quote, timestamp: serverTimestamp() });
      });
    } else {
      populateCategories();
      filterQuotes();
      displayNotification("Quotes synced from server.", "info");
    }
  }, (error) => {
    displayNotification(`Real-time sync error: ${error.message}`, "error");
  });
}

// Quote Utilities
function showRandomQuote() { ... } // Unchanged
function saveLastViewedQuote(quote) { ... }
function loadLastViewedQuote() { ... }
async function addQuote() { ... }
function populateCategories() { ... }
function filterQuotes() { ... }
async function exportQuotes() { ... }
async function importFromJsonFile(event) { ... }

// === New: Mock Server Sync ===
async function fetchMockServerQuotes() {
  try {
    const response = await fetch(MOCK_SERVER_URL);
    const data = await response.json();
    let added = 0;

    for (const post of data.slice(0, 5)) {
      const text = post.title;
      const category = "Imported";
      const author = "Mock API";

      const isDuplicate = quotes.some(q => q.text === text && q.category === category);
      if (!isDuplicate) {
        await addDoc(userQuotesCollectionRef, { text, category, author, timestamp: serverTimestamp() });
        added++;
      }
    }

    displayNotification(`Mock server sync complete: ${added} new quotes added.`, added ? "success" : "info");
  } catch (e) {
    displayNotification("Failed to sync with mock server.", "error");
  }
}

// === Sync Interval Logic ===
let syncInterval = 30000;
let syncTimer = null;

function startServerSync() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(fetchMockServerQuotes, syncInterval);
}

// === Event Listeners ===
newQuoteButton.addEventListener('click', showRandomQuote);
addQuoteButton.addEventListener('click', addQuote);
exportQuotesButton.addEventListener('click', exportQuotes);

manualSyncButton.addEventListener('click', () => {
  displayNotification("Manual sync started...", "info");
  fetchMockServerQuotes();
});

syncIntervalSelect.addEventListener('change', (e) => {
  syncInterval = parseInt(e.target.value);
  displayNotification(`Sync interval updated to ${syncInterval / 1000} seconds`, "info");
  startServerSync();
});

// === Init ===
window.onload = function () {
  initializeFirebase();
  loadLastViewedQuote();
  startServerSync();
};
