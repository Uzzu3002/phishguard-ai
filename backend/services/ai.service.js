import { readFileSync } from 'fs';

// Rule configuration (brands, keyword lists, weights, thresholds) lives in prompts/riskRules.json
const rules = JSON.parse(readFileSync(new URL('../prompts/riskRules.json', import.meta.url), 'utf8'));
const { brands, freeMailProviders, suspiciousTlds, urlShorteners, keywords, weights, thresholds } = rules;

const SECOND_LEVEL_LABELS = new Set(['co', 'com', 'org', 'net', 'gov', 'ac', 'edu', 'bank']);

// "mail.example.co.uk" -> "example.co.uk", "e.linkedin.com" -> "linkedin.com"
const registrableDomain = (domain) => {
  const parts = domain.split('.');
  if (parts.length >= 3 && SECOND_LEVEL_LABELS.has(parts[parts.length - 2]) && parts[parts.length - 1].length === 2) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
};

const isOrUnder = (domain, parent) => domain === parent || domain.endsWith(`.${parent}`);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsWord = (text, word) => new RegExp(`\\b${escapeRegex(word)}\\b`, 'i').test(text);

// Undo common character swaps used in look-alike domains (g00gle, paypa1, rnicrosoft)
const normalizeLookalike = (domain) =>
  domain.replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/4/g, 'a')
    .replace(/5/g, 's').replace(/7/g, 't').replace(/rn/g, 'm').replace(/vv/g, 'w');

