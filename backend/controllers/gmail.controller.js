import { fetchLatestEmails, getStoredEmails, getEmail as fetchSpecificEmail, extractBody } from '../services/gmail.service.js';
import aiProvider from '../services/aiProvider.js';

// One in-flight scan per user: concurrent requests (double renders, multiple tabs) share it
const inFlightScans = new Map();

const analyzeAll = async (rawEmails) => {
  const settled = await Promise.allSettled(rawEmails.map(email => aiProvider.analyzeEmail(email)));
  return settled.filter(r => r.status === 'fulfilled').map(r => r.value);
};

const logGmailError =(label, error) => {
  console.error(`${label}:`, error.message || error);
  if (error.response?.data) console.error(error.response.data);
};

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
      emails = await analyzeAll(rawEmails);
    } else {
      // Attempt to get from cache first
      let rawEmails = getStoredEmails(req.user.id);

      if (!rawEmails || rawEmails.length === 0) {
        // If not in cache, fetch them
        rawEmails = await fetchLatestEmails(req.user.id, accessToken, refreshToken, userEmail, 100);
      }
      emails = await analyzeAll(rawEmails);
    }

    res.json({
      success: true,
      message: "Successfully fetched emails",
      data: emails
    });
  } catch (error) {
    logGmailError("Gmail API list error", error);
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
      replyTo: getHeader('Reply-To'),
      recipient: toHeader ? toHeader.value : 'Unknown Recipient',
      date: dateHeader || null,
      authenticationResults: authResultsHeader || ''
    };

    // Body text, HTML and links feed the rule engine's link checks; they are not sent to the client
    const body = extractBody(payload);
    const analysis = await aiProvider.analyzeEmail(
      { ...normalizedEmail, ...body },
      { explain: true, cacheKey: req.params.id }
    );
    delete analysis.payload;
    delete analysis.bodyText;
    delete analysis.bodyHtml;

    res.json({
      success: true,
      data: {
        ...normalizedEmail,
        analysis
      }
    });
  } catch (error) {
    logGmailError("Gmail API detail error", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch email details" });
  }
};

const runScan = async (user) => {
  const { accessToken, refreshToken } = user.tokens;
  const rawEmails = await fetchLatestEmails(user.id, accessToken, refreshToken, user.email, 100);
  const scannedResults = await analyzeAll(rawEmails);

  return {
    scanned: scannedResults.length,
    threatsFound: scannedResults.filter(e => e.verdict === 'HIGH_RISK').length,
    results: scannedResults
  };
};

export const scanInbox = async (req, res) => {
  try {
    const userId = req.user.id;
    let scan = inFlightScans.get(userId);
    if (!scan) {
      scan = runScan(req.user).finally(() => inFlightScans.delete(userId));
      inFlightScans.set(userId, scan);
    }

    res.json({
      success: true,
      message: "Inbox scan complete",
      data: await scan
    });
  } catch (error) {
    console.error("Gmail API Scan Error:", error.message || error);
    res.status(500).json({ success: false, message: error.message || "Failed to scan inbox" });
  }
};
