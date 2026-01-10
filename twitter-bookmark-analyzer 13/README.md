# Twitter Consciousness Analyzer 🧠

Transform your Twitter/X bookmarks into deep psychological insights. This Chrome extension analyzes your saved content to reveal your core interests, cognitive patterns, values, and psychological themes.

![Version](https://img.shields.io/badge/version-0.1.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)
![Chrome](https://img.shields.io/badge/chrome-extension-green)

## What It Does

The Consciousness Analyzer goes beyond surface-level analytics to provide:

- **🎯 Core Identity** - The themes that define your digital mind
- **🧩 Cognitive Style** - How you process and prioritize information
- **📚 Interest Mapping** - Topics that capture your attention, ranked
- **🎙️ Trusted Voices** - The minds you return to most often
- **⏰ Temporal Patterns** - When your mind is most active
- **💡 Psychological Insights** - Strengths, growth areas, and blind spots
- **🥗 Information Diet Analysis** - Quality and diversity of your inputs

## Installation

### From Source (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/SeldomSought/Twitter-bookmark-analyzer.git
   cd Twitter-bookmark-analyzer
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `Twitter-bookmark-analyzer` folder

3. **You're ready!**
   - Click the extension icon in your toolbar
   - Make sure you're logged into Twitter/X
   - Click "Analyze My Bookmarks"

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER EXTENSION                        │
├─────────────────────────────────────────────────────────────┤
│  Popup UI          Background Worker        Content Script  │
│  ─────────         ─────────────────        ──────────────  │
│  • Start/Stop      • Orchestration          • DOM Scraping  │
│  • Progress        • State Management       • Data Extract  │
│  • Results Link    • Inference Engine       • Scroll Auto   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL PROCESSING                         │
├─────────────────────────────────────────────────────────────┤
│  • Topic Extraction        • Psychological Pattern Analysis │
│  • Author Analysis         • Vocabulary Profiling           │
│  • Temporal Patterns       • Consciousness Profile Building │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL STORAGE                            │
├─────────────────────────────────────────────────────────────┤
│  IndexedDB: All data stays on YOUR device                   │
└─────────────────────────────────────────────────────────────┘
```

### Privacy First

- **100% Local Processing** - All analysis happens in your browser
- **No Server Communication** - Your data never leaves your device
- **No Accounts Required** - No sign-up, no tracking
- **You Own Your Data** - Export anytime, delete anytime

### The Analysis Process

1. **Capture** (~5-8 minutes)
   - Opens your Twitter bookmarks in a background tab
   - Automatically scrolls and captures tweet content
   - Extracts text, authors, timestamps, and media metadata

2. **Process** (streaming)
   - Topics are categorized in real-time as data arrives
   - Patterns emerge progressively
   - Early insights shown while capture continues

3. **Analyze** (~1-2 minutes)
   - Deep inference runs on complete dataset
   - Psychological patterns identified
   - Consciousness profile generated

4. **Present**
   - Rich, visual results page
   - Exportable data
   - Actionable insights

## Features

### MVP (Current)

- [x] One-click analysis
- [x] Background scraping (doesn't interrupt your work)
- [x] Real-time progress updates
- [x] 20+ topic categories
- [x] Author influence tracking
- [x] Temporal pattern detection
- [x] Basic psychological inference
- [x] Beautiful results visualization
- [x] Local storage with IndexedDB
- [x] Data export (JSON)

### Planned

- [ ] Advanced ML-based topic clustering
- [ ] Sentiment analysis per topic
- [ ] Longitudinal tracking (changes over time)
- [ ] Cross-platform support (Reddit, Substack)
- [ ] Custom topic taxonomies
- [ ] Shareable (anonymized) profiles
- [ ] Chrome Web Store release

## Technical Details

### Tech Stack

- **Manifest V3** Chrome Extension
- **Vanilla JavaScript** (no framework dependencies)
- **IndexedDB** for local storage
- **CSS3** with custom properties

### File Structure

```
twitter-bookmark-analyzer/
├── manifest.json           # Extension configuration
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
├── background/
│   └── service-worker.js  # Background orchestration
├── content/
│   └── scraper.js         # Twitter DOM scraper
├── inference/
│   └── engine.js          # Analysis & inference
├── results/
│   ├── results.html       # Results page
│   ├── results.css        # Results styles
│   └── results.js         # Results rendering
├── lib/
│   └── storage.js         # IndexedDB wrapper
└── assets/
    └── icon*.png          # Extension icons
```

### Browser Support

- ✅ Chrome 88+
- ✅ Edge 88+
- 🔜 Firefox (planned)
- 🔜 Brave (untested but should work)

## Development

### Prerequisites

- Chrome browser
- Git

### Setup

```bash
# Clone
git clone https://github.com/SeldomSought/Twitter-bookmark-analyzer.git

# Load in Chrome (see Installation)

# Make changes, then reload extension in chrome://extensions/
```

### Testing

1. Load extension in developer mode
2. Log into Twitter/X
3. Create some bookmarks if you haven't
4. Click extension → "Analyze My Bookmarks"
5. Wait for results

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### "No bookmarks found"

- Make sure you're logged into Twitter/X
- Verify you have bookmarks saved
- Try refreshing the bookmarks page manually first

### Extension not responding

- Check chrome://extensions/ for errors
- Reload the extension
- Check browser console for errors

### Scraping stops early

- Twitter may have updated their DOM structure
- Open an issue with details

### Results don't load

- Check that IndexedDB is enabled
- Clear extension data and re-run analysis

## Legal & Ethics

### Terms of Service

This extension operates in a gray area regarding Twitter's ToS. It:
- Accesses YOUR data from YOUR logged-in session
- Does not use Twitter's API
- Does not redistribute any data
- Processes everything locally

Use at your own discretion.

### Data Rights

Under GDPR Article 20 and CCPA, you have the right to access and export your own data. This tool helps you exercise that right.

### No Warranty

This software is provided "as is" without warranty. The authors are not responsible for any consequences of using this extension.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by the quantified self movement
- Built for those who want to understand their digital minds
- Thanks to everyone who saves tweets instead of reading them immediately

---

**Made with 🧠 by [SeldomSought](https://github.com/SeldomSought)**

*Your bookmarks reveal more about you than you might think.*
