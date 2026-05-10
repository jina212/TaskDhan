import React from 'react';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-text-main">Privacy Policy</h1>
        <p className="text-text-muted">Your privacy is our top priority.</p>
      </div>

      <div className="space-y-8 max-w-none">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-text-main">1. Information We Collect</h2>
          <p className="text-text-muted">
            We collect information you provide directly to us, such as your mobile number, name, and payment details (UPI ID/Paytm number) for processing withdrawals.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-text-main">2. How We Use Your Information</h2>
          <p className="text-text-muted">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-text-muted space-y-2">
            <li>Provide, maintain, and improve our services.</li>
            <li>Process transactions and send related information.</li>
            <li>Send you technical notices, updates, and support messages.</li>
            <li>Verify your identity and prevent fraud.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-text-main">3. Data Security</h2>
          <p className="text-text-muted">
            We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-text-main">4. Contact Us</h2>
          <p className="text-text-muted">
            If you have any questions about this Privacy Policy, please contact us at support@taskdhan.com.
          </p>
        </section>
      </div>
    </div>
  );
}
