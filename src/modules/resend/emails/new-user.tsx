// import {
//   Html,
//   Head,
//   Preview,
//   Body,
//   Container,
//   Heading,
//   Text,
//   Img,
//   Section,
//   Button,
// } from "@react-email/components";

// type NewUserEmailProps = {
//   user: {
//     first_name?: string;
//     email: string;
//   };
//   promoCodes?: string[];
//   imageUrl?: string;
// };

// // Utility function to generate codes
// function generatePromoCodes(prefix: string, count: number, length: number) {
//   const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   const codes: string[] = [];

//   for (let i = 0; i < count; i++) {
//     let code = prefix;
//     for (let j = 0; j < length; j++) {
//       code += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     codes.push(code);
//   }

//   return codes;
// }

// export function NewUserEmail({
//   user,
//   promoCodes = generatePromoCodes("A", 1, 5), // default: 5 codes
//   imageUrl = "https://storage.tres.my/first_buyer_2.JPG",
// }: NewUserEmailProps) {
//   return (
//     <Html>
//       <Head>{/* your font-face styles remain unchanged */}</Head>
//       <Preview>Thank you for signing up!</Preview>
//       <Body style={main}>
//         <Container style={container} className="mobile-container">
//           {/* Header Image */}
//           <Section style={imageSection}>
//             <Img
//               src={imageUrl}
//               alt="Welcome to Tres"
//               width="100%"
//               height="250"
//               style={image}
//               className="mobile-image"
//             />
//             <div style={overlay}></div>
//           </Section>

//           {/* Welcome Heading */}
//           <Section style={content} className="mobile-content">
//             <Heading style={heading} className="mobile-heading">
//               Thank you for signing up!
//             </Heading>

//             {/* Welcome Message */}
//             <Text style={welcomeText} className="mobile-welcome">
//               Welcome to the TRES community — where style meets strength.
//             </Text>

//             <Text style={text} className="mobile-text">
//               As a first-time buyer, enjoy <strong style={bold}>10% OFF</strong>{" "}
//               your first purchase with us.
//             </Text>

//             {/* Promo Codes */}
//             <Section style={promoContainer}>
//               <Text style={promoLabel}>Your exclusive code:</Text>
//               {promoCodes.map((code, idx) => (
//                 <Text
//                   key={idx}
//                   style={promoCodeText}
//                   className="mobile-promo-code"
//                 >
//                   {code}
//                 </Text>
//               ))}
//             </Section>

//             <Text style={text} className="mobile-text">
//               Now go ahead, find your fit.
//             </Text>

//             {/* Call to Action Button */}
//             <Section style={buttonSection} className="mobile-button-section">
//               <Button
//                 style={button}
//                 className="mobile-button"
//                 href="https://tres.my/my/bundles"
//               >
//                 Shop Now
//               </Button>
//             </Section>
//           </Section>
//         </Container>
//       </Body>
//     </Html>
//   );
// }

// // === Styles ===
// const main = {
//   backgroundColor: "#f8fafc",
//   fontFamily:
//     '"URW DIN", -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
//   width: "100%",
//   margin: "0",
//   padding: "0",
// };

// const container = {
//   backgroundColor: "#ffffff",
//   margin: "0 auto",
//   padding: "0",
//   marginBottom: "64px",
//   maxWidth: "600px",
//   borderRadius: "12px",
//   overflow: "hidden",
//   boxShadow:
//     "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
//   width: "100%",
//   fontFamily: '"URW DIN", sans-serif',
// };

// const imageSection = {
//   padding: "0",
//   position: "relative" as const,
//   width: "100%",
// };

// const image = {
//   borderRadius: "0",
//   objectFit: "cover" as const,
//   objectPosition: "50% 28%",
//   display: "block",
//   width: "100%",
//   maxWidth: "100%",
// };

// const overlay = {
//   position: "absolute" as const,
//   top: "0",
//   left: "0",
//   right: "0",
//   bottom: "0",
//   background:
//     "linear-gradient(135deg, rgba(153, 178, 221, 0.08) 0%, rgba(153, 178, 221, 0.03) 100%)",
// };

// const content = {
//   padding: "48px 48px 32px",
//   width: "100%",
//   boxSizing: "border-box" as const,
//   fontFamily: '"URW DIN", sans-serif',
// };

// const heading = {
//   fontSize: "32px",
//   lineHeight: "1.2",
//   fontWeight: "800",
//   color: "#1f2937",
//   textAlign: "center" as const,
//   margin: "0 0 24px",
//   letterSpacing: "-0.025em",
//   width: "100%",
//   fontFamily: '"URW DIN", sans-serif',
// };

// const welcomeText = {
//   fontSize: "20px",
//   lineHeight: "1.4",
//   color: "#4b5563",
//   textAlign: "center" as const,
//   margin: "0 0 32px",
//   fontWeight: "500",
//   width: "100%",
//   fontFamily: '"URW DIN", sans-serif',
// };

