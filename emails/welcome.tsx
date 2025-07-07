import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  name: string;
  planType: 'FREE' | 'PRO' | 'ENTERPRISE';
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://summaryai.com';

export default function WelcomeEmail({ name, planType }: WelcomeEmailProps) {
  const planFeatures = {
    FREE: [
      '1 Slack workspace',
      'Basic AI summaries',
      '10 summaries per month',
      'Email support'
    ],
    PRO: [
      '3 Slack workspaces',
      'Advanced AI summaries',
      'Unlimited summaries',
      'Priority support',
      'Export to PDF/Notion'
    ],
    ENTERPRISE: [
      'Unlimited Slack workspaces',
      'Advanced AI with custom models',
      'Unlimited summaries',
      '24/7 priority support',
      'Custom integrations',
      'Team management'
    ]
  };

  return (
    <Html>
      <Head />
      <Preview>Welcome to Slack Summary Scribe! Transform your team communications with AI.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={`${baseUrl}/logo.png`}
              width="120"
              height="36"
              alt="Slack Summary Scribe"
              style={logo}
            />
          </Section>
          
          <Heading style={h1}>Welcome to Slack Summary Scribe! 🎉</Heading>
          
          <Text style={text}>Hi {name},</Text>
          
          <Text style={text}>
            Thank you for joining Slack Summary Scribe! We're excited to help you transform your Slack conversations into actionable insights with AI-powered summaries.
          </Text>

          <Section style={planSection}>
            <Heading style={h2}>Your {planType} Plan Includes:</Heading>
            {planFeatures[planType].map((feature, index) => (
              <Text key={index} style={featureText}>✓ {feature}</Text>
            ))}
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={`${baseUrl}/dashboard`}>
              Get Started with Your Dashboard
            </Button>
          </Section>

          <Section style={nextStepsSection}>
            <Heading style={h2}>Next Steps:</Heading>
            <Text style={text}>
              1. <Link href={`${baseUrl}/dashboard`} style={link}>Connect your Slack workspace</Link>
            </Text>
            <Text style={text}>
              2. Start generating AI summaries of your conversations
            </Text>
            <Text style={text}>
              3. Export summaries to PDF, Notion, or your CRM
            </Text>
          </Section>

          <Text style={text}>
            If you have any questions, feel free to reach out to our support team at{' '}
            <Link href="mailto:support@summaryai.com" style={link}>
              support@summaryai.com
            </Link>
          </Text>

          <Text style={text}>
            Best regards,<br />
            The Slack Summary Scribe Team
          </Text>

          <Section style={footer}>
            <Text style={footerText}>
              © 2024 Slack Summary Scribe. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href={`${baseUrl}/unsubscribe`} style={footerLink}>
                Unsubscribe
              </Link>{' '}
              |{' '}
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Privacy Policy
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logoContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 24px',
};

const planSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '32px 24px',
  padding: '24px',
};

const featureText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
  padding: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '0 auto',
  maxWidth: '280px',
};

const nextStepsSection = {
  margin: '32px 24px',
};

const link = {
  color: '#007bff',
  textDecoration: 'underline',
};

const footer = {
  borderTop: '1px solid #eaeaea',
  margin: '32px 0 0',
  padding: '24px 0 0',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
};

const footerLink = {
  color: '#666',
  textDecoration: 'underline',
};
