// server.js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Get __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON bodies

// --- API Routes ---

// Load spell data from scraped JSON file
let spells = [];
const spellsDataPath = path.join(__dirname, 'data', 'spells.json');
if (fs.existsSync(spellsDataPath)) {
    try {
        const spellsData = fs.readFileSync(spellsDataPath, 'utf-8');
        spells = JSON.parse(spellsData);
        console.log(`Successfully loaded ${spells.length} spells.`);
    } catch (err) {
        console.error("Error reading or parsing spells.json:", err);
    }
} else {
    console.warn("Warning: spells.json not found. Run `npm run scrape` to generate it.");
}

// API endpoint to get all spells (or a filtered list)
app.get('/api/spells', (req, res) => {
    res.json(spells);
});

// --- Static File Serving for Production ---

// Serve the built Vite app
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// For any other request, serve the index.html file so client-side routing works
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (spells.length === 0) {
        console.log("Don't forget to run `npm run scrape` to get the spell data");
    }
});