// const text = {
//   fontSize: "16px",
//   lineHeight: "1.6",
//   color: "#374151",
//   margin: "16px 0",
//   textAlign: "center" as const,
//   width: "100%",
//   fontFamily: '"URW DIN", sans-serif',
// };

// const bold = {
//   color: "#99B2DD",
//   fontWeight: "700",
//   fontFamily: '"URW DIN", sans-serif',
// };

// const promoContainer = {
//   textAlign: "center" as const,
//   width: "100%",
//   margin: "24px 0",
// };

// const promoLabel = {
//   fontSize: "14px",
//   fontWeight: "500",
//   color: "#6b7280",
//   margin: "0 0 8px",
//   display: "block",
// };

// const promoCodeText = {
//   fontSize: "20px",
//   fontWeight: "800",
//   color: "#99B2DD",
//   letterSpacing: "2px",
//   margin: "4px 0",
//   fontFamily: "monospace",
//   textShadow: "0 2px 4px rgba(99, 102, 241, 0.1)",
// };

// const buttonSection = {
//   textAlign: "center" as const,
//   margin: "40px 0 32px",
//   width: "100%",
//   fontFamily: '"URW DIN", sans-serif',
// };

// const button = {
//   backgroundColor: "#99B2DD",
//   borderRadius: "8px",
//   color: "#ffffff",
//   fontSize: "16px",
//   fontWeight: "600",
//   textDecoration: "none",
//   textAlign: "center" as const,
//   display: "inline-block",
//   padding: "14px 40px",
//   cursor: "pointer",
//   border: "none",
//   letterSpacing: "0.5px",
//   minWidth: "120px",
//   fontFamily: '"URW DIN", sans-serif',
// };

// // @ts-ignore
// // npm run dev:email
// export default () => (
//   <NewUserEmail
//     user={{ first_name: "Joanna", email: "traumfrau283@gmail.com" }}
//   />
// );

// src/modules/resend/emails/new-user.tsx
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
} from "@react-email/components";

type NewUserEmailProps = {
  user: {
    first_name?: string;
    email: string;
  };
  promoCodes: string[]; // Remove default generation, require codes to be passed
  imageUrl?: string;
};

export function NewUserEmail({
  user,
  promoCodes, // No default value - must be provided
  imageUrl = "https://storage.tres.my/first_buyer_2.JPG",
}: NewUserEmailProps) {
  return (
    <Html>
      <Head>{/* your font-face styles remain unchanged */}</Head>
      <Preview>
        Thank you for signing up! Your exclusive 10% OFF code inside.
      </Preview>
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
              Welcome to TRES, {user.first_name}!
            </Heading>

            {/* Welcome Message */}
            <Text style={welcomeText} className="mobile-welcome">
              Welcome to the TRES community — where style meets strength.
            </Text>

            <Text style={text} className="mobile-text">
              As a first-time buyer, enjoy <strong style={bold}>10% OFF</strong>{" "}
              your first purchase with us. This exclusive offer is valid for 3
              months.
            </Text>

            {/* Promo Codes */}
            <Section style={promoContainer}>
              <Text style={promoLabel}>Your exclusive code:</Text>
              {promoCodes.map((code, idx) => (
                <Text
                  key={idx}
                  style={promoCodeText}
                  className="mobile-promo-code"
                >
                  {code}
                </Text>
              ))}
            </Section>

            <Text style={expiryText} className="mobile-text">
              ⏰ <strong>Valid for 3 months</strong> from sign-up date. Use it
              before it expires!
            </Text>

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

            {/* Footer Info */}
            <Text style={footerText}>
              Questions? Reply to this email or contact our support team.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// === Styles ===
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

const expiryText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#dc2626", // Red color for urgency
  margin: "16px 0",
  textAlign: "center" as const,
  width: "100%",
  fontFamily: '"URW DIN", sans-serif',
};

const footerText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#6b7280",
  margin: "32px 0 0",
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
  padding: "20px",
  backgroundColor: "#f3f4f6",
  borderRadius: "12px",
};

const promoLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#6b7280",
  margin: "0 0 8px",
  display: "block",
};

const promoCodeText = {
  fontSize: "24px",
  fontWeight: "800",
  color: "#99B2DD",
  letterSpacing: "3px",
  margin: "4px 0",
  fontFamily: "monospace",
  textShadow: "0 2px 4px rgba(99, 102, 241, 0.1)",
  padding: "12px 20px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "2px dashed #99B2DD",
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
  transition: "background-color 0.2s ease",
};

// @ts-ignore
// npm run dev:email
export default () => (
  <NewUserEmail
    user={{ first_name: "Joanna", email: "traumfrau283@gmail.com" }}
    promoCodes={["TRES123ABC"]} // Example code for testing
  />
);
