# Demo Video Script - PDF Summarizer

## Video Length: 1-2 minutes

### Scene 1: Introduction (10 seconds)
**Visual:** Show the application window with the three-panel interface
**Narration:** "This is the PDF Summarizer, a Tauri desktop application designed for government officials to quickly analyze procurement documents and tenders."

### Scene 2: File Selection (15 seconds)
**Visual:** 
- Click on "Choose PDF File" button
- Show file picker dialog
- Select a government tender PDF (or the sample text file)
- Show file loading and text extraction process

**Narration:** "Simply select a PDF document - the application extracts all text content automatically using PDF.js."

### Scene 3: Quick Summarization (20 seconds)
**Visual:**
- Click on the preset prompt "Summarize for procurement officer"
- Show the loading indicator
- Display the structured summary results with:
  - Short summary
  - Relevance to officials (deadlines, money, eligibility)
  - Action items
  - Confidence estimate

**Narration:** "With one click, the application analyzes the document and highlights key information government officials need: deadlines, financial values, eligibility criteria, and contact details."

### Scene 4: Detailed Analysis (15 seconds)
**Visual:**
- Show the right panel with raw extracted text (toggle to show)
- Point out specific extracted information like dates, amounts, contacts
- Show the mock mode indicator

**Narration:** "The application works in mock mode by default, using intelligent pattern recognition to identify critical information. It can also integrate with AI APIs for enhanced analysis."

### Scene 5: Key Features (10 seconds)
**Visual:**
- Show the three-panel layout
- Highlight the chat interface
- Show the confidence indicators
- Demonstrate the collapsible raw text panel

**Narration:** "The clean interface provides immediate access to summaries, detailed analysis, and raw text - perfect for busy government officials who need quick insights."

### Scene 6: Conclusion (10 seconds)
**Visual:** Show the final summary with all highlighted information
**Narration:** "The PDF Summarizer transforms complex government documents into actionable insights, helping officials make informed decisions quickly and efficiently."

## Key Points to Highlight:
1. **Easy file selection** - Just click and choose
2. **Automatic text extraction** - No manual copying needed
3. **Structured output** - Organized information for officials
4. **Government-focused** - Highlights procurement-specific details
5. **Two modes** - Mock mode (offline) and API mode (AI-powered)
6. **Clean interface** - Three-panel layout for easy navigation

## Technical Demo Points:
- Show the application running locally
- Demonstrate both mock and API modes
- Show the confidence scoring system
- Highlight the regex-based pattern detection
- Show the structured JSON output format

## Sample Output to Show:
```json
{
  "short_summary": "Government tender for computer hardware procurement worth ₹75,00,000 with submission deadline of 28/02/2024.",
  "relevance_to_officials": [
    "Deadlines found: 15/01/2024, 28/02/2024, 01/03/2024",
    "Financial values: ₹75,00,000, ₹1,50,000",
    "Contact information: procurement.dp@mod.gov.in, +91-11-23011234",
    "Eligibility criteria mentioned in document",
    "Procurement/tender document identified"
  ],
  "action_items": [
    "Review submission deadlines and plan accordingly",
    "Verify budget allocation and financial requirements",
    "Review eligibility requirements and ensure compliance",
    "Save contact details for inquiries",
    "Review procurement process and requirements"
  ],
  "confidence_estimate": "high"
}
```

## Recording Tips:
- Use a clear, professional voice
- Keep the cursor movements smooth and deliberate
- Show the actual file names and content
- Highlight the key information as it appears
- Use screen annotations to point out important features
- Keep the demo focused and concise
