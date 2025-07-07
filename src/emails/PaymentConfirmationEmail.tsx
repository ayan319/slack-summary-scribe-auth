import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PaymentConfirmationEmailProps {
  name: string;
  planType: string;
  amount: number;
  paymentId: string;
}

export default function PaymentConfirmationEmail({ 
  name, 
  planType, 
  amount, 
  paymentId 
}: PaymentConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment confirmed! Your {planType} subscription is now active.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Payment Confirmed! ✅</Heading>
            <Text style={subtitle}>Your premium subscription is now active</Text>
          </Section>

          <Section style={content}>
            <Text style={text}>Thank you, {name}! 🎉</Text>
            
            <Text style={text}>
              Your payment has been successfully processed and your {planType} subscription is now active.
            </Text>

            <Section style={paymentBox}>
              <Text style={sectionTitle}>Payment Details</Text>
              <table style={table}>
                <tr>
                  <td style={tableCell}><strong>Plan:</strong></td>
                  <td style={tableCellRight}>{planType}</td>
                </tr>
                <tr>
                  <td style={tableCell}><strong>Amount:</strong></td>
                  <td style={tableCellRight}>${amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={tableCell}><strong>Payment ID:</strong></td>
                  <td style={tableCellRight}>{paymentId}</td>
                </tr>
              </table>
            </Section>

            <Text style={text}>
              <strong>What's Unlocked?</strong>
            </Text>
            
            {planType === 'PRO' ? (
              <Text style={text}>
                • 3 Slack workspaces<br/>
                • Advanced AI summaries<br/>
                • Unlimited summaries<br/>
                • Priority support<br/>
                • Export to PDF/Notion
              </Text>
            ) : (
              <Text style={text}>
                • Unlimited Slack workspaces<br/>
                • Advanced AI with custom models<br/>
                • Unlimited summaries<br/>
                • 24/7 priority support<br/>
                • Custom integrations<br/>
                • Team management<br/>
                • Advanced analytics
              </Text>
            )}

            <Section style={buttonContainer}>
              <Link
                style={button}
                href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
              >
                Access Your Dashboard
              </Link>
            </Section>

            <Text style={footer}>
              Questions about your subscription? Contact us at{' '}
              <Link href="mailto:billing@slacksummaryscribe.com" style={link}>
                billing@slacksummaryscribe.com
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

const header = {
  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
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

const paymentBox = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const sectionTitle = {
  color: '#495057',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 15px 0',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableCell = {
  padding: '8px 0',
  borderBottom: '1px solid #dee2e6',
};

const tableCellRight = {
  padding: '8px 0',
  borderBottom: '1px solid #dee2e6',
  textAlign: 'right' as const,
  fontFamily: 'monospace',
  fontSize: '14px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#28a745',
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
  color: '#28a745',
  textDecoration: 'underline',
};
