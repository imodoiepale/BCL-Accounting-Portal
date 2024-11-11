"use client"
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Info, AlertTriangle, CheckCircle, Mail, Shield } from 'lucide-react'

export default function TermsOfService() {
  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <section className="mb-12 last:mb-0">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b">
        {title}
      </h2>
      {children}
    </section>
  )

  const InfoBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-700">{children}</p>
        </div>
      </div>
    </div>
  )

  const WarningBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-amber-700">{children}</p>
        </div>
      </div>
    </div>
  )

  const List = ({ items }: { items: string[] }) => (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          <span className="text-gray-600">{item}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/75 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to App</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link 
              href="mail/policy-terms/policy"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="mail/policy-terms/terms"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border p-8 md:p-12">
          <div className="prose prose-slate max-w-none">
            <InfoBox>
              Please read these Terms of Service carefully before using our Gmail 
              Integration application.
            </InfoBox>

            <Section title="1. Agreement to Terms">
              <p className="text-gray-600 mb-6">
                By accessing or using our Gmail Integration service, you agree to be bound
                by these Terms of Service and our Privacy Policy. If you disagree with any
                part of these terms, you may not access the service.
              </p>
              <WarningBox>
                These Terms constitute a legally binding agreement between you and
                Gmail Integration regarding your use of the Service.
              </WarningBox>
            </Section>

            <Section title="2. Description of Service">
              <div className="space-y-6">
                <p className="text-gray-600">
                  Gmail Integration provides the following services:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <List items={[
                    'Access to Gmail messages through our interface',
                    'Email organization and management tools',
                    'Multi-account support',
                    'Email search and filtering capabilities',
                    'Label management'
                  ]} />
                </div>
                <InfoBox>
                  Our service is designed to help you manage and organize your Gmail accounts
                  more efficiently while maintaining security and privacy.
                </InfoBox>
              </div>
            </Section>

            <Section title="3. User Accounts">
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    3.1 Account Requirements
                  </h3>
                  <List items={[
                    'You must have a valid Gmail account',
                    'You must provide accurate account information',
                    'You must maintain the security of your account',
                    'You must be at least 18 years old'
                  ]} />
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    3.2 Account Security
                  </h3>
                  <List items={[
                    'Keep your login credentials confidential',
                    'Notify us of any unauthorized access',
                    'Regularly review your account activity',
                    'Enable two-factor authentication when possible'
                  ]} />
                </div>
              </div>
            </Section>

            <Section title="4. Acceptable Use">
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    4.1 Permitted Use
                  </h3>
                  <List items={[
                    'Personal email management',
                    'Business email organization',
                    'Email archiving and searching',
                    'Label and folder management'
                  ]} />
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    4.2 Prohibited Use
                  </h3>
                  <List items={[
                    'Unauthorized access to other accounts',
                    'Distribution of malware or harmful code',
                    'Violation of any laws or regulations',
                    'Interference with service operation'
                  ]} />
                </div>
              </div>
            </Section>

            <Section title="5. Service Limitations">
              <WarningBox>
                Our service is provided as is and may be subject to limitations,
                delays, and other problems inherent in the use of internet and
                electronic communications.
              </WarningBox>
              <div className="bg-gray-50 p-6 rounded-lg border mt-6">
                <List items={[
                  'Service may be temporarily unavailable for maintenance',
                  'Access speeds may vary based on network conditions',
                  'Some features may be limited by Gmail API restrictions',
                  'Storage and processing limits may apply'
                ]} />
              </div>
            </Section>

            <Section title="6. Intellectual Property">
              <p className="text-gray-600 mb-6">
                The Service and its original content, features, and functionality are
                owned by Gmail Integration and are protected by international copyright,
                trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border">
                <List items={[
                  'You may not copy or modify the service',
                  'You may not use the service for commercial purposes',
                  'You may not distribute the service content',
                  'All rights not expressly granted are reserved'
                ]} />
              </div>
            </Section>

            <Section title="7. Termination">
              <div className="space-y-6">
                <p className="text-gray-600">
                  We may terminate or suspend your access to the Service immediately,
                  without prior notice or liability, for any reason, including:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <List items={[
                    'Violation of these Terms',
                    'Upon your request',
                    'For service maintenance or updates',
                    'Due to security concerns'
                  ]} />
                </div>
              </div>
            </Section>

            <Section title="8. Changes to Terms">
              <p className="text-gray-600 mb-4">
                We reserve the right to modify or replace these Terms at any time. We
                will provide notice of any changes by:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border">
                <List items={[
                  'Posting the updated terms on our website',
                  'Sending an email notification',
                  'Displaying a notice in the application',
                  'Updating the "Last updated" date'
                ]} />
              </div>
            </Section>

            <Section title="9. Contact Us">
              <p className="text-gray-600 mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a 
                      href="mailto:legal@yourdomain.com"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      legal@yourdomain.com
                    </a>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-12">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Contact Us</h3>
              <p className="text-gray-600 mb-2">
                For any questions about these terms:
              </p>
              <a 
                href="mailto:legal@yourdomain.com" 
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>info@booksmartconsult.com</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/privacy-policy"
                    className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
                  >
                    <span>Privacy Policy</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/cookies"
                    className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
                  >
                    <span>Cookie Policy</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} Booksmart Consultancy Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}