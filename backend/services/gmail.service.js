import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

// In-memory email store mapping session/userId to emails
const emailCache = new Map();

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
    
    // Verify permissions first
    try {
      await gmail.users.getProfile({ userId: 'me' });
    } catch (profileError) {
      throw new Error(`Gmail API permission denied: ${profileError.message}`);
    }

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      q: query || undefined
    });

    const messages = response.data.messages || [];
    const detailedEmails = [];

    // Fetch details for each message
    for (const message of messages) {
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

        detailedEmails.push({
          messageId: emailDetail?.data?.id || message.id,
          snippet: emailDetail?.data?.snippet || '',
          labelIds: emailDetail?.data?.labelIds || [],
          subject: subjectHeader || '(No Subject)',
          sender: fromHeader || 'Unknown Sender',
          date: dateHeader || null,
          authenticationResults: authResultsHeader || ''
        });
      } catch (emailError) {
        console.warn(`WARNING: Skipping malformed email ${message.id}:`, emailError.message);
      }
    }
    
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
