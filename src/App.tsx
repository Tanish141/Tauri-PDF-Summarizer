import React, { useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface SummaryResult {
  short_summary: string;
  relevance_to_officials: string[];
  action_items: string[];
  confidence_estimate: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  summary?: SummaryResult;
}

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showRawText, setShowRawText] = useState<boolean>(false);
  const [useApiMode, setUseApiMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample text on component mount
  React.useEffect(() => {
    const sampleText = `GOVERNMENT OF INDIA
MINISTRY OF DEFENCE
TENDER NOTICE

Tender No: MOD/2024/001
Date: 15/01/2024
Last Date of Submission: 28/02/2024

Procurement of Computer Equipment
Estimated Value: ₹50,00,000 (Fifty Lakh Rupees)

Eligibility Criteria:
- Minimum 3 years experience in IT equipment supply
- Annual turnover of at least ₹1 crore
- Valid GST registration

Contact Details:
Email: procurement@mod.gov.in
Phone: +91-11-23011234

Penalties:
- Late submission: ₹10,000 per day
- Non-compliance: 5% of contract value`;

    setExtractedText(sampleText);
  }, []);

  // Browser-based mock summarizer (same logic as Rust version)
  const mockSummarize = (text: string): SummaryResult => {
    const relevancePoints: string[] = [];
    const actionItems: string[] = [];
    
    // Extract dates (deadlines)
    const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi;
    const dates = text.match(datePattern) || [];
    if (dates.length > 0) {
      relevancePoints.push(`Deadlines found: ${dates.slice(0, 5).join(', ')}`);
      actionItems.push('Review submission deadlines and plan accordingly');
    }
    
    // Extract money amounts
    const moneyPattern = /₹\s*[\d,]+(?:\.\d{2})?|\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:lakh|crore|thousand|million|billion)\b/gi;
    const amounts = text.match(moneyPattern) || [];
    if (amounts.length > 0) {
      relevancePoints.push(`Financial values: ${amounts.slice(0, 5).join(', ')}`);
      actionItems.push('Verify budget allocation and financial requirements');
    }
    
    // Extract eligibility criteria
    const eligibilityKeywords = ['eligibility', 'qualification', 'criteria', 'requirement', 'minimum'];
    const hasEligibility = eligibilityKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    if (hasEligibility) {
      relevancePoints.push('Eligibility criteria mentioned in document');
      actionItems.push('Review eligibility requirements and ensure compliance');
    }
    
    // Extract contact information
    const contactPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\b(?:\+91|0)?[6-9]\d{9}\b/g;
    const contacts = text.match(contactPattern) || [];
    if (contacts.length > 0) {
      relevancePoints.push(`Contact information: ${contacts.slice(0, 3).join(', ')}`);
      actionItems.push('Save contact details for inquiries');
    }
    
    // Extract tender/procurement keywords
    const procurementKeywords = ['tender', 'procurement', 'bid', 'quotation', 'rfp', 'rfq'];
    const hasProcurement = procurementKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    if (hasProcurement) {
      relevancePoints.push('Procurement/tender document identified');
      actionItems.push('Review procurement process and requirements');
    }
    
    // Generate short summary from first few sentences
    const sentences = text.split('.').slice(0, 3);
    const shortSummary = sentences.join('. ').trim() || 'Document processed successfully';
    
    // Determine confidence based on extracted information
    let confidence = 'low';
    if (relevancePoints.length >= 3) {
      confidence = 'high';
    } else if (relevancePoints.length >= 1) {
      confidence = 'medium';
    }
    
    return {
      short_summary: shortSummary,
      relevance_to_officials: relevancePoints,
      action_items: actionItems,
      confidence_estimate: confidence
    };
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'PDF Files',
            extensions: ['pdf']
          },
          {
            name: 'Text Files',
            extensions: ['txt']
          }
        ]
      });

      if (selected && typeof selected === 'string') {
        // Create a file object from the selected path
        const fileName = selected.split(/[\\/]/).pop() || 'document.pdf';
        const fileType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'text/plain';
        
        // For now, let's use a simple approach - read the file content
        try {
          const response = await fetch(`file://${selected}`);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: fileType });
          
          setPdfFile(file);
          setIsLoading(true);
          
          if (fileType === 'application/pdf') {
            const text = await extractTextFromPDF(file);
            setExtractedText(text);
          } else {
            // For text files, read directly
            const text = await blob.text();
            setExtractedText(text);
          }
        } catch (fetchError) {
          // Fallback: create a mock file object
          const mockFile = new File([''], fileName, { type: fileType });
          setPdfFile(mockFile);
          setExtractedText(`File selected: ${fileName}\n\nThis is a demo. In the full Tauri app, the file content would be extracted here.`);
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      // Fallback to HTML file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setIsLoading(true);

    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        setExtractedText(text);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        setExtractedText(text);
      } else {
        setExtractedText('Please select a PDF or text file.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setExtractedText('Error processing file. Please try a different file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle specific queries
  const handleSpecificQuery = (prompt: string, text: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Deadline queries
    if (lowerPrompt.includes('deadline') || lowerPrompt.includes('due date') || lowerPrompt.includes('submission date')) {
      const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi;
      const dates = text.match(datePattern) || [];
      if (dates.length > 0) {
        return `📅 **Deadlines Found:**\n${dates.map(date => `• ${date}`).join('\n')}`;
      }
      return "❌ No specific deadlines found in the document.";
    }
    
    // Financial queries
    if (lowerPrompt.includes('cost') || lowerPrompt.includes('price') || lowerPrompt.includes('value') || lowerPrompt.includes('amount') || lowerPrompt.includes('budget')) {
      const moneyPattern = /₹\s*[\d,]+(?:\.\d{2})?|\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:lakh|crore|thousand|million|billion)\b/gi;
      const amounts = text.match(moneyPattern) || [];
      if (amounts.length > 0) {
        return `💰 **Financial Information:**\n${amounts.map(amount => `• ${amount}`).join('\n')}`;
      }
      return "❌ No financial information found in the document.";
    }
    
    // Contact queries
    if (lowerPrompt.includes('contact') || lowerPrompt.includes('email') || lowerPrompt.includes('phone') || lowerPrompt.includes('address')) {
      const contactPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\b(?:\+91|0)?[6-9]\d{9}\b/g;
      const contacts = text.match(contactPattern) || [];
      if (contacts.length > 0) {
        return `📞 **Contact Information:**\n${contacts.map(contact => `• ${contact}`).join('\n')}`;
      }
      return "❌ No contact information found in the document.";
    }
    
    // Eligibility queries
    if (lowerPrompt.includes('eligibility') || lowerPrompt.includes('qualification') || lowerPrompt.includes('criteria') || lowerPrompt.includes('requirement')) {
      const lines = text.split('\n');
      const eligibilityLines = lines.filter(line => 
        line.toLowerCase().includes('eligibility') || 
        line.toLowerCase().includes('qualification') || 
        line.toLowerCase().includes('criteria') ||
        line.toLowerCase().includes('requirement')
      );
      if (eligibilityLines.length > 0) {
        return `📋 **Eligibility Information:**\n${eligibilityLines.map(line => `• ${line.trim()}`).join('\n')}`;
      }
      return "❌ No eligibility information found in the document.";
    }
    
    // Penalty queries
    if (lowerPrompt.includes('penalty') || lowerPrompt.includes('fine') || lowerPrompt.includes('penalties')) {
      const lines = text.split('\n');
      const penaltyLines = lines.filter(line => 
        line.toLowerCase().includes('penalty') || 
        line.toLowerCase().includes('fine') ||
        line.toLowerCase().includes('late')
      );
      if (penaltyLines.length > 0) {
        return `⚠️ **Penalty Information:**\n${penaltyLines.map(line => `• ${line.trim()}`).join('\n')}`;
      }
      return "❌ No penalty information found in the document.";
    }
    
    // Document type queries
    if (lowerPrompt.includes('what is this') || lowerPrompt.includes('type of document') || lowerPrompt.includes('document type')) {
      const procurementKeywords = ['tender', 'procurement', 'bid', 'quotation', 'rfp', 'rfq'];
      const foundKeywords = procurementKeywords.filter(keyword => 
        text.toLowerCase().includes(keyword)
      );
      if (foundKeywords.length > 0) {
        return `📄 **Document Type:** This appears to be a ${foundKeywords[0].toUpperCase()} document for government procurement.`;
      }
      return "📄 **Document Type:** Government procurement document";
    }
    
    // If no specific query matches, return null to trigger full summary
    return null;
  };

  const handleSummarize = async (prompt: string = inputMessage) => {
    if (!extractedText.trim()) {
      alert('Please select and process a PDF first.');
      return;
    }

    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      // Check if this is a specific query first
      const specificResponse = handleSpecificQuery(prompt, extractedText);
      
      if (specificResponse) {
        // Handle specific query
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: specificResponse
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle general summarization
        let result: SummaryResult;
        
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
          // Use Tauri commands
          const command = useApiMode ? 'summarize_text_api' : 'summarize_text_mock';
          result = await invoke<SummaryResult>(command, {
            request: { text: extractedText }
          });
        } else {
          // Use browser-based mock summarizer
          result = mockSummarize(extractedText);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: 'Here is the complete summary for government officials:',
          summary: result
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${error}. ${useApiMode ? 'Try switching to mock mode or check your API key.' : 'Please try again.'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetPrompt = () => {
    const presetPrompt = "Summarize for procurement officer";
    setInputMessage(presetPrompt);
    handleSummarize(presetPrompt);
  };

  const renderSummary = (summary: SummaryResult) => (
    <div className="summary-section">
      <h3>Summary</h3>
      <p>{summary.short_summary}</p>
      
      <h3>Relevance to Officials</h3>
      <ul>
        {summary.relevance_to_officials.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      
      <h3>Action Items</h3>
      <ul>
        {summary.action_items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      
      <h3>Confidence</h3>
      <span className={`confidence ${summary.confidence_estimate}`}>
        {summary.confidence_estimate}
      </span>
    </div>
  );

  return (
    <div className="app">
      {/* Hidden file input for fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      
      {/* Left Panel - PDF Viewer */}
      <div className="panel">
        <div className="panel-header">PDF Viewer</div>
        <div className="panel-content">
          <div className="pdf-viewer">
            {!pdfFile ? (
              <>
                <h3>Select a PDF Document</h3>
                <p>Choose a government tender or procurement document to analyze</p>
                <button className="file-input" onClick={handleFileSelect}>
                  Choose PDF File
                </button>
              </>
            ) : (
              <div className="file-info">
                <h3>📄 {pdfFile.name}</h3>
                <p>File loaded successfully</p>
                <p>Text extracted: {extractedText.length} characters</p>
                <button className="file-input" onClick={handleFileSelect} style={{ marginTop: '12px' }}>
                  Choose Different File
                </button>
              </div>
            )}
            {isLoading && <div className="loading">Processing PDF...</div>}
          </div>
        </div>
      </div>

      {/* Center Panel - Chat Interface */}
      <div className="panel">
        <div className="panel-header">
          Chat Interface
          <button 
            className="toggle-button" 
            onClick={() => setUseApiMode(!useApiMode)}
            style={{ position: 'absolute', right: '16px', top: '16px' }}
          >
            {useApiMode ? 'API Mode' : 'Mock Mode'}
          </button>
        </div>
        <div className="panel-content">
          <div className="chat-container">
            <div className="preset-prompt" onClick={handlePresetPrompt}>
              <h4>🚀 Quick Start</h4>
              <p>Click here to summarize for procurement officer</p>
            </div>
            
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>💡 Try These Queries:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  'Give me the deadline',
                  'What is the cost?',
                  'Show me contact details',
                  'What are the eligibility criteria?',
                  'Tell me about penalties'
                ].map((query, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(query);
                      handleSummarize(query);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      background: '#e9ecef',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#dee2e6'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#e9ecef'}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div>{message.content}</div>
                  {message.summary && renderSummary(message.summary)}
                </div>
              ))}
              {isLoading && (
                <div className="message assistant">
                  <div className="loading">Analyzing document...</div>
                </div>
              )}
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about the document..."
                onKeyPress={(e) => e.key === 'Enter' && handleSummarize()}
                disabled={isLoading}
              />
              <button 
                onClick={() => handleSummarize()} 
                disabled={isLoading || !inputMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Raw Text */}
      <div className="panel">
        <div className="panel-header">
          Raw Extracted Text
          <button 
            className="toggle-button" 
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="panel-content">
          {showRawText ? (
            <div className="raw-text">
              {extractedText || 'No text extracted yet. Please select a PDF file.'}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
              <p>Click "Show" to view extracted text</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
