import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Link,
} from "@react-email/components";

interface ThankYouEmailProps {
  order: {
    id: string;
    email: string;
    display_id: string;
    total: number;
    currency_code: string;
  };
}

export function ThankYouEmail({ order }: ThankYouEmailProps) {
  return (
    <Html>
      <Head>
        {/* Import URW DIN */}
        <style>
          {`
              @font-face {
                font-family: 'URW DIN';
                src: url('https://storage.tres.my/font/font%3Awoff2/URWDIN-Regular.woff2') format('woff2'),
                     url('https://storage.tres.my/font/font%3Awoff/URWDIN-Regular.woff') format('woff');
                font-weight: normal;
                font-style: normal;
              }
              @font-face {
                font-family: 'URW DIN';
                src: url('https://storage.tres.my/font/font%3Awoff2/URWDIN-Italic.woff2') format('woff2'),
                     url('https://storage.tres.my/font/font%3Awoff/URWDIN-Italic.woff') format('woff');
                font-weight: normal;
                font-style: italic;
              }
            `}
        </style>
      </Head>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            {/* Centered Image */}
            <div style={imageWrapper}>
              <Img
                src="https://storage.tres.my/tres-email/tres_email_template_2.jpeg"
                alt="Thank you"
                style={image}
              />
            </div>

            {/* Main Content */}
            <Text style={description}>
              Tag us in your IG Story or Reel featuring our product, and enjoy
              8% off your next order as a thank-you from us!
            </Text>

            {/* Website Link */}
            <Link href="https://www.tres.my" style={websiteLink}>
              www.tres.my
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles remain the same as your original
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "'URW DIN', sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "20px 0",
  maxWidth: "600px",
};

const content = {
  backgroundColor: "#ffffff",
  padding: "40px 30px",
  textAlign: "center" as const,
  borderRadius: "8px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
};

const imageWrapper = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "30px",
};

const image = {
  width: "100%",
  maxWidth: "400px",
  height: "auto",
  borderRadius: "8px",
};

const description = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#333333",
  margin: "0 0 30px 0",
  maxWidth: "400px",
  marginLeft: "auto",
  marginRight: "auto",
  fontFamily: "'URW DIN', sans-serif",
};

const websiteLink = {
  fontSize: "14px",
  color: "#A9BEE2",
  textDecoration: "none",
  fontWeight: "500",
  fontFamily: "'URW DIN', sans-serif",
};
