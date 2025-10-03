import {
  Text,
  Column,
  Container,
  Heading,
  Html,
  Img,
  Row,
  Section,
} from "@react-email/components";
import { BigNumberValue, OrderDTO } from "@medusajs/framework/types";

type OrderPlacedEmailProps = {
  order: OrderDTO;
};

function OrderPlacedEmailComponent({ order }: OrderPlacedEmailProps) {
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
          Order confirmed
        </Heading>
        <Text
          style={{
            fontSize: "16px",
            marginBottom: "32px",
            color: "#666666",
            lineHeight: "24px",
          }}
        >
          Hi {order.email}, we're getting your order ready.
        </Text>

        {/* Order Items */}
        <Section style={{ marginBottom: "32px" }}>
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
              <Text
                style={{
                  margin: "12px 0 0",
                  fontSize: "14px",
                  fontWeight: "500",
                  textAlign: "right",
                  color: "#000000",
                }}
              >
                {formatPrice(bundle.total)}
              </Text>
            </Section>
          ))}

          {groupedItems.individual.map((item) => (
            <Section
              key={item.id}
              style={{
                marginBottom: "24px",
                paddingBottom: "24px",
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
                    width: "calc(100% - 180px)",
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

                <Column
                  style={{
                    textAlign: "right",
                    verticalAlign: "top",
                    width: "100px",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      margin: "0",
                      color: "#000000",
                    }}
                  >
                    {formatPrice(item.total)}
                  </Text>
                </Column>
              </Row>
            </Section>
          ))}
        </Section>

        {/* Order Summary */}
        <Section style={{ marginBottom: "40px" }}>
          <Row style={{ marginBottom: "8px" }}>
            <Column style={{ width: "50%" }}>
              <Text style={{ fontSize: "14px", color: "#666666", margin: "0" }}>
                Subtotal
              </Text>
            </Column>
            <Column style={{ width: "50%", textAlign: "right" }}>
              <Text style={{ fontSize: "14px", color: "#000000", margin: "0" }}>
                {formatPrice(order.subtotal)}
              </Text>
            </Column>
          </Row>

          <Row
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "2px solid #000000",
            }}
          >
            <Column style={{ width: "50%" }}>
              <Text
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                  margin: "0",
                }}
              >
                Total
              </Text>
            </Column>
            <Column style={{ width: "50%", textAlign: "right" }}>
              <Text
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                  margin: "0",
                }}
              >
                {formatPrice(order.total)}
              </Text>
            </Column>
          </Row>
        </Section>

        {/* Shipping Method */}
        {order.shipping_methods && order.shipping_methods.length > 0 && (
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
              Shipping Method
            </Text>
            {order.shipping_methods.map((method: any) => (
              <div key={method.id}>
                <Text
                  style={{
                    fontSize: "14px",
                    margin: "0",
                    color: "#666666",
                  }}
                >
                  {method.name || "Standard Shipping"}
                </Text>
              </div>
            ))}
          </Section>
        )}

        {/* Addresses */}
        <Section style={{ marginBottom: "40px" }}>
          <Row>
            <Column
              style={{
                width: "50%",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
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
                  {order.shipping_address.phone && (
                    <Text
                      style={{
                        fontSize: "14px",
                        margin: "8px 0 0 0",
                        color: "#666666",
                      }}
                    >
                      {order.shipping_address.phone}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={{ fontSize: "14px", color: "#999999" }}>
                  No shipping address provided
                </Text>
              )}
            </Column>

            <Column
              style={{
                width: "50%",
                paddingLeft: "16px",
                verticalAlign: "top",
              }}
            >
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
                Billing Address
              </Text>
              {order.billing_address ? (
                <>
                  <Text
                    style={{
                      fontSize: "14px",
                      margin: "0 0 2px 0",
                      color: "#666666",
                    }}
                  >
                    {order.billing_address.first_name || ""}{" "}
                    {order.billing_address.last_name || ""}
                  </Text>
                  <Text
                    style={{
                      fontSize: "14px",
                      margin: "0 0 2px 0",
                      color: "#666666",
                    }}
                  >
                    {order.billing_address.address_1 || ""}
                  </Text>
                  {order.billing_address.address_2 && (
                    <Text
                      style={{
                        fontSize: "14px",
                        margin: "0 0 2px 0",
                        color: "#666666",
                      }}
                    >
                      {order.billing_address.address_2}
                    </Text>
                  )}
                  <Text
                    style={{
                      fontSize: "14px",
                      margin: "0 0 2px 0",
                      color: "#666666",
                    }}
                  >
                    {order.billing_address.city || ""},{" "}
                    {order.billing_address.province || ""}{" "}
                    {order.billing_address.postal_code || ""}
                  </Text>
                  <Text
                    style={{
                      fontSize: "14px",
                      margin: "0 0 2px 0",
                      color: "#666666",
                    }}
                  >
                    {order.billing_address.country_code?.toUpperCase() || ""}
                  </Text>
                  {order.billing_address.phone && (
                    <Text
                      style={{
                        fontSize: "14px",
                        margin: "8px 0 0 0",
                        color: "#666666",
                      }}
                    >
                      {order.billing_address.phone}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={{ fontSize: "14px", color: "#999999" }}>
                  No billing address provided
                </Text>
              )}
            </Column>
          </Row>
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
          <Text
            style={{ fontSize: "14px", margin: "0 0 16px 0", color: "#666666" }}
          >
            Phone:{" "}
            <a
              href="tel:+60135385308"
              style={{ color: "#000000", textDecoration: "none" }}
            >
              +60 13 538 5308
            </a>
          </Text>

          <Text
            style={{
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "8px",
              marginTop: "16px",
              color: "#000000",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Warehouse Pickup
          </Text>
          <Text
            style={{ fontSize: "14px", margin: "0 0 2px 0", color: "#666666" }}
          >
            24 Lorong Batu Jelutong Barat
          </Text>
          <Text style={{ fontSize: "14px", margin: "0", color: "#666666" }}>
            11600 Jelutong, Penang
          </Text>
        </Section>
      </Container>
    </Html>
  );
}

export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
  <OrderPlacedEmailComponent {...props} />
);
