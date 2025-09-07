// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

mod lib;

#[derive(Debug, Serialize, Deserialize)]
pub struct SummaryResult {
    pub short_summary: String,
    pub relevance_to_officials: Vec<String>,
    pub action_items: Vec<String>,
    pub confidence_estimate: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MockSummaryRequest {
    pub text: String,
}

// Mock summarizer that extracts key information using regex patterns
fn mock_summarize(text: &str) -> SummaryResult {
    let mut relevance_points = Vec::new();
    let mut action_items = Vec::new();
    
    // Extract dates (deadlines)
    let date_pattern = regex::Regex::new(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b").unwrap();
    let dates: Vec<&str> = date_pattern.find_iter(text).map(|m| m.as_str()).collect();
    if !dates.is_empty() {
        relevance_points.push(format!("Deadlines found: {}", dates.join(", ")));
        action_items.push("Review submission deadlines and plan accordingly");
    }
    
    // Extract money amounts
    let money_pattern = regex::Regex::new(r"₹\s*[\d,]+(?:\.\d{2})?|\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:lakh|crore|thousand|million|billion)\b").unwrap();
    let amounts: Vec<&str> = money_pattern.find_iter(text).map(|m| m.as_str()).collect();
    if !amounts.is_empty() {
        relevance_points.push(format!("Financial values: {}", amounts.join(", ")));
        action_items.push("Verify budget allocation and financial requirements");
    }
    
    // Extract eligibility criteria
    let eligibility_keywords = ["eligibility", "qualification", "criteria", "requirement", "minimum"];
    let mut eligibility_found = false;
    for keyword in &eligibility_keywords {
        if text.to_lowercase().contains(keyword) {
            eligibility_found = true;
            break;
        }
    }
    if eligibility_found {
        relevance_points.push("Eligibility criteria mentioned in document");
        action_items.push("Review eligibility requirements and ensure compliance");
    }
    
    // Extract contact information
    let contact_pattern = regex::Regex::new(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\b(?:\+91|0)?[6-9]\d{9}\b").unwrap();
    let contacts: Vec<&str> = contact_pattern.find_iter(text).map(|m| m.as_str()).collect();
    if !contacts.is_empty() {
        relevance_points.push(format!("Contact information: {}", contacts.join(", ")));
        action_items.push("Save contact details for inquiries");
    }
    
    // Extract tender/procurement keywords
    let procurement_keywords = ["tender", "procurement", "bid", "quotation", "rfp", "rfq"];
    let mut procurement_found = false;
    for keyword in &procurement_keywords {
        if text.to_lowercase().contains(keyword) {
            procurement_found = true;
            break;
        }
    }
    if procurement_found {
        relevance_points.push("Procurement/tender document identified");
        action_items.push("Review procurement process and requirements");
    }
    
    // Generate short summary from first few sentences
    let sentences: Vec<&str> = text.split('.').take(3).collect();
    let short_summary = sentences.join(". ").trim().to_string();
    
    // Determine confidence based on extracted information
    let confidence = if relevance_points.len() >= 3 {
        "high"
    } else if relevance_points.len() >= 1 {
        "medium"
    } else {
        "low"
    };
    
    SummaryResult {
        short_summary: if short_summary.is_empty() { "Document processed successfully".to_string() } else { short_summary },
        relevance_to_officials: relevance_points,
        action_items,
        confidence_estimate: confidence.to_string(),
    }
}

// Tauri command to summarize text using mock summarizer
#[tauri::command]
async fn summarize_text_mock(request: MockSummaryRequest) -> Result<SummaryResult, String> {
    Ok(mock_summarize(&request.text))
}

// Tauri command to summarize text using OpenRouter API
#[tauri::command]
async fn summarize_text_api(request: MockSummaryRequest) -> Result<SummaryResult, String> {
    let api_key = std::env::var("OPENROUTER_API_KEY").unwrap_or_default();
    
    if api_key.is_empty() {
        return Err("OpenRouter API key not found. Please set OPENROUTER_API_KEY environment variable or use mock mode.".to_string());
    }
    
    let client = reqwest::Client::new();
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert("Authorization", format!("Bearer {}", api_key).parse().unwrap());
    headers.insert("Content-Type", "application/json".parse().unwrap());
    headers.insert("HTTP-Referer", "http://localhost:3000".parse().unwrap());
    headers.insert("X-Title", "PDF Summarizer".parse().unwrap());
    
    let prompt = format!(
        "You are a summarizer for Indian government procurement officers. From the provided document extract the most important bullets an officer needs to act on: procurement value, submission deadline(s), eligibility criteria, required documents, penalties, key contacts, and suggested next steps. Return JSON with keys short_summary, relevance_to_officials (array), action_items (array), confidence_estimate.\n\nDocument text:\n{}",
        request.text
    );
    
    let payload = serde_json::json!({
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 1000,
        "temperature": 0.3
    });
    
    let response = client
        .post("https://openrouter.ai/api/v1/chat/completions")
        .headers(headers)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("API request failed with status: {}", response.status()));
    }
    
    let response_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse API response: {}", e))?;
    
    let content = response_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or("No content in API response")?;
    
    // Try to parse JSON from the response
    let summary: SummaryResult = serde_json::from_str(content)
        .map_err(|e| format!("Failed to parse summary JSON: {}", e))?;
    
    Ok(summary)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![summarize_text_mock, summarize_text_api])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
