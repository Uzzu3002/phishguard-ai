export const analyzeEmail = (email) => {
  let riskScore = 0;
  const reasons = [];
  const recommendations = [];

  const subject = (email.subject || '').toLowerCase();
  const snippet = (email.snippet || '').toLowerCase();
  const sender = (email.sender || '').toLowerCase();
  const authResults = (email.authenticationResults || '').toLowerCase();

  // 1. Header Validation (SPF, DKIM, DMARC)
  if (authResults.includes('spf=fail') || authResults.includes('spf=softfail')) {
    riskScore += 30;
    reasons.push('SPF authentication failed.');
  }
  if (authResults.includes('dkim=fail')) {
    riskScore += 30;
    reasons.push('DKIM signature validation failed.');
  }
  if (authResults.includes('dmarc=fail')) {
    riskScore += 30;
    reasons.push('DMARC policy check failed.');
  }

  // 2. Urgent Language / Social Engineering
  const urgentKeywords = ['urgent', 'immediate', 'action required', 'suspended', 'restricted'];
  const hasUrgent = urgentKeywords.some(keyword => subject.includes(keyword) || snippet.includes(keyword));
  if (hasUrgent) {
    riskScore += 20;
    reasons.push('Contains urgent or threatening language typical of social engineering.');
  }

  // 3. Credential Harvesting & Financial Fraud
  const financialKeywords = ['invoice', 'payment', 'wire transfer', 'billing', 'receipt'];
  const credentialKeywords = ['password reset', 'verify your account', 'login to continue', 'unauthorized access'];
  
  if (credentialKeywords.some(kw => subject.includes(kw) || snippet.includes(kw))) {
    riskScore += 25;
    reasons.push('Language highly suggestive of credential harvesting.');
  }
  if (financialKeywords.some(kw => subject.includes(kw) || snippet.includes(kw))) {
    riskScore += 15;
    reasons.push('Mentions financial transactions which are common in phishing payloads.');
  }

  // 4. Sender Analysis (Basic Heuristics)
  const suspiciousDomains = ['.zip', '.xyz', '.loan', '.top', 'support-'];
  if (suspiciousDomains.some(domain => sender.includes(domain))) {
    riskScore += 25;
    reasons.push('Sender domain has a poor reputation or uses a suspicious TLD.');
  }

  // Final Verdict Logic
  riskScore = Math.min(riskScore, 100);
  let verdict = 'SAFE';
  
  if (riskScore >= 70) {
    verdict = 'HIGH_RISK';
    recommendations.push('Do not click any links or download attachments.');
    recommendations.push('Delete this email immediately.');
  } else if (riskScore >= 30) {
    verdict = 'REVIEW';
    recommendations.push('Verify the sender\'s identity out-of-band before responding.');
  } else {
    recommendations.push('No obvious threats detected. Proceed with normal caution.');
    if (reasons.length === 0) {
       reasons.push('Authentication passed and no suspicious language detected.');
    }
  }

  return {
    sender: email.sender,
    subject: email.subject,
    snippet: email.snippet,
    riskScore,
    verdict,
    explanation: reasons.join(' '),
    recommendations,
    authenticationResults: email.authenticationResults || 'Not found',
    urlsFound: 0, // Placeholder for URL parser
    attachmentsFound: 0 // Placeholder for attachment parser
  };
};
