// src/admin/components/edit-flexible-bundle.tsx
import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Textarea,
  Switch,
  toast,
  Badge,
  Text,
  RadioGroup,
} from "@medusajs/ui";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { HttpTypes } from "@medusajs/framework/types";
import { Plus, Trash, PencilSquare } from "@medusajs/icons";

type FlexibleBundle = {
  id: string;
  title: string;
  handle?: string;
  description?: string;
  is_active: boolean;
  min_items: number;
  max_items?: number | null;
  selection_type: "flexible" | "required_all";
  discount_type?: "percentage" | "fixed";
  discount_2_items?: number | null;
  discount_3_items?: number | null;
  discount_2_items_amount?: number | null;
  discount_3_items_amount?: number | null;
  items?: {
    id: string;
    product_id: string;
    product: {
      id: string;
      title: string;
      status?: string;
    };
    quantity: number;
    is_optional: boolean;
    sort_order: number;
  }[];
};

type EditFlexibleBundleProps = {
  bundle: FlexibleBundle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const EditFlexibleBundle = ({
  bundle,
  open,
  onOpenChange,
}: EditFlexibleBundleProps) => {
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [minItems, setMinItems] = useState(1);
  const [maxItems, setMaxItems] = useState<number | undefined>(undefined);
  const [selectionType, setSelectionType] = useState<
    "flexible" | "required_all"
  >("flexible");

  // Enhanced discount settings
  const [enableDiscounts, setEnableDiscounts] = useState(true);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );

  // Percentage discount settings
  const [discount2Items, setDiscount2Items] = useState(10);
  const [discount3Items, setDiscount3Items] = useState(15);

  // Fixed amount discount settings (in RM)
  const [discount2ItemsAmount, setDiscount2ItemsAmount] = useState(20);
  const [discount3ItemsAmount, setDiscount3ItemsAmount] = useState(50);

  const [items, setItems] = useState<
    {
      id?: string;
      product_id: string | undefined;
      quantity: number;
      is_optional: boolean;
      sort_order: number;
    }[]
  >([]);

  const queryClient = useQueryClient();

  // Load products for selection
  const { data: products } = useQuery({
    queryKey: ["products-for-edit"],
    queryFn: async () => {
      try {
        const response = await sdk.client.fetch("/admin/products", {
          method: "GET",
          query: { offset: 0, limit: 100 },
        });
        return (
          (response as { products?: HttpTypes.AdminProduct[] }).products || []
        );
      } catch (error) {
        console.error("Error loading products:", error);
        return [];
      }
    },
  });

  // Initialize form with bundle data
  useEffect(() => {
    if (bundle && open) {
      setTitle(bundle.title || "");
      setHandle(bundle.handle || "");
      setDescription(bundle.description || "");
      setIsActive(bundle.is_active);
      setMinItems(bundle.min_items || 1);
      setMaxItems(bundle.max_items || undefined);
      setSelectionType(bundle.selection_type || "flexible");

      // Initialize discount settings
      setDiscountType(bundle.discount_type || "percentage");
      setEnableDiscounts(
        !!(
          bundle.discount_2_items ||
          bundle.discount_3_items ||
          bundle.discount_2_items_amount ||
          bundle.discount_3_items_amount
        )
      );

      // Percentage discounts
      setDiscount2Items(bundle.discount_2_items || 10);
      setDiscount3Items(bundle.discount_3_items || 15);

      // Fixed amount discounts (convert from cents to RM)
      setDiscount2ItemsAmount(
        bundle.discount_2_items_amount
          ? bundle.discount_2_items_amount / 100
          : 20
      );
      setDiscount3ItemsAmount(
        bundle.discount_3_items_amount
          ? bundle.discount_3_items_amount / 100
          : 50
      );

      // Initialize items
      if (bundle.items) {
        setItems(
          bundle.items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            is_optional: item.is_optional,
            sort_order: item.sort_order,
          }))
        );
      }
    }
  }, [bundle, open]);

  const { mutateAsync: updateBundle, isPending: isUpdating } = useMutation({
    mutationFn: async (bundleData: any) => {
      const response = await sdk.client.fetch(
        `/admin/bundled-products/${bundle.id}`,
        {
          method: "PUT",
          body: bundleData,
        }
      );
      return response;
    },
    onSuccess: () => {
      toast.success("Bundle updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["flexible-bundles"] });
      queryClient.invalidateQueries({ queryKey: ["bundled-products"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating bundle:", error);
      toast.error("Failed to update bundle");
    },
  });

  const handleUpdate = async () => {
    console.log("🎯 Frontend Values Before Processing:");
    console.log("  title:", title === "" ? "EMPTY_STRING" : `'${title}'`);
    console.log("  handle:", handle === "" ? "EMPTY_STRING" : `'${handle}'`);
    console.log(
      "  description:",
      description === "" ? "EMPTY_STRING" : `'${description}'`
    );
    console.log("  enableDiscounts:", enableDiscounts);
    console.log("  discountType:", discountType);

    const bundleData = {
      title: title, // Don't filter empty strings here
      handle: handle, // Don't filter empty strings here
      description: description, // Don't filter empty strings here
      is_active: isActive,
      min_items: minItems,
      max_items: maxItems,
      selection_type: selectionType,

      // Discount configuration
      discount_type: enableDiscounts ? discountType : "percentage",

      // Percentage discounts (only if percentage type and enabled)
      discount_2_items:
        enableDiscounts && discountType === "percentage"
          ? discount2Items
          : null,
      discount_3_items:
        enableDiscounts && discountType === "percentage"
          ? discount3Items
          : null,

      // Fixed amount discounts (only if fixed type and enabled) - convert RM to cents
      discount_2_items_amount:
        enableDiscounts && discountType === "fixed"
          ? Math.round(discount2ItemsAmount * 100)
          : null,
      discount_3_items_amount:
        enableDiscounts && discountType === "fixed"
          ? Math.round(discount3ItemsAmount * 100)
          : null,

      items: items
        .filter((item) => item.product_id)
        .map((item, index) => ({
          id: item.id,
          product_id: item.product_id!,
          quantity: item.quantity,
          is_optional: item.is_optional,
          sort_order: index,
        })),
    };

    console.log("📦 Final bundleData being sent:");
    console.log(
      "  title:",
      bundleData.title === "" ? "EMPTY_STRING" : `'${bundleData.title}'`
    );
    console.log(
      "  handle:",
      bundleData.handle === "" ? "EMPTY_STRING" : `'${bundleData.handle}'`
    );
    console.log(
      "  description:",
      bundleData.description === ""
        ? "EMPTY_STRING"
        : `'${bundleData.description}'`
    );
    console.log("  discount_type:", bundleData.discount_type);
    console.log(
      "  discount_2_items_amount (cents):",
      bundleData.discount_2_items_amount
    );
    console.log(
      "  discount_3_items_amount (cents):",
      bundleData.discount_3_items_amount
    );

    console.log("📦 Complete bundleData:", JSON.stringify(bundleData, null, 2));

    await updateBundle(bundleData);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: undefined,
        quantity: 1,
        is_optional: true,
        sort_order: items.length,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Calculate preview pricing for the discount preview
  const getDiscountPreview = () => {
    if (!enableDiscounts) return null;

    if (discountType === "percentage") {
      return {
        type: "percentage",
        twoItems: `${discount2Items}% off total`,
        threeItems: `${discount3Items}% off total`,
      };
    } else {
      return {
        type: "fixed",
        twoItems: `RM ${discount2ItemsAmount} off total`,
        threeItems: `RM ${discount3ItemsAmount} off total`,
      };
    }
  };

  const discountPreview = getDiscountPreview();

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content className="overflow-hidden max-w-4xl">
        <FocusModal.Header>
          <div className="flex items-center gap-3">
            <PencilSquare className="w-5 h-5" />
            <Heading level="h1">Edit Bundle: {bundle.title}</Heading>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-y-auto p-6 space-y-8">
          {/* Basic Information */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heading level="h2" className="text-lg font-semibold">
                Basic Information
              </Heading>
              <Badge color={isActive ? "green" : "grey"}>
                {isActive ? "Active" : "Draft"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">
                    Bundle Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Summer Collection Bundle"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="handle" className="text-sm font-medium">
                    Handle (URL)
                  </Label>
                  <Input
                    id="handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="summer-collection-bundle"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your bundle..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label className="text-sm">Bundle is active</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Selection Rules */}
          <div className="border rounded-lg p-6">
            <Heading level="h2" className="text-lg font-semibold mb-4">
              Selection Rules
            </Heading>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium">Selection Type</Label>
                <Select
                  value={selectionType}
                  onValueChange={(value) =>
                    setSelectionType(value as "flexible" | "required_all")
                  }
                >
                  <Select.Trigger className="mt-1">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="flexible">
                      Flexible Selection
                    </Select.Item>
                    <Select.Item value="required_all">
                      All Items Required
                    </Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Minimum Items</Label>
                <Input
                  type="number"
                  value={minItems}
                  onChange={(e) => setMinItems(parseInt(e.target.value) || 1)}
                  min={1}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Maximum Items</Label>
                <Input
                  type="number"
                  value={maxItems || ""}
                  onChange={(e) =>
                    setMaxItems(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="No limit"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Discount Settings */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h2" className="text-lg font-semibold">
                Bundle Pricing
              </Heading>
              <div className="flex items-center gap-2">
                <Switch
                  checked={enableDiscounts}
                  onCheckedChange={setEnableDiscounts}
                />
                <Label className="text-sm">Enable bundle discounts</Label>
              </div>
            </div>

            {enableDiscounts && (
              <div className="space-y-6">
                {/* Discount Type Selection */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Discount Type
                  </Label>
                  <RadioGroup
                    value={discountType}
                    onValueChange={(value) =>
                      setDiscountType(value as "fixed" | "percentage")
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroup.Item value="percentage" id="percentage" />
                      <div>
                        <Label htmlFor="percentage" className="font-medium">
                          Percentage Discount
                        </Label>
                        <Text className="text-xs text-ui-fg-muted">
                          Discount based on % off total price
                        </Text>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroup.Item value="fixed" id="fixed" />
                      <div>
                        <Label htmlFor="fixed" className="font-medium">
                          Fixed Amount Discount
                        </Label>
                        <Text className="text-xs text-ui-fg-muted">
                          Fixed RM amount off total price
                        </Text>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Discount Configuration */}
                <div className="grid grid-cols-2 gap-6">
                  {discountType === "percentage" ? (
                    <>
                      <div>
                        <Label className="text-sm font-medium">
                          2 Items Discount (%)
                        </Label>
                        <Input
                          type="number"
                          value={discount2Items}
                          onChange={(e) =>
                            setDiscount2Items(parseInt(e.target.value) || 0)
                          }
                          min={0}
                          max={100}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          3+ Items Discount (%)
                        </Label>
                        <Input
                          type="number"
                          value={discount3Items}
                          onChange={(e) =>
                            setDiscount3Items(parseInt(e.target.value) || 0)
                          }
                          min={0}
                          max={100}
                          className="mt-1"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm font-medium">
                          2 Items Discount (RM)
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            type="number"
                            value={discount2ItemsAmount}
                            onChange={(e) =>
                              setDiscount2ItemsAmount(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min={0}
                            step={0.01}
                            className="pl-8"
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ui-fg-muted text-sm">
                            RM
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          3+ Items Discount (RM)
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            type="number"
                            value={discount3ItemsAmount}
                            onChange={(e) =>
                              setDiscount3ItemsAmount(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min={0}
                            step={0.01}
                            className="pl-8"
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ui-fg-muted text-sm">
                            RM
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Discount Preview */}
                {discountPreview && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color="green">Preview</Badge>
                      <Text className="text-sm font-medium">
                        Bundle Pricing Structure
                      </Text>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>• 1 item: Regular price</div>
                      <div>• 2 items: {discountPreview.twoItems}</div>
                      <div>• 3+ items: {discountPreview.threeItems}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bundle Items */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h2" className="text-lg font-semibold">
                Bundle Products
              </Heading>
              <Button
                variant="secondary"
                onClick={addItem}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <EditBundleItem
                  key={index}
                  item={item}
                  index={index}
                  onUpdate={updateItem}
                  onRemove={() => removeItem(index)}
                  products={products || []}
                  canRemove={items.length > 1}
                />
              ))}

              {items.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Text className="text-ui-fg-muted mb-4">
                    No products configured
                  </Text>
                  <Button variant="secondary" onClick={addItem}>
                    Add First Product
                  </Button>
                </div>
              )}
            </div>
          </div>
        </FocusModal.Body>

        <FocusModal.Footer className="border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Badge color="blue">
                {items.filter((item) => item.product_id).length} products
                configured
              </Badge>
              {enableDiscounts && (
                <Badge color="green">
                  {discountType === "percentage" ? "Percentage" : "Fixed"}{" "}
                  discounts enabled
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdate}
                isLoading={isUpdating}
                disabled={
                  !title.trim() || items.every((item) => !item.product_id)
                }
              >
                Update Bundle
              </Button>
            </div>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};

// Edit Bundle Item Component
type EditBundleItemProps = {
  item: {
    id?: string;
    product_id: string | undefined;
    quantity: number;
    is_optional: boolean;
    sort_order: number;
  };
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: () => void;
  products: HttpTypes.AdminProduct[];
  canRemove: boolean;
};

const EditBundleItem = ({
  item,
  index,
  onUpdate,
  onRemove,
  products,
  canRemove,
}: EditBundleItemProps) => {
  const selectedProduct = products?.find((p) => p.id === item.product_id);

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <Text className="text-sm font-medium">Product {index + 1}</Text>
        {canRemove && (
          <Button variant="transparent" onClick={onRemove}>
            <Trash className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium">Product</Label>
          <Select
            value={item.product_id || ""}
            onValueChange={(value) => onUpdate(index, "product_id", value)}
          >
            <Select.Trigger className="mt-1">
              <Select.Value placeholder="Select a product" />
            </Select.Trigger>
            <Select.Content>
              {products?.map((product) => (
                <Select.Item key={product.id} value={product.id}>
                  {product.title}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">Quantity</Label>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) =>
              onUpdate(index, "quantity", parseInt(e.target.value) || 1)
            }
            min={1}
            className="mt-1"
          />
        </div>

        <div className="flex items-end">
          <div className="flex items-center gap-2">
            <Switch
              checked={item.is_optional}
              onCheckedChange={(checked) =>
                onUpdate(index, "is_optional", checked)
              }
            />
            <Label className="text-sm">Optional</Label>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="p-3 border rounded">
          <Text className="text-xs text-ui-fg-muted">
            Selected:{" "}
            <span className="font-medium">{selectedProduct.title}</span>
            {selectedProduct.status && (
              <Badge
                color={
                  selectedProduct.status === "published" ? "green" : "grey"
                }
                className="ml-2"
              >
                {selectedProduct.status}
              </Badge>
            )}
          </Text>
        </div>
      )}
    </div>
  );
};