const parseAddress = (value = '') => {
  const angle = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  const address = (angle ? angle[2] : value).trim().toLowerCase();
  const displayName = (angle ? angle[1] : '').replace(/^["']|["']$/g, '').trim();
  const domain = address.includes('@') ? address.split('@').pop() : '';
  return { displayName, address, domain };
};

const hostnameOf = (url) => {
  try { return new URL(url).hostname.toLowerCase(); } catch { return null; }
};

const hasSuspiciousTld = (domain) => suspiciousTlds.some(tld => domain.endsWith(tld));

const parseAuthResults = (authResults) => {
  const status = (mech) => authResults.match(new RegExp(`\\b${mech}=(\\w+)`, 'i'))?.[1]?.toLowerCase() || null;
  return { spf: status('spf'), dkim: status('dkim'), dmarc: status('dmarc') };
};

// Pull <a href="...">visible text</a> pairs from an HTML body
const extractAnchors = (html = '') => {
  const anchors = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && anchors.length < 200) {
    anchors.push({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() });
  }
  return anchors;
};

export const analyzeEmail = (email) => {
  const reasons = [];
  const recommendations = [];

  const sender = parseAddress(email.sender);
  const replyTo = email.replyTo ? parseAddress(email.replyTo) : null;
  const authResults = email.authenticationResults || '';
  const links = Array.isArray(email.links) ? email.links : [];
  const text = [email.subject, email.snippet, (email.bodyText || '').slice(0, 5000)].join(' \n ').toLowerCase();

  // 1. Authentication (SPF / DKIM / DMARC)
  const auth = parseAuthResults(authResults);
  let authScore = 0;
  if (auth.dmarc === 'fail') { authScore += weights.dmarcFail; reasons.push('DMARC check failed: the sender domain did not authorise this message.'); }
  if (auth.spf === 'fail' || auth.spf === 'softfail') { authScore += weights.spfFail; reasons.push('SPF check failed: the sending server is not allowed to send for this domain.'); }
  if (auth.dkim === 'fail') { authScore += weights.dkimFail; reasons.push('DKIM signature is invalid: the message may have been altered or forged.'); }
  authScore = Math.min(authScore, weights.authCap);

  // 2. Sender identity
  let identityScore = 0;
  let identityFlagged = false;
  const isFreeMail = freeMailProviders.includes(sender.domain);

  const impersonatedBrand = Object.keys(brands).find(brand =>
    containsWord(sender.displayName, brand) && !brands[brand].some(d => isOrUnder(sender.domain, d))
  );
  if (impersonatedBrand && sender.domain) {
    identityScore += weights.brandImpersonation;
    identityFlagged = true;
    reasons.push(`Sender name claims to be "${sender.displayName}" but the email comes from ${sender.domain}, which is not an official ${impersonatedBrand} domain.`);
  } else if (sender.domain) {
    const normalized = normalizeLookalike(sender.domain);
    const lookalikeBrand = Object.keys(brands).find(brand =>
      !brand.includes(' ') &&
      new RegExp(`(^|[.-])${escapeRegex(brand)}([.-]|\\d|$)`).test(normalized) &&
      !brands[brand].some(d => isOrUnder(sender.domain, d))
    );
    if (lookalikeBrand) {
      identityScore += weights.lookalikeDomain;
      identityFlagged = true;
      reasons.push(`Sender domain ${sender.domain} imitates ${lookalikeBrand} but is not one of its official domains.`);
    }
  }

  if (sender.domain && hasSuspiciousTld(sender.domain)) {
    identityScore += weights.suspiciousSenderTld;
    identityFlagged = true;
    reasons.push(`Sender domain ${sender.domain} uses a top-level domain frequently abused for phishing.`);
  }

  if (replyTo?.domain && sender.domain && registrableDomain(replyTo.domain) !== registrableDomain(sender.domain)) {
    identityScore += weights.replyToMismatch;
    reasons.push(`Replies would go to ${replyTo.domain}, a different domain from the sender (${sender.domain}).`);
  }

  // 3. Content (subject, preview and body text)
  const matched = (category) => keywords[category].find(kw => text.includes(kw));
  let contentScore = 0;
  const contentRules = [
    ['accountThreat', 'Threatens account loss or reports alarming account activity'],
    ['credentialRequest', 'Asks you to sign in, verify or update account or payment details'],
    ['financialLure', 'Uses a money lure (gift cards, prizes, refunds, wire transfers)'],
    ['secrecyPressure', 'Applies secrecy or personal pressure typical of impersonation fraud'],
    ['urgency', 'Uses urgent or time-pressure language'],
    ['genericGreeting', 'Uses a generic greeting instead of your name']
  ];
  for (const [category, label] of contentRules) {
    const hit = matched(category);
    if (hit) {
      contentScore += weights[category];
      reasons.push(`${label} ("${hit}").`);
    }
  }

  const hasLure = matched('financialLure') || matched('secrecyPressure') || matched('credentialRequest');
  if (isFreeMail && hasLure) {
    identityScore += weights.freeMailWithLure;
    reasons.push(`Sent from a free personal mailbox (${sender.domain}) while requesting money, secrecy or credentials.`);
  }

  // Mail authenticated for a real organisation domain is far less likely to be phishing on wording alone
  const verifiedSender = (auth.dmarc === 'pass' || (auth.spf === 'pass' && auth.dkim === 'pass')) && !isFreeMail && !identityFlagged;
  contentScore = Math.min(contentScore, verifiedSender ? weights.verifiedSenderContentCap : weights.contentCap);

  // 4. Links (available when the full message body was fetched)
  let linkScore = 0;
  const linkHosts = links.map(hostnameOf).filter(Boolean);
  const flagLink = (condition, weight, reason) => {
    if (condition) { linkScore += weight; reasons.push(reason); }
  };
  flagLink(linkHosts.some(h => /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.startsWith('[')), weights.ipLink,
    'Contains a link to a raw IP address instead of a named website.');
  flagLink(linkHosts.some(h => h.split('.').some(label => label.startsWith('xn--'))), weights.punycodeLink,
    'Contains a link with an internationalised (punycode) domain that can disguise look-alike characters.');
  flagLink(linkHosts.some(h => urlShorteners.includes(h)), weights.shortenerLink,
    'Contains a shortened link that hides its real destination.');
  flagLink(linkHosts.some(hasSuspiciousTld), weights.suspiciousTldLink,
    'Contains a link to a domain with a top-level domain frequently abused for phishing.');

  const mismatchedAnchor = extractAnchors(email.bodyHtml).find(({ href, text: anchorText }) => {
    const shown = anchorText.match(/(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})/i)?.[1]?.toLowerCase();
    const actual = hostnameOf(href);
    if (!shown || !actual) return false;
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(actual);
    return isIp || registrableDomain(shown) !== registrableDomain(actual);
  });
  flagLink(Boolean(mismatchedAnchor), weights.anchorMismatch,
    mismatchedAnchor ? `A link displays "${mismatchedAnchor.text}" but actually goes to ${hostnameOf(mismatchedAnchor.href)}.` : '');
  linkScore = Math.min(linkScore, weights.linkCap);

  // Final verdict
  const riskScore = Math.min(authScore + identityScore + contentScore + linkScore, 100);
  let verdict = 'SAFE';

  if (riskScore >= thresholds.highRisk) {
    verdict = 'HIGH_RISK';
    recommendations.push('Do not click any links, open attachments or reply.');
    if (identityFlagged) recommendations.push('If you have an account with the organisation named, go to its official website or app directly.');
    recommendations.push('Report it as phishing in Gmail and delete it.');
  } else if (riskScore >= thresholds.review) {
    verdict = 'REVIEW';
    recommendations.push('Verify the sender\'s identity through a channel you already trust before acting on this email.');
    if (linkScore > 0) recommendations.push('Hover over links to check where they really go before clicking.');
  } else {
    recommendations.push('No obvious threats detected. Proceed with normal caution.');
  }

  if (reasons.length === 0) {
    reasons.push(verifiedSender
      ? 'Authentication passed and no suspicious indicators detected.'
      : 'No suspicious indicators detected.');
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
    links,
    urlsFound: links.length,
    attachmentsFound: email.attachmentsFound || 0
  };
};
