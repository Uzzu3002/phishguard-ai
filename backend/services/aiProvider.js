import { analyzeEmail as ruleEngineAnalyze } from './ai.service.js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

class AIProvider {
  async explainAnalysis(analysis) {
    const { verdict, riskScore, explanation, recommendations, authenticationResults, subject, sender, snippet } = analysis;
    
    const generateFallback = () => ({
      summary: `This email was classified as ${verdict} with a Threat Score of ${riskScore}/100.`,
      technicalReason: `Authentication checks: ${authenticationResults || 'Not found'}. Triggered heuristics: ${explanation || 'None'}`,
      userExplanation: `We detected some patterns in this email that warrant attention. ${explanation || 'No suspicious language was found.'}`,
      recommendations: recommendations || []
    });

    try {
      const prompt = `Analyze this email payload: 
Subject: ${subject}
Sender: ${sender}
Snippet: ${snippet}
Rule Engine Verdict: ${verdict}
Risk Score: ${riskScore}
Authentication Results: ${authenticationResults}
Rule Engine Explanation: ${explanation}
Rule Engine Recommendations: ${JSON.stringify(recommendations)}

Generate the explanation.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are PhishGuard AI, an elite cybersecurity analyst. Analyze the provided email metadata and rule-engine heuristics. You must return a strict JSON object explaining the threat. Never return markdown, code blocks, or plain text.",
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              summary: { type: "STRING" },
              technicalReason: { type: "STRING" },
              userExplanation: { type: "STRING" },
              recommendations: {
                type: "ARRAY",
                items: { type: "STRING" }
              }
            },
            required: ["summary", "technicalReason", "userExplanation", "recommendations"]
          },
          temperature: 0.1,
          maxOutputTokens: 500
        }
      });

      const parsed = JSON.parse(response.text);
      if (!parsed.summary || !parsed.technicalReason) throw new Error("Invalid schema");
      return parsed;
    } catch (error) {
      console.error("Gemini Explanation Error, falling back to rules:", error.message);
      return generateFallback();
    }
  }

  async analyzeEmail(email) {
    const rawAnalysis = ruleEngineAnalyze(email);
    rawAnalysis.subject = email.subject;
    rawAnalysis.sender = email.sender;
    rawAnalysis.snippet = email.snippet;

    return {
      ...email,
      ...rawAnalysis,
      explainer: await this.explainAnalysis(rawAnalysis)
    };
  }

  async chat(query, scanContext) {
    const q = query.toLowerCase();
    const { scanData, safeCount, reviewCount, highRiskCount, securityScore } = scanContext;
    
    if (q.includes('how many emails') || q.includes('emails were scanned') || q.includes('total')) {
      return `Your latest scan analyzed ${scanData?.scanned || scanData?.results?.length || 0} emails.`;
    } 
    if (q.includes('security score')) {
      return `Your current Security Score is ${securityScore}/100.`;
    }
    if (q.includes('how many phishing') || q.includes('phishing emails')) {
      return `Your latest scan detected ${highRiskCount} high-risk phishing emails.`;
    }
    if (q.includes('how many suspicious') || q.includes('suspicious emails') || q.includes('what should i review')) {
      return `You have ${reviewCount} emails that require manual review.`;
    }
    if (q.includes('is my inbox safe')) {
      if (highRiskCount === 0 && reviewCount === 0) return "Yes! Your inbox is currently safe and healthy.";
      if (highRiskCount > 0) return "No. High-risk phishing emails were detected. Immediate action required.";
      return "Mostly safe, but there are some suspicious emails you should review.";
    }
    if (q.includes('summarize')) {
      return `The latest scan analyzed ${scanData?.scanned || scanData?.results?.length || 0} emails.\n\n${safeCount} are safe.\n\n${reviewCount} require manual review.\n\n${highRiskCount} high-risk phishing email was detected.\n\nCurrent Security Score: ${securityScore}/100.`;
    }
    if (q.includes('dangerous sender')) {
      const top = [...(scanData?.results || [])].sort((a,b)=> (b.riskScore||0) - (a.riskScore||0))[0];
      if (top) return `The most dangerous sender detected is:\n${top.sender}\nRisk Score: ${top.riskScore}`;
      return "No dangerous senders detected.";
    }
    if (q.includes('highest risk email')) {
      const top = [...(scanData?.results || [])].sort((a,b)=> (b.riskScore||0) - (a.riskScore||0))[0];
      if (top) return `The highest risk email is titled:\n"${top.subject}"\nFrom: ${top.sender}`;
      return "No high-risk emails detected.";
    }
    if (q.includes('show high-risk') || q.includes('high-risk emails')) {
      const threats = [...(scanData?.results || [])].filter(e => e.verdict === 'HIGH_RISK');
      if (threats.length > 0) return `Found ${threats.length} high-risk emails.\n\nTop subject: "${threats[0].subject}"`;
      return "No high-risk emails found.";
    }
    if (q.includes('show suspicious')) {
      const threats = [...(scanData?.results || [])].filter(e => e.verdict === 'REVIEW');
      if (threats.length > 0) return `Found ${threats.length} suspicious emails.\n\nTop subject: "${threats[0].subject}"`;
      return "No suspicious emails found.";
    }
    if (q.includes('what should i do next') || q.includes('do next')) {
      if (highRiskCount > 0) {
        return "• Review high-risk emails immediately.\n• Avoid clicking suspicious links.\n• Verify sender identities.\n• Delete confirmed phishing emails.";
      } 
      if (reviewCount > 0) {
        return "• Review suspicious emails carefully.";
      }
      return "No immediate action is required. Continue monitoring your inbox.";
    }
    
    return "I don't have enough information to answer that yet.";
  }
}

export default new AIProvider();
