import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Img,
  Section,
  Button,
  Hr,
} from "@react-email/components";

type NewUserEmailProps = {
  user: {
    first_name?: string;
    email: string;
  };
  promoCode?: string;
  imageUrl?: string;
};

export function NewUserEmail({
  user,
  promoCode = "TRES10",
  imageUrl = "https://storage.tres.my/first_buyer_2.JPG",
}: NewUserEmailProps) {
  return (
    <Html>
      <Head>
        <style>{`
            @font-face {
              font-family: 'URW DIN';
              src: url('/font/URWDIN-Regular.eot');
              src: local('URW DIN Regular'), local('URWDIN-Regular'),
                  url('/font/URWDIN-Regular.eot?#iefix') format('embedded-opentype'),
                  url('/font/URWDIN-Regular.woff2') format('woff2'),
                  url('/font/URWDIN-Regular.woff') format('woff'),
                  url('/font/URWDIN-Regular.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
            }
            
            @font-face {
              font-family: 'URW DIN';
              src: url('/font/URWDIN-Medium.eot');
              src: local('URW DIN Medium'), local('URWDIN-Medium'),
                  url('/font/URWDIN-Medium.eot?#iefix') format('embedded-opentype'),
                  url('/font/URWDIN-Medium.woff2') format('woff2'),
                  url('/font/URWDIN-Medium.woff') format('woff'),
                  url('/font/URWDIN-Medium.ttf') format('truetype');
              font-weight: 500;
              font-style: normal;
            }
            
            @font-face {
              font-family: 'URW DIN';
              src: url('/font/URWDIN-Bold.eot');
              src: local('URW DIN Bold'), local('URWDIN-Bold'),
                  url('/font/URWDIN-Bold.eot?#iefix') format('embedded-opentype'),
                  url('/font/URWDIN-Bold.woff2') format('woff2'),
                  url('/font/URWDIN-Bold.woff') format('woff'),
                  url('/font/URWDIN-Bold.ttf') format('truetype');
              font-weight: bold;
              font-style: normal;
            }
            
            @font-face {
              font-family: 'URW DIN';
              src: url('/font/URWDIN-Light.eot');
              src: local('URW DIN Light'), local('URWDIN-Light'),
                  url('/font/URWDIN-Light.eot?#iefix') format('embedded-opentype'),
                  url('/font/URWDIN-Light.woff2') format('woff2'),
                  url('/font/URWDIN-Light.woff') format('woff'),
                  url('/font/URWDIN-Light.ttf') format('truetype');
              font-weight: 300;
              font-style: normal;
            }
            
            @font-face {
              font-family: 'URW DIN';
              src: url('/font/URWDIN-Black.eot');
              src: local('URW DIN Black'), local('URWDIN-Black'),
                  url('/font/URWDIN-Black.eot?#iefix') format('embedded-opentype'),
                  url('/font/URWDIN-Black.woff2') format('woff2'),
                  url('/font/URWDIN-Black.woff') format('woff'),
                  url('/font/URWDIN-Black.ttf') format('truetype');
              font-weight: 900;
              font-style: normal;
            }
            
            * {
              font-family: 'URW DIN', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif !important;
            }
            
            @media only screen and (max-width: 600px) {
              .mobile-container {
                max-width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
              }
              .mobile-content {
                padding: 24px 20px 20px !important;
              }
              .mobile-heading {
                font-size: 24px !important;
                line-height: 1.3 !important;
                margin: 0 0 16px !important;
              }
              .mobile-welcome {
                font-size: 16px !important;
                margin: 0 0 20px !important;
              }
              .mobile-text {
                font-size: 14px !important;
                margin: 12px 0 !important;
              }
              .mobile-promo {
                padding: 12px 16px !important;
                margin: 16px 0 !important;
                border-radius: 10px !important;
                display: inline-block !important;
              }
              .mobile-promo-code {
                font-size: 18px !important;
                letter-spacing: 1.5px !important;
              }
              .mobile-button-section {
                margin: 24px 0 20px !important;
              }
              .mobile-button {
                padding: 14px 32px !important;
                font-size: 14px !important;
                border-radius: 10px !important;
              }
              .mobile-image {
                height: 200px !important;
              }
            }
            
            @media only screen and (max-width: 480px) {
              .mobile-container {
                margin: 0 8px !important;
                border-radius: 8px !important;
              }
              .mobile-content {
                padding: 20px 16px 16px !important;
              }
              .mobile-heading {
                font-size: 22px !important;
              }
              .mobile-welcome {
                font-size: 15px !important;
              }
              .mobile-promo {
                padding: 10px 14px !important;
                margin: 14px 0 !important;
                border-radius: 8px !important;
                display: inline-block !important;
              }
              .mobile-promo-code {
                font-size: 16px !important;
                letter-spacing: 1px !important;
              }
              .mobile-button {
                padding: 12px 24px !important;
                font-size: 13px !important;
              }
              .mobile-image {
                height: 180px !important;
              }
            }
          `}</style>
      </Head>
      <Preview>Thank you for signing up!</Preview>
      <Body style={main}>
        <Container style={container} className="mobile-container">
          {/* Header Image */}
          <Section style={imageSection}>
            <Img
              src={imageUrl}
              alt="Welcome to Tres"
              width="100%"
              height="250"
              style={image}
              className="mobile-image"
            />
            <div style={overlay}></div>
          </Section>

          {/* Welcome Heading */}
          <Section style={content} className="mobile-content">
            <Heading style={heading} className="mobile-heading">
              Thank you for signing up!
            </Heading>

            {/* Welcome Message */}
            <Text style={welcomeText} className="mobile-welcome">
              Welcome to the TRES community — where style meets strength.
            </Text>

            <Text style={text} className="mobile-text">
              As a first-time buyer, enjoy <strong style={bold}>10% OFF</strong>{" "}
              your first purchase with us.
            </Text>

            {/* Promo Code Highlight */}
            <Section style={promoContainer}>
              <Text style={promoLabel}>Enter code:</Text>
              <Text style={promoCodeText} className="mobile-promo-code">
                {promoCode}
              </Text>
            </Section>

            <Text style={text} className="mobile-text">
              Now go ahead, find your fit.
            </Text>

            {/* Call to Action Button */}
            <Section style={buttonSection} className="mobile-button-section">
              <Button
                style={button}
                className="mobile-button"
                href="https://tres.my/my/bundles"
              >
                Shop Now
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '"URW DIN", -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  width: "100%",
  margin: "0",
  padding: "0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  marginBottom: "64px",
  maxWidth: "600px",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  width: "100%",
  fontFamily: '"URW DIN", sans-serif',
};

const imageSection = {
  padding: "0",
  position: "relative" as const,
  width: "100%",
};

const image = {
  borderRadius: "0",
  objectFit: "cover" as const,
  objectPosition: "50% 28%",
  display: "block",
  width: "100%",
  maxWidth: "100%",
};

const overlay = {
  position: "absolute" as const,
  top: "0",
  left: "0",
  right: "0",
  bottom: "0",
  background:
    "linear-gradient(135deg, rgba(153, 178, 221, 0.08) 0%, rgba(153, 178, 221, 0.03) 100%)",
};

const content = {
  padding: "48px 48px 32px",
  width: "100%",
  boxSizing: "border-box" as const,
  fontFamily: '"URW DIN", sans-serif',
};

const heading = {
  fontSize: "32px",
  lineHeight: "1.2",
  fontWeight: "800",
  color: "#1f2937",
  textAlign: "center" as const,
  margin: "0 0 24px",
  letterSpacing: "-0.025em",
  width: "100%",
  fontFamily: '"URW DIN", sans-serif',
};

const welcomeText = {
  fontSize: "20px",
  lineHeight: "1.4",
  color: "#4b5563",
  textAlign: "center" as const,
  margin: "0 0 32px",
  fontWeight: "500",
  width: "100%",
  fontFamily: '"URW DIN", sans-serif',
};

const text = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "16px 0",
  textAlign: "center" as const,
  width: "100%",
  fontFamily: '"URW DIN", sans-serif',
};

