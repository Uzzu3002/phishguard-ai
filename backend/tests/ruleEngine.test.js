import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeEmail } from '../services/ai.service.js';
import { extractBody } from '../services/gmail.service.js';

const PASS = 'mx.google.com; spf=pass dkim=pass dmarc=pass';

const phishing = [
  {
    name: 'PayPal phish with failing authentication',
    email: { sender: 'PayPal <service@paypal-secure-login.com>', subject: 'Your account has been limited', snippet: 'We noticed unusual activity. Please confirm your identity within 24 hours to restore access.', authenticationResults: 'spf=fail dkim=none dmarc=fail' },
    expect: 'HIGH_RISK'
  },
  {
    name: 'PayPal phish from attacker-owned look-alike domain (auth passes)',
    email: { sender: 'PayPal <service@paypal-secure-login.com>', subject: 'Your account has been limited', snippet: 'We noticed unusual activity. Please confirm your identity within 24 hours to restore access.', authenticationResults: PASS },
    expect: 'HIGH_RISK'
  },
  {
    name: 'Gift-card CEO fraud from a free mail account',
    email: { sender: 'CEO John <ceo.john.office@gmail.com>', subject: 'Quick favor', snippet: 'Are you available? I need you to buy some gift cards for a client today, keep it confidential.', authenticationResults: PASS },
    expect: 'HIGH_RISK'
  },
  {
    name: 'Google display-name spoof from digit-substituted domain',
    email: { sender: 'Google Security <alert@g00gle-support.ru>', subject: 'Security alert', snippet: 'Someone has your password. Click here to secure your account.', authenticationResults: 'spf=pass dkim=pass' },
    expect: 'HIGH_RISK'
  },
  {
    name: 'Bank brand in display name, unrelated domain, reply-to elsewhere',
    email: { sender: 'HDFC Bank <alerts@secure-netbanking.top>', replyTo: 'support@mailbox-help.xyz', subject: 'KYC update required', snippet: 'Dear customer, your account will be blocked. Update your KYC immediately.', authenticationResults: '' },
    expect: 'HIGH_RISK'
  },
  {
    name: 'Link text shows one domain but points to an IP address',
    email: {
      sender: 'IT Helpdesk <helpdesk@company-it.com>', subject: 'Mailbox storage full', snippet: 'Your mailbox is full. Sign in to verify your account.', authenticationResults: '',
      bodyHtml: '<a href="http://185.22.10.4/owa/login">https://outlook.office.com/owa</a>',
      links: ['http://185.22.10.4/owa/login']
    },
    expect: 'HIGH_RISK'
  },
  {
    name: 'Prize lure with shortened link',
    email: { sender: 'Rewards Team <winner@promo-rewards.info>', subject: 'Congratulations! You have won', snippet: 'Claim your prize now', authenticationResults: '', links: ['https://bit.ly/3xYz12'] },
    expectAtLeast: 'REVIEW'
  }
];

const legitimate = [
  {
    name: 'Anthropic receipt',
    email: { sender: '"Anthropic, PBC" <invoice+statements@mail.anthropic.com>', subject: 'Your receipt from Anthropic, PBC #2321-3099-9296', snippet: 'Receipt #2321. Amount paid $20.00', authenticationResults: PASS }
  },
  {
    name: 'Naukri job alert with "Urgent" in subject',
    email: { sender: 'Naukri <naukrialerts@naukri.com>', subject: 'Uzair Shaikh, Urgent Requirement for the role of System Engineer', snippet: 'Apply now', authenticationResults: PASS }
  },
  {
    name: 'GitHub password reset',
    email: { sender: 'GitHub <noreply@github.com>', subject: '[GitHub] Please reset your password', snippet: 'We heard that you lost your GitHub password. Use the link below to reset your password.', authenticationResults: PASS, links: ['https://github.com/password_reset/abc123'] }
  },
  {
    name: 'Real Google security alert',
    email: { sender: 'Google <no-reply@accounts.google.com>', subject: 'Security alert', snippet: 'A new sign-in on Windows. If this was you, you don\'t need to do anything.', authenticationResults: PASS, links: ['https://myaccount.google.com/notifications'] }
  },
  {
    name: 'LinkedIn job alert',
    email: { sender: 'LinkedIn Job Alerts <jobalerts-noreply@linkedin.com>', subject: 'Scoot Information Security & Risk Management Intern', snippet: 'Scoot Information Security & Risk Management Intern: Sumitomo', authenticationResults: PASS }
  },
  {
    name: 'Amazon order from a regional Amazon domain',
    email: { sender: 'Amazon.in <order-update@amazon.in>', subject: 'Your Amazon.in order has shipped', snippet: 'Your package will arrive tomorrow. Payment received.', authenticationResults: PASS }
  },
  {
    name: 'Newsletter with reply-to on the same organisation',
    email: { sender: 'Udemy <hello@students.udemy.com>', replyTo: 'support@udemy.com', subject: 'Last call: 30% off Personal Plan', snippet: 'Offer ends today', authenticationResults: PASS }
  },
  {
    name: 'Friend writing from Gmail',
    email: { sender: 'Rahul <rahul.k@gmail.com>', subject: 'Photos from the trip', snippet: 'Here are the photos, let me know what you think', authenticationResults: PASS }
  }
];

const rank = { SAFE: 0, REVIEW: 1, HIGH_RISK: 2 };

for (const { name, email, expect, expectAtLeast } of phishing) {
  test(`flags phishing: ${name}`, () => {
    const result = analyzeEmail(email);
    if (expect) assert.equal(result.verdict, expect, `score ${result.riskScore}: ${result.explanation}`);
    if (expectAtLeast) assert.ok(rank[result.verdict] >= rank[expectAtLeast], `score ${result.riskScore}: ${result.explanation}`);
  });
}

for (const { name, email } of legitimate) {
  test(`keeps legitimate mail safe: ${name}`, () => {
    const result = analyzeEmail(email);
    assert.equal(result.verdict, 'SAFE', `score ${result.riskScore}: ${result.explanation}`);
  });
}

test('extracts body, links and attachments from a Gmail MIME payload and flags them', () => {
  const encode = (s) => Buffer.from(s).toString('base64url');
  const payload = {
    mimeType: 'multipart/mixed',
    parts: [
      {
        mimeType: 'multipart/alternative',
        parts: [
          { mimeType: 'text/plain', body: { data: encode('Your mailbox is full. Sign in to verify your account.') } },
          { mimeType: 'text/html', body: { data: encode('<a href="http://185.22.10.4/owa/login?a=1&amp;b=2">https://outlook.office.com/owa</a>') } }
        ]
      },
      { mimeType: 'application/pdf', filename: 'invoice.pdf', body: {} }
    ]
  };

  const body = extractBody(payload);
  assert.deepEqual(body.links, ['http://185.22.10.4/owa/login?a=1&b=2']);
  assert.equal(body.attachmentsFound, 1);
  assert.match(body.bodyText, /mailbox is full/);

  const result = analyzeEmail({ sender: 'IT Helpdesk <helpdesk@company-it.com>', subject: 'Mailbox storage full', snippet: '', authenticationResults: '', ...body });
  assert.equal(result.verdict, 'HIGH_RISK');
  assert.equal(result.urlsFound, 1);
});

test('returns the fields the UI depends on', () => {
  const result = analyzeEmail({ sender: 'a@b.com', subject: 's', snippet: '', authenticationResults: '' });
  for (const key of ['riskScore', 'verdict', 'explanation', 'recommendations', 'authenticationResults', 'urlsFound', 'attachmentsFound']) {
    assert.ok(key in result, `missing ${key}`);
  }
});
