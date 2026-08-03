import { fetchLatestEmails, getStoredEmails, getEmail as fetchSpecificEmail } from '../services/gmail.service.js';
import aiProvider from '../services/aiProvider.js';

export const listEmails = async (req, res) => {
  try {
    const accessToken = req.user?.tokens?.accessToken;
    const refreshToken = req.user?.tokens?.refreshToken;
    const userEmail = req.user?.email;
    const query = req.query.q;

    let emails;
    
    if (query) {
      // Direct API fetch for search, bypass cache
      const rawEmails = await fetchLatestEmails(req.user.id, accessToken, refreshToken, userEmail, 50, query);
      const settled = await Promise.allSettled(rawEmails.map(email => aiProvider.analyzeEmail(email)));
      emails = settled.filter(r => r.status === 'fulfilled').map(r => r.value);
    } else {
      // Attempt to get from cache first
      emails = getStoredEmails(req.user.id);
      
      if (!emails || emails.length === 0) {
        // If not in cache, fetch them
        const rawEmails = await fetchLatestEmails(req.user.id, accessToken, refreshToken, userEmail, 100);
        const settled = await Promise.allSettled(rawEmails.map(email => aiProvider.analyzeEmail(email)));
        emails = settled.filter(r => r.status === 'fulfilled').map(r => r.value);
      }
    }

    res.json({
      success: true,
      message: "Successfully fetched emails",
      data: emails
    });
  } catch (error) {
    console.error("========== GMAIL API ERROR ==========");
    console.error(error);
    console.error(error.response?.data);
    console.error(error.stack);
    console.error("Session:", req.session);
    console.error("User:", req.user);
    console.error("====================================");
    res.status(500).json({ success: false, message: error.message || "Failed to fetch emails" });
  }
};

export const getEmail = async (req, res) => {
  try {
    const accessToken = req.user?.tokens?.accessToken;
    const refreshToken = req.user?.tokens?.refreshToken;
    const userEmail = req.user?.email;

    const emailDetail = await fetchSpecificEmail(accessToken, refreshToken, userEmail, req.params.id);
    
    const payload = emailDetail?.payload ?? {};
    const headers = payload.headers ?? [];
    
    const getHeader = (name) => {
      const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
      return header ? header.value : null;
    };

    const subjectHeader = getHeader('Subject');
    const fromHeader = getHeader('From');
    const toHeader = headers.find(h => h.name?.toLowerCase() === 'to' || h.name?.toLowerCase() === 'delivered-to');
    const dateHeader = getHeader('Date');
    const authResultsHeader = getHeader('Authentication-Results');

    const normalizedEmail = {
      ...emailDetail,
      subject: subjectHeader || '(No Subject)',
      sender: fromHeader || 'Unknown Sender',
      recipient: toHeader ? toHeader.value : 'Unknown Recipient',
      date: dateHeader || null,
      authenticationResults: authResultsHeader || ''
    };

    const analysis = await aiProvider.analyzeEmail(normalizedEmail);
    
    res.json({
      success: true,
      data: {
        ...normalizedEmail,
        analysis
      }
    });
  } catch (error) {
    console.error("========== GMAIL API ERROR ==========");
    console.error(error);
    console.error(error.response?.data);
    console.error(error.stack);
    console.error("Session:", req.session);
    console.error("User:", req.user);
    console.error("====================================");
    res.status(500).json({ success: false, message: error.message || "Failed to fetch email details" });
  }
};

export const scanInbox = async (req, res) => {
  try {
    const accessToken = req.user?.tokens?.accessToken;
    const refreshToken = req.user?.tokens?.refreshToken;
    const userEmail = req.user?.email;

    const rawEmails = await fetchLatestEmails(req.user.id, accessToken, refreshToken, userEmail, 100);
    
    const scannedSettled = await Promise.allSettled(rawEmails.map(email => aiProvider.analyzeEmail(email)));
    const scannedResults = scannedSettled.filter(r => r.status === 'fulfilled').map(r => r.value);

    const threatsFound = scannedResults.filter(e => e.verdict === 'HIGH_RISK').length;

    const finalResponse = {
      success: true,
      message: "Inbox scan complete",
      data: {
        scanned: scannedResults.length,
        threatsFound,
        results: scannedResults
      }
    };
    res.json(finalResponse);
  } catch (error) {
    console.error("Gmail API Scan Error:", error.message || error);
    res.status(500).json({ success: false, message: error.message || "Failed to scan inbox" });
  }
};