const bold = {
  color: "#99B2DD",
  fontWeight: "700",
  fontFamily: '"URW DIN", sans-serif',
};

const promoContainer = {
  textAlign: "center" as const,
  width: "100%",
  margin: "24px 0",
};

const promoSection = {
  backgroundColor: "linear-gradient(135deg, #f8faff 0%, #f1f5ff 100%)",
  borderRadius: "12px",
  padding: "16px 20px",
  textAlign: "center" as const,
  border: "2px solid #e0e7ff",
  position: "relative" as const,
  background: "linear-gradient(135deg, #f8faff 0%, #f1f5ff 100%)",
  width: "auto",
  display: "inline-block",
  boxSizing: "border-box" as const,
  margin: "0",
};

const promoTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#6b7280",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const promoLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#6b7280",
  margin: "0 0 4px",
  display: "block",
};

const promoCodeText = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#99B2DD",
  letterSpacing: "2px",
  margin: "0",
  fontFamily: "monospace",
  textShadow: "0 2px 4px rgba(99, 102, 241, 0.1)",
};

const promoDescription = {
  fontSize: "16px",
  color: "#6b7280",
  margin: "0",
  fontWeight: "500",
  fontFamily: '"URW DIN", sans-serif',
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "40px 0 32px",
  width: "100%",
  fontFamily: '"URW DIN", sans-serif',
};

const button = {
  backgroundColor: "#99B2DD",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
  cursor: "pointer",
  border: "none",
  letterSpacing: "0.5px",
  minWidth: "120px",
  fontFamily: '"URW DIN", sans-serif',
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const benefitsList = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "16px 0",
  paddingLeft: "16px",
  fontFamily: '"URW DIN", sans-serif',
};

const signature = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#6b7280",
  textAlign: "center" as const,
  margin: "32px 0 16px",
  fontStyle: "italic",
  fontFamily: '"URW DIN", sans-serif',
};

// @ts-ignore
// npm run dev:email
export default () => (
  <NewUserEmail
    user={{ first_name: "Joanna", email: "traumfrau283@gmail.com" }}
  />
);
