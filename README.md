# PDF Summarizer for Government Officials

A Tauri desktop application that ingests PDF documents (particularly government tenders and procurement documents) and summarizes them into structured bullet points highlighting information relevant to government officials.

## Features

- **PDF Text Extraction**: Extract text from PDF documents using PDF.js
- **Intelligent Summarization**: Two modes available:
  - **API Mode**: Uses OpenRouter API for AI-powered summarization
  - **Mock Mode**: Rule-based summarization that works offline
- **Government-Focused Analysis**: Highlights procurement deadlines, tender values, eligibility criteria, contact points, and penalties
- **Three-Panel Interface**: PDF viewer, chat interface, and raw text display
- **Cross-Platform**: Built with Tauri for Windows, macOS, and Linux support

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Rust (latest stable version)
- npm or yarn

### Installation & Setup

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd pdf-summarizer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run tauri:dev
   ```

### Building the Application

**Development build:**
```bash
npm run tauri:dev
```

**Production build:**
```bash
npm run tauri:build
```

The built application will be available in `src-tauri/target/release/bundle/`

## Usage

### Mock Mode (Default - No API Key Required)

The application runs in mock mode by default, which provides deterministic summarization using regex patterns to detect:
- Dates and deadlines
- Financial amounts
- Eligibility criteria
- Contact information
- Procurement-related keywords

### API Mode (Optional - Requires API Key)

To use AI-powered summarization:

1. **Get an OpenRouter API key:**
   - Visit [OpenRouter](https://openrouter.ai/)
   - Create an account and get your API key

2. **Set the environment variable:**
   ```bash
   # Windows
   set OPENROUTER_API_KEY=your_api_key_here
   
   # macOS/Linux
   export OPENROUTER_API_KEY=your_api_key_here
   ```

3. **Run the application:**
   ```bash
   npm run tauri:dev
   ```

4. **Toggle to API mode** in the application interface

## How to Use

1. **Select a PDF**: Click "Choose PDF File" to select a government tender or procurement document
2. **Wait for Processing**: The application will extract text from the PDF
3. **Ask Questions**: Use the chat interface to ask questions like:
   - "Summarize for procurement officer"
   - "What are the key deadlines?"
   - "What is the tender value?"
4. **View Results**: The application will provide structured output with:
   - Short summary
   - Relevance to officials (deadlines, money, eligibility, actions)
   - Action items
   - Confidence estimate

## Sample Documents

A sample government tender document is included as `sample-tender.txt` for testing purposes. You can convert this to PDF or use any government tender PDF.

## Project Structure

```
pdf-summarizer/
├── src/                    # React frontend
│   ├── App.tsx            # Main application component
│   ├── App.css            # Styling
│   └── main.tsx           # React entry point
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── main.rs        # Tauri commands and logic
│   │   └── lib.rs         # Tests
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## Testing

Run the Rust tests:
```bash
cd src-tauri
cargo test
```

The tests verify the mock summarizer functionality with sample tender documents.

## API Integration

The application supports OpenRouter API integration for enhanced summarization. The API call includes a specialized prompt for government procurement officers:

```
"You are a summarizer for Indian government procurement officers. From the provided document extract the most important bullets an officer needs to act on: procurement value, submission deadline(s), eligibility criteria, required documents, penalties, key contacts, and suggested next steps. Return JSON with keys short_summary, relevance_to_officials (array), action_items (array), confidence_estimate."
```

## Limitations

- **Scanned PDFs**: The application cannot extract text from image-based PDFs. For such documents, OCR preprocessing would be required.
- **Complex Layouts**: PDFs with complex layouts may not extract text perfectly.
- **Language Support**: Currently optimized for English documents, though it can handle basic Hindi text.

## Future Enhancements

- OCR support for scanned PDFs using Tesseract
- Export functionality (Markdown, CSV)
- Batch processing of multiple PDFs
- Enhanced language support
- Custom prompt templates

## Troubleshooting

### Common Issues

1. **PDF text extraction fails**: Ensure the PDF contains selectable text, not just images
2. **API mode not working**: Check that the `OPENROUTER_API_KEY` environment variable is set correctly
3. **Build fails**: Ensure you have the latest versions of Node.js and Rust installed

### Getting Help

If you encounter issues:
1. Check the console for error messages
2. Ensure all dependencies are installed correctly
3. Try running in mock mode first to verify basic functionality

## License

This project is created for educational and demonstration purposes.

## Demo

The application provides a clean, three-panel interface:
- **Left Panel**: PDF file selection and status
- **Center Panel**: Chat interface with summarization results
- **Right Panel**: Raw extracted text (collapsible)

The interface includes a quick-start button for immediate summarization and toggles between mock and API modes.
