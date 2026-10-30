import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

// In-memory email store mapping session/userId to emails
const emailCache = new Map();

const GMAIL_FETCH_CONCURRENCY = 10;

// Gmail returns snippets HTML-escaped (e.g. "&amp;", "&#39;")
const HTML_ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
const decodeEntities = (text) =>
  text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity]);

// Runs fn over items with at most `limit` calls in flight, preserving order
const mapWithConcurrency = async (items, limit, fn) => {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

export const getGmailClient = (accessToken, refreshToken, userEmail) => {

  if (!accessToken) {
    throw new Error("Google access token missing from session");
  }

  if (!refreshToken) {
    console.warn("WARNING: Refresh token is missing from session. Continuing with Access Token only.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ 
    access_token: accessToken,
    refresh_token: refreshToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

export const fetchLatestEmails = async (userId, accessToken, refreshToken, userEmail, maxResults = 100, query = '') => {
  try {
    const gmail = getGmailClient(accessToken, refreshToken, userEmail);

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      q: query || undefined
    });

    const messages = response.data.messages || [];

    // Fetch message metadata in parallel, a few at a time to stay within Gmail rate limits
    const results = await mapWithConcurrency(messages, GMAIL_FETCH_CONCURRENCY, async (message) => {
      try {
        const emailDetail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date', 'Authentication-Results']
        });

        const payload = emailDetail?.data?.payload ?? {};
        const headers = payload.headers ?? [];

        const getHeader = (name) => {
          const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
          return header ? header.value : null;
        };

        const subjectHeader = getHeader('Subject');
        const fromHeader = getHeader('From');
        const dateHeader = getHeader('Date');
        const authResultsHeader = getHeader('Authentication-Results');

        return {
          messageId: emailDetail?.data?.id || message.id,
          snippet: decodeEntities(emailDetail?.data?.snippet || ''),
          labelIds: emailDetail?.data?.labelIds || [],
          subject: subjectHeader || '(No Subject)',
          sender: fromHeader || 'Unknown Sender',
          date: dateHeader || null,
          authenticationResults: authResultsHeader || ''
        };
      } catch (emailError) {
        console.warn(`WARNING: Skipping malformed email ${message.id}:`, emailError.message);
        return null;
      }
    });
    const detailedEmails = results.filter(Boolean);

    // Store in memory only if there is no query
    if (!query) {
      emailCache.set(userId, detailedEmails);
    }
    return detailedEmails;
  } catch (error) {
    console.error('Error fetching emails from Gmail:', error);
    throw error;
  }
};

export const getStoredEmails = (userId) => {
  return emailCache.get(userId) || [];
};

export const getEmail = async (accessToken, refreshToken, userEmail, messageId) => {
  try {
    const gmail = getGmailClient(accessToken, refreshToken, userEmail);
    const emailDetail = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });
    return emailDetail.data;
  } catch (error) {
    console.error('Error fetching specific email from Gmail:', error);
    throw error;
  }
};
