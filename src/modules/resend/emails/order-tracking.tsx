import {
  Text,
  Column,
  Container,
  Heading,
  Html,
  Img,
  Row,
  Section,
  Button,
} from "@react-email/components";
import { BigNumberValue, OrderDTO } from "@medusajs/framework/types";

type OrderShippedEmailProps = {
  order: OrderDTO;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
};

function OrderShippedEmailComponent({
  order,
  trackingNumber,
  trackingUrl,
  carrier,
}: OrderShippedEmailProps) {
  const formatter = new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: order.currency_code,
  });

  const formatPrice = (price: BigNumberValue) => {
    if (typeof price === "number") return formatter.format(price);
    if (typeof price === "string") return formatter.format(parseFloat(price));
    return price?.toString() || "";
  };

  // Group items by bundle
  const groupedItems = order.items?.reduce(
    (acc, item) => {
      const isBundle = item.metadata?.is_from_bundle === true;

      if (isBundle) {
        const bundleId = item.metadata?.bundle_id as string;
        if (!acc.bundles[bundleId]) {
          acc.bundles[bundleId] = {
            bundle_id: bundleId,
            bundle_title: item.metadata?.bundle_title as string,
            items: [],
            total: 0,
          };
        }
        acc.bundles[bundleId].items.push(item);
        acc.bundles[bundleId].total +=
          typeof item.total === "number"
            ? item.total
            : parseFloat(item.total?.toString() || "0");
      } else {
        acc.individual.push(item);
      }

      return acc;
    },
    { bundles: {} as Record<string, any>, individual: [] as any[] }
  ) || { bundles: {}, individual: [] };

  return (
    <Html lang="en">
      <Container
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "40px 20px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {/* Header */}
        <Heading
          style={{
            fontSize: "28px",
            fontWeight: "600",
            marginBottom: "8px",
            color: "#000000",
            letterSpacing: "-0.5px",
          }}
        >
          Your order is on its way
        </Heading>
        <Text
          style={{
            fontSize: "16px",
            marginBottom: "32px",
            color: "#666666",
            lineHeight: "24px",
          }}
        >
          Hi {order.email}, your order has been shipped and is on its way to
          you.
        </Text>

        {/* Tracking Info */}
        {(trackingNumber || carrier) && (
          <Section
            style={{
              marginBottom: "32px",
              padding: "24px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              border: "1px solid #e5e5e5",
            }}
          >
            <Text
              style={{
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#000000",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                margin: "0 0 16px 0",
              }}
            >
              Tracking Information
            </Text>

            {carrier && (
              <Row style={{ marginBottom: "12px" }}>
                <Column style={{ width: "120px" }}>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: "#666666",
                      margin: "0",
                    }}
                  >
                    Carrier
                  </Text>
                </Column>
                <Column>
                  <Text
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#000000",
                      margin: "0",
                    }}
                  >
                    {carrier}
                  </Text>
                </Column>
              </Row>
            )}

            {trackingNumber && (
              <Row style={{ marginBottom: trackingUrl ? "20px" : "0" }}>
                <Column style={{ width: "120px" }}>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: "#666666",
                      margin: "0",
                    }}
                  >
                    Tracking Number
                  </Text>
                </Column>
                <Column>
                  <Text
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#000000",
                      margin: "0",
                      fontFamily: "monospace",
                    }}
                  >
                    {trackingNumber}
                  </Text>
                </Column>
              </Row>
            )}

            {trackingUrl && (
              <Button
                href={trackingUrl}
                style={{
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  padding: "12px 24px",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontWeight: "500",
                  fontSize: "14px",
                  display: "inline-block",
                  width: "100%",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              >
                Track Your Order
              </Button>
            )}
          </Section>
        )}

        {/* Order Items */}
        <Section style={{ marginBottom: "32px" }}>
          <Text
            style={{
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#000000",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Items in this shipment
          </Text>

          {Object.values(groupedItems.bundles).map((bundle: any) => (
            <Section
              key={bundle.bundle_id}
              style={{
                marginBottom: "24px",
                paddingBottom: "24px",
                borderBottom: "1px solid #e5e5e5",
              }}
            >
              <Text
                style={{
                  margin: "0 0 16px 0",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#666666",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Bundle: {bundle.bundle_title}
              </Text>
              {bundle.items.map((item: any) => (
                <Row key={item.id} style={{ marginBottom: "16px" }}>
                  <Column style={{ width: "64px" }}>
                    <Img
                      src={item.thumbnail || "/images/placeholder.png"}
                      alt={item.product_title || "Product image"}
                      width="64"
                      height="64"
                      style={{
                        borderRadius: "4px",
                        objectFit: "cover",
                        display: "block",
                        border: "1px solid #e5e5e5",
                      }}
                    />
                  </Column>
                  <Column style={{ paddingLeft: "16px", verticalAlign: "top" }}>
                    <Text
                      style={{
                        margin: "0 0 4px 0",
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#000000",
                      }}
                    >
                      {item.product_title}
                    </Text>
                    {item.variant_title && (
                      <Text
                        style={{
                          fontSize: "13px",
                          color: "#666666",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {item.variant_title}
                      </Text>
                    )}
                    <Text
                      style={{
                        fontSize: "13px",
                        color: "#666666",
                        margin: "0",
                      }}
                    >
                      Quantity: {item.quantity}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
          ))}

          {groupedItems.individual.map((item) => (
            <Section
              key={item.id}
              style={{
                marginBottom: "16px",
                paddingBottom: "16px",
                borderBottom: "1px solid #e5e5e5",
              }}
            >
              <Row>
                <Column style={{ width: "64px" }}>
                  <Img
                    src={item.thumbnail || "https://via.placeholder.com/64"}
                    alt={item.product_title || "Product image"}
                    width="64"
                    height="64"
                    style={{
                      borderRadius: "4px",
                      objectFit: "cover",
                      display: "block",
                      border: "1px solid #e5e5e5",
                    }}
                  />
                </Column>

                <Column
                  style={{
                    paddingLeft: "16px",
                    verticalAlign: "top",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      margin: "0 0 4px 0",
                      color: "#000000",
                    }}
                  >
                    {item.product_title}
                  </Text>
                  {item.variant_title && (
                    <Text
                      style={{
                        fontSize: "13px",
                        color: "#666666",
                        margin: "0 0 4px 0",
                      }}
                    >
                      {item.variant_title}
                    </Text>
                  )}
                  <Text
                    style={{ fontSize: "13px", color: "#666666", margin: "0" }}
                  >
                    Quantity: {item.quantity}
                  </Text>
                </Column>
              </Row>
            </Section>
          ))}
        </Section>

        {/* Shipping Address */}
        <Section style={{ marginBottom: "40px" }}>
          <Text
            style={{
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#000000",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Shipping Address
          </Text>
          {order.shipping_address ? (
            <>
              <Text
                style={{
                  fontSize: "14px",
                  margin: "0 0 2px 0",
                  color: "#666666",
                }}
              >
                {order.shipping_address.first_name || ""}{" "}
                {order.shipping_address.last_name || ""}
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  margin: "0 0 2px 0",
                  color: "#666666",
                }}
              >
                {order.shipping_address.address_1 || ""}
              </Text>
              {order.shipping_address.address_2 && (
                <Text
                  style={{
                    fontSize: "14px",
                    margin: "0 0 2px 0",
                    color: "#666666",
                  }}
                >
                  {order.shipping_address.address_2}
                </Text>
              )}
              <Text
                style={{
                  fontSize: "14px",
                  margin: "0 0 2px 0",
                  color: "#666666",
                }}
              >
                {order.shipping_address.city || ""},{" "}
                {order.shipping_address.province || ""}{" "}
                {order.shipping_address.postal_code || ""}
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  margin: "0 0 2px 0",
                  color: "#666666",
                }}
              >
                {order.shipping_address.country_code?.toUpperCase() || ""}
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: "14px", color: "#999999" }}>
              No shipping address provided
            </Text>
          )}
        </Section>

        {/* Contact Info */}
        <Section style={{ paddingTop: "32px", borderTop: "1px solid #e5e5e5" }}>
          <Text
            style={{
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#000000",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Need Help?
          </Text>
          <Text
            style={{ fontSize: "14px", margin: "0 0 4px 0", color: "#666666" }}
          >
            Email:{" "}
            <a
              href="mailto:admin@tres.my"
              style={{ color: "#000000", textDecoration: "none" }}
            >
              admin@tres.my
            </a>
          </Text>
          <Text style={{ fontSize: "14px", margin: "0", color: "#666666" }}>
            Phone:{" "}
            <a
              href="tel:+60135385308"
              style={{ color: "#000000", textDecoration: "none" }}
            >
              +60 13 538 5308
            </a>
          </Text>
        </Section>
      </Container>
    </Html>
  );
}

export const orderShippedEmail = (props: OrderShippedEmailProps) => (
  <OrderShippedEmailComponent {...props} />
);
