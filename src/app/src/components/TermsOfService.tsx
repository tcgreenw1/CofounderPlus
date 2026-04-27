import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Logo } from './Logo';
import { useTheme } from './ThemeProvider';

export function TermsOfService() {
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
            <CardTitle className="text-3xl sm:text-4xl text-center">Terms of Service</CardTitle>
            <p className="text-center text-muted-foreground mt-2">
              Last Updated: January 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-6 text-foreground">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using Cofounder (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all users of the Service, including business owners, team members, and other individuals who access or use the Service.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Cofounder is a comprehensive business management platform that provides:
              </p>
              <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                <li>AI-powered business assistance and strategic guidance</li>
                <li>Business planning and roadmap tools</li>
                <li>Financial management and tracking</li>
                <li>Human resources management features</li>
                <li>Operations management tools</li>
                <li>Team collaboration features</li>
                <li>Integration with third-party services</li>
              </ul>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-xl font-semibold mb-3">3. Account Registration and Security</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  To use the Service, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  You must be at least 18 years old to use the Service. By creating an account, you represent and warrant that you are at least 18 years of age.
                </p>
              </div>
            </section>

            {/* Subscription and Payment */}
            <section>
              <h2 className="text-xl font-semibold mb-3">4. Subscription Plans and Payment</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Cofounder offers various subscription plans with different features and pricing. By purchasing a subscription, you agree to:
                </p>
                <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                  <li>Pay all fees associated with your chosen subscription plan</li>
                  <li>Provide valid payment information</li>
                  <li>Allow automatic renewal unless you cancel before the renewal date</li>
                  <li>Accept that fees are non-refundable except as required by law</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  We use Stripe for payment processing on web and Apple In-App Purchase for mobile subscriptions. Your payment information is processed securely by these third-party providers and is not stored on our servers.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  We reserve the right to change our pricing at any time. Price changes will not affect your current subscription period but will apply to subsequent renewal periods unless we notify you otherwise.
                </p>
              </div>
            </section>

            {/* Apple IAP Terms (EULA) */}
            <section>
              <h2 className="text-xl font-semibold mb-3">5. Apple In-App Purchase Subscriptions (iOS)</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  If you purchase a subscription through the iOS mobile application, the following terms apply:
                </p>

                <div>
                  <h3 className="font-medium mb-2">5.1 Payment and Billing</h3>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                    <li>Payment will be charged to your Apple ID account at confirmation of purchase</li>
                    <li>Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period</li>
                    <li>Your account will be charged for renewal within 24 hours prior to the end of the current period</li>
                    <li>The renewal cost will be the same as your original subscription price unless you are notified otherwise</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">5.2 Managing Your Subscription</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You can manage and cancel your subscription by going to your iOS device Settings:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground space-y-1">
                    <li>Open the Settings app on your iOS device</li>
                    <li>Tap your name at the top of the screen</li>
                    <li>Tap "Subscriptions"</li>
                    <li>Select "Cofounder+" from the list</li>
                    <li>Tap "Cancel Subscription" to cancel</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-3">
                    Alternatively, you can manage your subscriptions through the App Store app on your device.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">5.3 Cancellation and Refunds</h3>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                    <li>You can cancel your subscription at any time through your iOS Settings</li>
                    <li>If you cancel, your subscription will remain active until the end of the current billing period</li>
                    <li>No partial refunds will be provided for unused time within a billing period</li>
                    <li>All refund requests must be made directly to Apple through the App Store</li>
                    <li>To request a refund from Apple, visit reportaproblem.apple.com</li>
                    <li>We do not have access to process refunds for Apple In-App Purchases</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">5.4 Subscription Terms</h3>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                    <li><strong>Launch Monthly:</strong> $19.00 per month, automatically renews monthly</li>
                    <li><strong>Launch Annual:</strong> $179.00 per year (12 months), automatically renews annually</li>
                    <li><strong>Grow Monthly:</strong> $49.00 per month, automatically renews monthly</li>
                    <li><strong>Grow Annual:</strong> $450.00 per year (12 months), automatically renews annually</li>
                    <li><strong>Scale Monthly:</strong> $199.00 per month, automatically renews monthly</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-3">
                    Note: Scale Annual subscription ($1,908/year) is not available through Apple In-App Purchase due to Apple's $999.99 price limit. For Scale Annual, please contact us at support@cofounderplus.com for direct billing options.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">5.5 Free Trials and Promotional Offers</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If you are offered a free trial or promotional period:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground space-y-1">
                    <li>You must cancel before the trial ends to avoid being charged</li>
                    <li>When the trial ends, you will automatically be charged the subscription price</li>
                    <li>You can cancel at any time during the trial period without charge</li>
                    <li>Any unused portion of a free trial will be forfeited when you purchase a subscription</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">5.6 Apple Terms and Conditions</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your use of the iOS app and all in-app purchases are also subject to Apple's Terms and Conditions and Licensed Application End User License Agreement (EULA). In the event of any conflict between these Terms and Apple's terms, Apple's terms shall prevail with respect to your use of the iOS app.
                  </p>
                </div>
              </div>
            </section>

            {/* Web Subscriptions (Stripe) */}
            <section>
              <h2 className="text-xl font-semibold mb-3">6. Web Subscriptions (Stripe)</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  If you purchase a subscription through our web application:
                </p>
                <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                  <li>Payment is processed securely through Stripe</li>
                  <li>You can manage your subscription through your account settings</li>
                  <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                  <li>You can cancel at any time through your account dashboard</li>
                  <li>Refund requests can be made by contacting support@cofounderplus.com</li>
                  <li>All subscription plans (including Scale Annual) are available through web</li>
                </ul>
              </div>
            </section>

            {/* User Conduct */}
            <section>
              <h2 className="text-xl font-semibold mb-3">7. Acceptable Use and Conduct</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Upload or transmit malicious code or harmful content</li>
                  <li>Attempt to gain unauthorized access to the Service</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use automated systems to access the Service without permission</li>
                  <li>Impersonate any person or entity</li>
                  <li>Share your account credentials with others</li>
                  <li>Use the Service for any illegal or fraudulent purposes</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold mb-3">8. Intellectual Property Rights</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  The Service, including all content, features, and functionality, is owned by Cofounder and is protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  You retain all rights to the content you create using the Service (business plans, documents, notes, etc.). By using the Service, you grant us a limited license to store, process, and display your content solely for the purpose of providing the Service to you.
                </p>
              </div>
            </section>

            {/* AI Features */}
            <section>
              <h2 className="text-xl font-semibold mb-3">9. AI-Powered Features</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service includes AI-powered features that provide business assistance, recommendations, and insights. While we strive for accuracy, AI-generated content may contain errors or inaccuracies. You should:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground space-y-1">
                <li>Review all AI-generated recommendations before implementation</li>
                <li>Consult with qualified professionals for important business decisions</li>
                <li>Not rely solely on AI advice for legal, financial, or medical matters</li>
                <li>Understand that AI responses are based on available data and may not be current</li>
              </ul>
            </section>

            {/* Third-Party Integrations */}
            <section>
              <h2 className="text-xl font-semibold mb-3">10. Third-Party Services and Integrations</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service may integrate with third-party services (Stripe, QuickBooks, Salesforce, Slack, HubSpot, etc.). Your use of these integrations is subject to their respective terms of service and privacy policies. We are not responsible for the functionality, security, or availability of third-party services.
              </p>
            </section>

            {/* Data and Privacy */}
            <section>
              <h2 className="text-xl font-semibold mb-3">11. Data and Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand how we collect, use, and protect your information.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl font-semibold mb-3">12. Termination</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  You may cancel your account at any time through your account settings. Upon cancellation:
                </p>
                <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                  <li>Your subscription will remain active until the end of the current billing period</li>
                  <li>You will not receive a refund for unused time</li>
                  <li>Your data will be retained for 30 days before deletion</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  We reserve the right to suspend or terminate your access to the Service at any time for violations of these Terms, illegal activity, or other reasons at our discretion.
                </p>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-xl font-semibold mb-3">13. Disclaimers and Limitations of Liability</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-xl font-semibold mb-3">14. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless Cofounder and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="text-xl font-semibold mb-3">15. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the Service and updating the "Last Updated" date. Your continued use of the Service after changes become effective constitutes acceptance of the modified Terms.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-semibold mb-3">16. Governing Law and Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration, except where prohibited by law.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-xl font-semibold mb-3">17. Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold mb-3">18. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> legal@cofounderplus.com<br />
                  <strong>Support:</strong> support@cofounderplus.com<br />
                  <strong>Address:</strong> Cofounder, Inc.<br />
                  [Your Business Address]
                </p>
              </div>
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