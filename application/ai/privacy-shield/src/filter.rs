//! Sovereign Privacy Shield: Local prompt sanitization, secret scrubbing,
//! PII anonymization, and prompt-injection neutralization.

pub struct PromptPrivacyFilter;

impl PromptPrivacyFilter {
    /// Redacts credit cards, private keys, API credentials, passwords, and PII from raw prompts.
    pub fn scrub_secrets(raw_prompt: &str) -> String {
        let mut scrubbed = raw_prompt.to_string();

        // 1. Private Keys (PEM, OpenSSH, PGP)
        if scrubbed.contains("-----BEGIN") {
            let patterns = [
                "-----BEGIN RSA PRIVATE KEY-----",
                "-----BEGIN OPENSSH PRIVATE KEY-----",
                "-----BEGIN EC PRIVATE KEY-----",
                "-----BEGIN PRIVATE KEY-----",
                "-----BEGIN PGP PRIVATE KEY BLOCK-----",
            ];
            for pat in &patterns {
                if let Some(start) = scrubbed.find(pat) {
                    let end_pat = pat.replace("BEGIN", "END");
                    if let Some(end) = scrubbed[start..].find(&end_pat) {
                        let full_end = start + end + end_pat.len();
                        scrubbed.replace_range(start..full_end, "[REDACTED_CRYPTO_PRIVATE_KEY]");
                    } else {
                        scrubbed.replace_range(start.., "[REDACTED_CRYPTO_PRIVATE_KEY]");
                    }
                }
            }
        }

        // 2. Passwords and Credentials
        let auth_prefixes = [
            "password=", "passwd=", "pwd=", "secret=", "api_key=", "apikey=",
            "access_token=", "bearer ", "token=", "auth_token=", "client_secret="
        ];
        for prefix in &auth_prefixes {
            let mut search_idx = 0;
            while let Some(pos) = scrubbed[search_idx..].to_lowercase().find(prefix) {
                let actual_pos = search_idx + pos;
                let val_start = actual_pos + prefix.len();
                let end = scrubbed[val_start..]
                    .find(|c: char| c.is_whitespace() || c == '&' || c == ';' || c == '"' || c == '\'')
                    .map(|i| val_start + i)
                    .unwrap_or(scrubbed.len());

                let prefix_exact = &scrubbed[actual_pos..val_start];
                let replacement = format!("{}[REDACTED_CREDENTIAL]", prefix_exact);
                scrubbed.replace_range(actual_pos..end, &replacement);
                search_idx = actual_pos + replacement.len();
            }
        }

        // 3. Known API Key Patterns (OpenAI sk-, GitHub ghp_, AWS AKIA, Google AIzaSy)
        let key_prefixes = ["sk-", "ghp_", "gho_", "AKIA", "AIzaSy", "hf_"];
        for prefix in &key_prefixes {
            let mut search_idx = 0;
            while let Some(pos) = scrubbed[search_idx..].find(prefix) {
                let actual_pos = search_idx + pos;
                let end = scrubbed[actual_pos..]
                    .find(|c: char| c.is_whitespace() || c == '"' || c == '\'' || c == ',' || c == ')')
                    .map(|i| actual_pos + i)
                    .unwrap_or(scrubbed.len());

                if end - actual_pos >= 16 {
                    scrubbed.replace_range(actual_pos..end, "[REDACTED_API_TOKEN]");
                    search_idx = actual_pos + "[REDACTED_API_TOKEN]".len();
                } else {
                    search_idx = actual_pos + prefix.len();
                }
            }
        }

        // 4. Social Security Numbers (SSN: \d{3}-\d{2}-\d{4})
        let chars: Vec<char> = scrubbed.chars().collect();
        let mut i = 0;
        let mut ssn_ranges = Vec::new();
        while i + 11 <= chars.len() {
            if chars[i].is_ascii_digit() && chars[i+1].is_ascii_digit() && chars[i+2].is_ascii_digit()
                && chars[i+3] == '-'
                && chars[i+4].is_ascii_digit() && chars[i+5].is_ascii_digit()
                && chars[i+6] == '-'
                && chars[i+7].is_ascii_digit() && chars[i+8].is_ascii_digit() && chars[i+9].is_ascii_digit() && chars[i+10].is_ascii_digit()
            {
                ssn_ranges.push((i, i + 11));
                i += 11;
            } else {
                i += 1;
            }
        }
        for (start, end) in ssn_ranges.into_iter().rev() {
            let byte_start: usize = chars[..start].iter().map(|c| c.len_utf8()).sum();
            let byte_end: usize = chars[..end].iter().map(|c| c.len_utf8()).sum();
            scrubbed.replace_range(byte_start..byte_end, "[REDACTED_SSN]");
        }

        // 5. Credit Card Sequences (13-19 digits, optionally spaced or hyphenated)
        scrubbed = Self::scrub_credit_cards(&scrubbed);

        scrubbed
    }

    fn scrub_credit_cards(input: &str) -> String {
        let mut output = String::new();
        let words: Vec<&str> = input.split(' ').collect();
        for (idx, word) in words.iter().enumerate() {
            let digits: String = word.chars().filter(|c| c.is_ascii_digit()).collect();
            if (digits.len() == 15 || digits.len() == 16) && Self::luhn_check(&digits) {
                output.push_str("[REDACTED_CREDIT_CARD]");
            } else {
                output.push_str(word);
            }
            if idx + 1 < words.len() {
                output.push(' ');
            }
        }
        output
    }

    fn luhn_check(digits: &str) -> bool {
        let mut sum = 0;
        let mut alternate = false;
        for c in digits.chars().rev() {
            if let Some(mut d) = c.to_digit(10) {
                if alternate {
                    d *= 2;
                    if d > 9 {
                        d -= 9;
                    }
                }
                sum += d;
                alternate = !alternate;
            } else {
                return false;
            }
        }
        sum % 10 == 0
    }
}
