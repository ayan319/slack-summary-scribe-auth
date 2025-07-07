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

interface PaymentConfirmationEmailProps {
  name: string;
  planName: string;
  amount: number;
  orderId: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://summaryai.com';

export default function PaymentConfirmationEmail({
  name,
  planName,
  amount,
  orderId,
}: PaymentConfirmationEmailProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

  return (
    <Html>
      <Head />
      <Preview>Payment confirmation for your {planName} plan subscription</Preview>
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
          
          <Heading style={h1}>Payment Confirmed! 💳</Heading>
          
          <Text style={text}>Hi {name},</Text>
          
          <Text style={text}>
            Thank you for your payment! Your subscription to the {planName} plan has been successfully activated.
          </Text>

          <Section style={paymentDetails}>
            <Heading style={h2}>Payment Details</Heading>
            <table style={table}>
              <tr>
                <td style={tableLabel}>Plan:</td>
                <td style={tableValue}>{planName}</td>
              </tr>
              <tr>
                <td style={tableLabel}>Amount:</td>
                <td style={tableValue}>{formattedAmount}</td>
              </tr>
              <tr>
                <td style={tableLabel}>Order ID:</td>
                <td style={tableValue}>{orderId}</td>
              </tr>
              <tr>
                <td style={tableLabel}>Date:</td>
                <td style={tableValue}>{new Date().toLocaleDateString()}</td>
              </tr>
            </table>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={`${baseUrl}/dashboard`}>
              Access Your Dashboard
            </Button>
          </Section>

          <Section style={featuresSection}>
            <Heading style={h2}>What's Next?</Heading>
            <Text style={text}>
              Your {planName} plan is now active! Here's what you can do:
            </Text>
            <Text style={featureText}>
              ✓ Connect multiple Slack workspaces
            </Text>
            <Text style={featureText}>
              ✓ Generate unlimited AI summaries
            </Text>
            <Text style={featureText}>
              ✓ Export to PDF, Notion, and CRM systems
            </Text>
            <Text style={featureText}>
              ✓ Access priority support
            </Text>
          </Section>

          <Text style={text}>
            If you have any questions about your subscription or need help getting started, 
            please don't hesitate to contact our support team at{' '}
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
              <Link href={`${baseUrl}/billing`} style={footerLink}>
                Manage Billing
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

const paymentDetails = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '32px 24px',
  padding: '24px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 0',
  width: '30%',
};

const tableValue = {
  color: '#333',
  fontSize: '14px',
  padding: '8px 0',
};

const featuresSection = {
  margin: '32px 24px',
};

const featureText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
  padding: '0 24px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#28a745',
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
