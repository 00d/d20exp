import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.d20srd.org';
const SPELLS_INDEX_URL = `${BASE_URL}/srd/spells/index.htm`;
const DATA_DIR = path.join(process.cwd(), 'data');
const SPELLS_FILE = path.join(DATA_DIR, 'spells.json');

// Helper function to format text cleanly
const cleanText = (text) => text.replace(/’/g, "'").replace(/\s+/g, ' ').trim();

// Main function to scrape spell data
async function scrapeSpells() {
    console.log('Starting spell scraping process...');

    try {
        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR);
        }

        console.log(`Fetching spell index from ${SPELLS_INDEX_URL}`);
        const { data: indexHtml } = await axios.get(SPELLS_INDEX_URL);
        const $index = cheerio.load(indexHtml);

        const spellLinks = [];
        $index('ul a').each((i, el) => {
            const href = $index(el).attr('href');
            if (href && !href.startsWith('..')) { // Filter out parent directory links
                spellLinks.push({
                    name: cleanText($index(el).text()),
                    url: `${BASE_URL}/srd/spells/${href}`
                });
            }
        });

        console.log(`Found ${spellLinks.length} spell links. Fetching details...`);

        const allSpells = [];
        // Using a for...of loop to handle async requests sequentially
        for (const link of spellLinks) {
            try {
                const { data: spellHtml } = await axios.get(link.url);
                const $spell = cheerio.load(spellHtml);

                const spellData = {
                    name: link.name,
                    url: link.url,
                    description: '',
                    details: {}
                };

                // The content is in the body, often within <p> tags
                let descriptionStarted = false;
                $spell('body > p').each((i, p) => {
                    const element = $spell(p);
                    const htmlContent = element.html();

                    // Details are in bold tags (e.g., <b>School:</b> Abjuration)
                    if (htmlContent.includes('<b>')) {
                        const key = cleanText(element.find('b').text().replace(':', ''));
                        // The value is the text node following the <b> tag
                        const value = cleanText(element.contents().filter((idx, node) => node.type === 'text').text());
                        
                        if (key && value) {
                            spellData.details[key.toLowerCase()] = value;
                        }
                        descriptionStarted = true; // Description starts after the details
                    } else if (descriptionStarted) {
                        // Append descriptive paragraphs
                        spellData.description += element.text() + '\n\n';
                    }
                });
                
                spellData.description = cleanText(spellData.description);
                allSpells.push(spellData);
                console.log(`Successfully scraped: ${link.name}`);

            } catch (err) {
                console.error(`Could not fetch or parse spell: ${link.name} at ${link.url}`, err.message);
            }
        }

        fs.writeFileSync(SPELLS_FILE, JSON.stringify(allSpells, null, 2));
        console.log(`\nScraping complete! ${allSpells.length} spells saved to ${SPELLS_FILE}`);

    } catch (error) {
        console.error('An error occurred during the scraping process:', error);
    }
}

scrapeSpells();
