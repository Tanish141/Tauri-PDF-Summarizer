#[cfg(test)]
mod tests {
    use super::*;
    use crate::mock_summarize;

    #[test]
    fn test_mock_summarizer_with_tender_document() {
        let sample_text = r#"
        GOVERNMENT OF INDIA
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
        - Non-compliance: 5% of contract value
        
        Required Documents:
        1. Company registration certificate
        2. GST certificate
        3. Financial statements
        4. Technical specifications
        "#;

        let result = mock_summarize(sample_text);
        
        // Test that we get a valid summary
        assert!(!result.short_summary.is_empty());
        assert!(!result.relevance_to_officials.is_empty());
        assert!(!result.action_items.is_empty());
        assert!(["low", "medium", "high"].contains(&result.confidence_estimate.as_str()));
        
        // Test that we detected key information
        let relevance_text = result.relevance_to_officials.join(" ");
        assert!(relevance_text.contains("Deadlines") || relevance_text.contains("28/02/2024"));
        assert!(relevance_text.contains("Financial") || relevance_text.contains("₹50,00,000"));
        assert!(relevance_text.contains("Contact") || relevance_text.contains("procurement@mod.gov.in"));
        
        // Test that we have action items
        let action_text = result.action_items.join(" ");
        assert!(action_text.contains("deadline") || action_text.contains("contact") || action_text.contains("eligibility"));
    }

    #[test]
    fn test_mock_summarizer_with_empty_text() {
        let result = mock_summarize("");
        
        assert_eq!(result.short_summary, "Document processed successfully");
        assert!(result.relevance_to_officials.is_empty());
        assert!(result.action_items.is_empty());
        assert_eq!(result.confidence_estimate, "low");
    }

    #[test]
    fn test_mock_summarizer_with_minimal_text() {
        let sample_text = "This is a simple document with no special information.";
        let result = mock_summarize(sample_text);
        
        assert!(!result.short_summary.is_empty());
        assert_eq!(result.confidence_estimate, "low");
    }
}
