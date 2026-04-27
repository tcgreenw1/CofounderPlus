import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Logo } from './Logo';
import { useTheme } from './ThemeProvider';

export function PrivacyPolicy() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-sky-50/30 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300">
      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/20 dark:border-gray-700/20 glass-morphism">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Logo size="md" showText={true} />
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Card className="glass-morphism border-white/30 dark:border-gray-700/30">
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl text-center">Privacy Policy</CardTitle>
            <p className="text-center text-muted-foreground mt-2">
              Last Updated: January 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-6 text-foreground">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to Cofounder ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application and mobile application (collectively, the "Service").
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">2.1 Personal Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground space-y-1">
                    <li>Name and email address</li>
                    <li>Business information (business name, industry, goals)</li>
                    <li>Account credentials</li>
                    <li>Payment information (processed securely through Stripe)</li>
                    <li>Profile information and preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">2.2 Usage Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We automatically collect certain information about your device and how you interact with our Service:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground space-y-1">
                    <li>Device type and operating system</li>
                    <li>Browser type and version</li>
                    <li>IP address and location data</li>
                    <li>Usage patterns and feature interactions</li>
                    <li>Session data and analytics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">2.3 Business Data</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Information you create while using our Service, including:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground space-y-1">
                    <li>Business plans and roadmaps</li>
                    <li>Financial data and projections</li>
                    <li>Notes and documents</li>
                    <li>Task and milestone progress</li>
                    <li>AI chat conversations</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Personalize and improve your experience</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Provide AI-powered business assistance and recommendations</li>
              </ul>
            </section>

            {/* Data Storage and Security */}
            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Storage and Security</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  We use Supabase (a secure, enterprise-grade database platform) to store your data. Your information is:
                </p>
                <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                  <li>Encrypted in transit using HTTPS/TLS</li>
                  <li>Encrypted at rest in our database</li>
                  <li>Protected by industry-standard security measures</li>
                  <li>Backed up regularly to prevent data loss</li>
                  <li>Accessible only to authorized personnel</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Payment information is processed directly by Stripe and is never stored on our servers.
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We use the following third-party services to operate our platform:
              </p>
              <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>Stripe:</strong> Payment processing</li>
                <li><strong>OpenAI:</strong> AI-powered business assistance (optional feature)</li>
                <li><strong>Anthropic (Claude):</strong> AI-powered business assistance (optional feature)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                These services have their own privacy policies and terms of service. We encourage you to review their policies.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                <li><strong>With your consent:</strong> When you explicitly agree to share information</li>
                <li><strong>Service providers:</strong> With third parties who perform services on our behalf</li>
                <li><strong>Legal requirements:</strong> To comply with legal obligations or respond to lawful requests</li>
                <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>Team members:</strong> With other users you've invited to your business workspace</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold mb-3">7. Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your business data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restrict processing:</strong> Limit how we use your information</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                To exercise these rights, please contact us at privacy@cofounderplus.com or through your account settings.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide you services. If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information.
              </p>
            </section>

            {/* International Users */}
            <section>
              <h2 className="text-xl font-semibold mb-3">10. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the Service after such modifications constitutes your acknowledgment and acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> privacy@cofounderplus.com<br />
                  <strong>Support:</strong> support@cofounderplus.com<br />
                  <strong>Address:</strong> Cofounder, Inc.<br />
                  [Your Business Address]
                </p>
              </div>
            </section>

            {/* GDPR/CCPA Compliance */}
            <section>
              <h2 className="text-xl font-semibold mb-3">13. Additional Rights for EU and California Residents</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">EU Residents (GDPR)</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If you are located in the European Economic Area, you have additional rights under the General Data Protection Regulation (GDPR), including the right to lodge a complaint with a supervisory authority.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">California Residents (CCPA)</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    California residents have the right to request disclosure of categories and specific pieces of personal information collected, and the right to request deletion of personal information, subject to certain exceptions.
                  </p>
                </div>
              </div>
            </section>

            {/* Mobile App */}
            <section>
              <h2 className="text-xl font-semibold mb-3">14. Mobile Application</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you use our mobile application, we may collect additional information such as:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground space-y-1">
                <li>Mobile device identifiers</li>
                <li>Push notification tokens (with your permission)</li>
                <li>Mobile operating system information</li>
                <li>App version and usage statistics</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                The mobile app uses the same security and privacy practices as our web application. We use iOS's built-in encryption and security features to protect your data.
              </p>
            </section>

            {/* Apple In-App Purchases */}
            <section>
              <h2 className="text-xl font-semibold mb-3">15. Apple In-App Purchases (iOS)</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  When you purchase a subscription through the iOS app, your payment is processed by Apple through their In-App Purchase system. Important information about iOS subscriptions:
                </p>
                <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                  <li><strong>Payment Processing:</strong> All payments are processed by Apple. We do not receive or store your payment information.</li>
                  <li><strong>Subscription Data:</strong> Apple shares limited information with us to verify your subscription status, including receipt data and subscription validity.</li>
                  <li><strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.</li>
                  <li><strong>Managing Subscriptions:</strong> You can manage and cancel your subscription through your iOS Settings (Settings → [Your Name] → Subscriptions).</li>
                  <li><strong>Refunds:</strong> Refund requests must be made through Apple. We do not process refunds for iOS purchases.</li>
                  <li><strong>Privacy:</strong> Apple's Privacy Policy applies to all payment and transaction data. We only receive confirmation of your active subscription status.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  We link your Apple subscription to your Cofounder account using your Apple ID receipt. This allows us to verify your subscription status and provide you with the appropriate service level.
                </p>
              </div>
            </section>

            {/* Web Subscriptions (Stripe) */}
            <section>
              <h2 className="text-xl font-semibold mb-3">16. Web Subscriptions (Stripe)</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you purchase a subscription through our web application, your payment is processed by Stripe. Stripe's Privacy Policy governs how your payment information is handled. We only receive confirmation of successful payments and subscription status from Stripe.
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="glass-morphism border-white/30 dark:border-gray-700/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}