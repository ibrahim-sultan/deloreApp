import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <h1>Privacy Policy</h1>
      <p style={{ color: '#666' }}>Last updated: {new Date().toLocaleDateString()}</p>

      <section>
        <h2>1. Information We Collect</h2>
        <h3>a. Information You Provide Directly</h3>
        <ul>
          <li>Personal identification information: Name, email address, phone number, and employee ID.</li>
          <li>Employment or account details: Department, position, work schedule, assigned tasks, or login credentials.</li>
          <li>Health or caregiving records: Only where applicable to our operations and with your consent.</li>
          <li>Feedback or communications: Messages or support requests sent through the Portal.</li>
        </ul>
        <h3>b. Information Collected Automatically</h3>
        <ul>
          <li>Device information: IP address, browser type, operating system, and device identifiers.</li>
          <li>Usage data: Pages viewed, login times, actions performed, and session duration.</li>
          <li>Cookies and similar technologies: To enhance user experience, maintain sessions, and remember preferences.</li>
        </ul>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>Create, manage, and secure user accounts.</li>
          <li>Facilitate internal communication and task management.</li>
          <li>Provide access to health care, HR, and administrative tools.</li>
          <li>Monitor and improve the performance, usability, and security of the Portal.</li>
          <li>Send important notifications, including updates, alerts, and policy changes.</li>
          <li>Comply with applicable legal and regulatory obligations.</li>
        </ul>
      </section>

      <section>
        <h2>3. Legal Basis for Processing</h2>
        <ul>
          <li>Your consent (when required).</li>
          <li>The performance of a contract (e.g., employment or service agreement).</li>
          <li>Our legitimate business interests in providing secure and efficient digital services.</li>
          <li>Compliance with legal obligations under Canadian privacy law (PIPEDA).</li>
        </ul>
      </section>

      <section>
        <h2>4. How We Protect Your Information</h2>
        <ul>
          <li>Encrypted connections (HTTPS and SSL).</li>
          <li>Secure user authentication and password protection.</li>
          <li>Regular system monitoring, backups, and threat management.</li>
          <li>Limited access to authorized personnel only.</li>
        </ul>
        <p>Despite our efforts, no digital system is 100% secure. We encourage users to protect their passwords and log out after each session.</p>
      </section>

      <section>
        <h2>5. Sharing and Disclosure</h2>
        <p>We do not sell or rent your personal information. We may share data only in these limited cases:</p>
        <ul>
          <li>With authorized staff or administrators to deliver core Portal functions.</li>
          <li>With service providers or contractors who support our IT, hosting, or security operations (under confidentiality agreements).</li>
          <li>When required by law, regulation, or valid legal request (e.g., court order).</li>
          <li>With your explicit consent, for any other specific purpose.</li>
        </ul>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>We retain personal data only as long as necessary for:</p>
        <ul>
          <li>Employment or service-related purposes,</li>
          <li>Legal or compliance requirements, and</li>
          <li>Maintaining the integrity of the Portal.</li>
        </ul>
        <p>Once data is no longer needed, it will be securely deleted or anonymized.</p>
      </section>

      <section>
        <h2>7. Your Rights and Choices</h2>
        <p>Depending on your location, you may have the right to:</p>
        <ul>
          <li>Access, update, or correct your personal data.</li>
          <li>Request deletion of your account or data (subject to legal limits).</li>
          <li>Withdraw consent where applicable.</li>
          <li>Request a copy of your stored personal information.</li>
        </ul>
        <p>To exercise these rights, please contact our Privacy Officer (see Section 10 below).</p>
      </section>

      <section>
        <h2>8. Cookies and Tracking Technologies</h2>
        <p>Our Portal uses cookies to:</p>
        <ul>
          <li>Keep users logged in,</li>
          <li>Store preferences, and</li>
          <li>Analyze performance and usage trends.</li>
        </ul>
        <p>You can manage or disable cookies in your browser settings, but some features may not function properly if cookies are disabled.</p>
      </section>

      <section>
        <h2>9. Third-Party Links</h2>
        <p>
          The Portal may contain links to third-party websites or tools. We are not responsible for their privacy practices, and we
          encourage you to review their privacy policies before sharing personal information.
        </p>
      </section>

      <section>
        <h2>10. Contact Us</h2>
        <address>
          <strong>Privacy Officer</strong><br />
          Delore Quality Health Care Service<br />
          Toronto Office:<br />
          10 San Romano Way<br />
          North York, ON<br />
          M3N 2Y2<br />
          Phone: 647-949-5532<br />
          WhatsApp: 647-949-5532<br />
          Fax: 416-748-6596<br />
          Email: <a href="mailto:admin@delorequality.com">admin@delorequality.com</a>
        </address>
      </section>

      <section>
        <h2>11. Updates to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or legal obligations.
          Any updates will be posted here with a new “Last Updated” date.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
