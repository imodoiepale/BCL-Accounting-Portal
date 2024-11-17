"use client"
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Info, AlertTriangle, CheckCircle, Mail } from 'lucide-react'

export default function PrivacyPolicy() {
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
              href="/mail/policy-terms/policy"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/mail/policy-terms/terms"
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
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
              This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our Gmail Integration application.
            </InfoBox>

            <Section title="1. Introduction">
              <p className="text-gray-600 mb-6">
                We are committed to protecting your personal information and your right to privacy.
                When you use our Gmail Integration service, you trust us with your information.
                We take this responsibility seriously and are committed to providing you with
                a secure and transparent service.
              </p>
              <WarningBox>
                Please read this privacy policy carefully as it helps you make informed
                decisions about sharing your personal information with us.
              </WarningBox>
            </Section>

            <Section title="2. Information We Collect">
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    2.1 Gmail Data
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Through the Gmail API, we access:
                  </p>
                  <List items={[
                    'Email messages (read-only access)',
                    'Email metadata and labels',
                    'Your email address',
                    'Basic profile information'
                  ]} />
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    2.2 Account Information
                  </h3>
                  <p className="text-gray-600 mb-4">We store:</p>
                  <List items={[
                    'Your email address',
                    'Authentication tokens',
                    'Account preferences',
                    'Email organization settings'
                  ]} />
                </div>
              </div>
            </Section>

            <Section title="3. How We Use Your Information">
              <p className="text-gray-600 mb-6">
                We use the collected information to provide and improve our services:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Primary Uses
                  </h3>
                  <List items={[
                    'Display your emails within the application',
                    'Manage your account preferences',
                    'Provide email organization features',
                    'Enable multi-account management'
                  ]} />
                </div>
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Service Improvement
                  </h3>
                  <List items={[
                    'Analyze service performance',
                    'Debug technical issues',
                    'Enhance user experience',
                    'Implement new features'
                  ]} />
                </div>
              </div>
            </Section>

            <Section title="4. Data Security">
              <WarningBox>
                We implement industry-standard security measures to protect your data.
              </WarningBox>
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Security Measures
                </h3>
                <List items={[
                  'Encryption of data in transit and at rest',
                  'Secure token storage and management',
                  'Regular security audits and monitoring',
                  'Access controls and authentication',
                  'Compliance with Google API security requirements'
                ]} />
              </div>
            </Section>

            <Section title="5. Data Sharing">
              <p className="text-gray-600 mb-6">
                We do not share your information with third parties except:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border">
                <List items={[
                  'When required by law',
                  'With your explicit consent',
                  'To protect our rights and safety',
                  'To prevent abuse of the service'
                ]} />
              </div>
            </Section>

            <Section title="6. Your Rights">
              <div className="space-y-6">
                <p className="text-gray-600">
                  You have certain rights regarding your personal information:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <List items={[
                    'Right to access your personal data',
                    'Right to request data deletion',
                    'Right to withdraw consent',
                    'Right to data portability',
                    'Right to lodge a complaint',
                    'Right to object to processing'
                  ]} />
                </div>
                <p className="text-gray-600">
                  To exercise any of these rights, please contact us using the information
                  provided in the Contact section below.
                </p>
              </div>
            </Section>

            <Section title="7. Updates to This Policy">
              <p className="text-gray-600 mb-4">
                We may update this privacy policy from time to time. The updated version will be
                indicated by an updated Last updated date and the updated version will be
                effective as soon as it is accessible.
              </p>
              <WarningBox>
                We encourage you to review this privacy policy frequently to be informed
                of how we are protecting your information.
              </WarningBox>
            </Section>

            <Section title="8. Contact Us">
              <p className="text-gray-600 mb-4">
                If you have questions or comments about this policy, you may contact us by:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a 
                      href="mailto:privacy@yourdomain.com"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      info@booksmartconsult.com
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
                For any questions about your privacy:
              </p>
              <a 
                href="mailto:privacy@yourdomain.com" 
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
                    href="/terms"
                    className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
                  >
                    <span>Terms of Service</span>
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
            <p>© {new Date().getFullYear()} Your Company Name. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}