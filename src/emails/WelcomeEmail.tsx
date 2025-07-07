import {
  Body,
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
  planType: string;
}

export default function WelcomeEmail({ name, planType }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Slack Summary Scribe! Transform your Slack conversations into actionable insights.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Welcome to Slack Summary Scribe! 🎉</Heading>
            <Text style={subtitle}>Transform your Slack conversations into actionable insights</Text>
          </Section>

          <Section style={content}>
            <Text style={text}>Hi {name}! 👋</Text>
            
            <Text style={text}>
              Thank you for joining Slack Summary Scribe! You're now part of a community that values efficient communication and actionable insights.
            </Text>

            <Section style={planBox}>
              <Text style={planTitle}>Your {planType} Plan is Active</Text>
              <Text style={planDescription}>
                You can now start generating AI-powered summaries from your Slack conversations.
              </Text>
            </Section>

            <Text style={text}>
              <strong>What's Next?</strong>
            </Text>
            
            <Text style={text}>
              1. <strong>Connect Your Slack Workspace:</strong> Link your Slack account to start analyzing conversations<br/>
              2. <strong>Generate Your First Summary:</strong> Select channels and let our AI create insightful summaries<br/>
              3. <strong>Export & Share:</strong> Download summaries as PDF or export to Notion
            </Text>

            <Section style={buttonContainer}>
              <Link
                style={button}
                href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
              >
                Get Started Now
              </Link>
            </Section>

            <Text style={footer}>
              Need help? Reply to this email or visit our{' '}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/support`} style={link}>
                support center
              </Link>
              .
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

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '30px',
  textAlign: 'center' as const,
  borderRadius: '10px 10px 0 0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const subtitle = {
  color: 'rgba(255,255,255,0.9)',
  fontSize: '16px',
  margin: '10px 0 0 0',
  padding: '0',
};

const content = {
  padding: '30px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const planBox = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const planTitle = {
  color: '#495057',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
};

const planDescription = {
  color: '#6c757d',
  fontSize: '14px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
};

const footer = {
  color: '#6c757d',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '30px 0 0 0',
};

const link = {
  color: '#667eea',
  textDecoration: 'underline',
};
