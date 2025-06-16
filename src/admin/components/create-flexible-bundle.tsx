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
} from "@medusajs/ui";
import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { HttpTypes } from "@medusajs/framework/types";

export const CreateFlexibleBundle = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [minItems, setMinItems] = useState(1);
  const [maxItems, setMaxItems] = useState<number | undefined>(undefined);
  const [selectionType, setSelectionType] = useState<
    "flexible" | "required_all"
  >("flexible");

  // Discount settings
  const [discount2Items, setDiscount2Items] = useState(10);
  const [discount3Items, setDiscount3Items] = useState(15);
  const [enableDiscounts, setEnableDiscounts] = useState(true);

  const [items, setItems] = useState<
    {
      product_id: string | undefined;
      quantity: number;
      is_optional: boolean;
      sort_order: number;
    }[]
  >([
    {
      product_id: undefined,
      quantity: 1,
      is_optional: true,
      sort_order: 0,
    },
  ]);

  const [products, setProducts] = useState<HttpTypes.AdminProduct[]>([]);
  const productsLimit = 15;
  const [currentProductPage, setCurrentProductPage] = useState(0);
  const [productsCount, setProductsCount] = useState(0);

  const hasNextPage = useMemo(() => {
    return productsCount ? productsCount > productsLimit : true;
  }, [productsCount, productsLimit]);

  const queryClient = useQueryClient();

  useQuery({
    queryKey: ["products", currentProductPage],
    queryFn: async () => {
      const { products, count } = await sdk.admin.product.list({
        limit: productsLimit,
        offset: currentProductPage * productsLimit,
      });
      setProductsCount(count);
      setProducts((prev) => [...prev, ...products]);
      return products;
    },
    enabled: hasNextPage,
  });

  const fetchMoreProducts = () => {
    if (!hasNextPage) {
      return;
    }
    setCurrentProductPage(currentProductPage + 1);
  };

  // Auto-generate handle from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (!handle || handle === title.toLowerCase().replace(/\s+/g, "-")) {
      setHandle(newTitle.toLowerCase().replace(/\s+/g, "-"));
    }
  };

  const { mutateAsync: createFlexibleBundle, isPending: isCreating } =
    useMutation({
      mutationFn: async (data: Record<string, any>) => {
        await sdk.client.fetch("/admin/bundled-products", {
          method: "POST",
          body: data,
        });
      },
    });

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!title.trim()) {
        toast.error("Title is required");
        return;
      }
      if (!handle.trim()) {
        toast.error("Handle is required");
        return;
      }
      if (items.some((item) => !item.product_id)) {
        toast.error("All items must have a product selected");
        return;
      }

      await createFlexibleBundle({
        title: title.trim(),
        handle: handle.trim(),
        description: description.trim() || undefined,
        is_active: isActive,
        min_items: minItems,
        max_items: maxItems || undefined,
        selection_type: selectionType,
        // Include discount settings
        discount_2_items: enableDiscounts ? discount2Items : null,
        discount_3_items: enableDiscounts ? discount3Items : null,
        items: items
          .filter((item) => item.product_id)
          .map((item, index) => ({
            product_id: item.product_id!,
            quantity: item.quantity,
            is_optional: item.is_optional,
            sort_order: index,
          })),
      });

      setOpen(false);
      toast.success("Flexible bundle created successfully");
      queryClient.invalidateQueries({
        queryKey: ["flexible-bundles"], // Match the listing page query key
      });
      queryClient.invalidateQueries({
        queryKey: ["bundled-products"],
      });

      // Reset form
      resetForm();
    } catch (error) {
      toast.error("Failed to create flexible bundle");
    }
  };

  const resetForm = () => {
    setTitle("");
    setHandle("");
    setDescription("");
    setIsActive(true);
    setMinItems(1);
    setMaxItems(undefined);
    setSelectionType("flexible");
    setDiscount2Items(10);
    setDiscount3Items(15);
    setEnableDiscounts(true);
    setItems([
      {
        product_id: undefined,
        quantity: 1,
        is_optional: true,
        sort_order: 0,
      },
    ]);
  };

  return (
    <FocusModal open={open} onOpenChange={setOpen}>
      <FocusModal.Trigger asChild>
        <Button variant="primary">Create Bundle</Button>
      </FocusModal.Trigger>
      <FocusModal.Content className="overflow-hidden">
        <FocusModal.Header>
          <Heading level={"h1"}>Create Flexible Bundle</Heading>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-hidden p-0">
          <div className="h-full overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-6 px-6 py-6">
              {/* Basic Information */}
              <div className="space-y-4 border-b pb-6">
                <Heading level={"h2"} className="text-lg font-semibold">
                  Basic Information
                </Heading>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Bundle Title</Label>
                    <Input
                      value={title}
                      onChange={handleTitleChange}
                      placeholder="e.g., Summer Outfit Bundle"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Handle (URL slug)
                    </Label>
                    <Input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="e.g., summer-outfit-bundle"
                      className="mt-1"
                    />
                    <p className="text-xs text-ui-fg-muted mt-1">
                      Used in URLs, auto-generated from title
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what customers can select from this bundle..."
                      className="mt-1 min-h-[80px]"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <div>
                      <Label className="text-sm font-medium">Active</Label>
                      <p className="text-xs text-ui-fg-muted">
                        Bundle will be available to customers
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Rules */}
              <div className="space-y-4 border-b pb-6">
                <Heading level={"h2"} className="text-lg font-semibold">
                  Selection Rules
                </Heading>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Selection Type
                    </Label>
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
                          Flexible (customers choose any combination)
                        </Select.Item>
                        <Select.Item value="required_all">
                          Required All (customers must select all items)
                        </Select.Item>
                      </Select.Content>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Minimum Items
                      </Label>
                      <Input
                        type="number"
                        value={minItems}
                        onChange={(e) =>
                          setMinItems(parseInt(e.target.value) || 1)
                        }
                        min={1}
                        className="mt-1"
                      />
                      <p className="text-xs text-ui-fg-muted mt-1">
                        Minimum items customer must select
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Maximum Items
                      </Label>
                      <Input
                        type="number"
                        value={maxItems || ""}
                        onChange={(e) =>
                          setMaxItems(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        placeholder="No limit"
                        className="mt-1"
                      />
                      <p className="text-xs text-ui-fg-muted mt-1">
                        Leave empty for no limit
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Settings */}
              <div className="space-y-4 border-b pb-6">
                <div className="flex items-center justify-between">
                  <Heading level={"h2"} className="text-lg font-semibold">
                    Bundle Discounts
                  </Heading>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={enableDiscounts}
                      onCheckedChange={setEnableDiscounts}
                    />
                    <Label className="text-sm">Enable Discounts</Label>
                  </div>
                </div>

                {enableDiscounts && (
                  <div className="space-y-4 p-4 bg-ui-bg-subtle rounded-lg">
                    <p className="text-sm text-ui-fg-muted">
                      Automatic percentage discounts based on number of items
                      selected
                    </p>

                    <div className="grid grid-cols-2 gap-4">
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
                        <p className="text-xs text-ui-fg-muted mt-1">
                          Discount when customer selects 2 items
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          3 Items Discount (%)
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
                        <p className="text-xs text-ui-fg-muted mt-1">
                          Discount when customer selects 3+ items
                        </p>
                      </div>
                    </div>

                    {/* Discount Preview */}
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm font-medium text-green-800 mb-1">
                        💰 Bundle Pricing Preview:
                      </p>
                      <div className="text-xs text-green-700 space-y-1">
                        <div>• 1 item = Regular price</div>
                        <div>• 2 items = {discount2Items}% off total</div>
                        <div>• 3+ items = {discount3Items}% off total</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bundle Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Heading level={"h2"} className="text-lg font-semibold">
                    Bundle Products ({items.length})
                  </Heading>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() =>
                      setItems([
                        ...items,
                        {
                          product_id: undefined,
                          quantity: 1,
                          is_optional: true,
                          sort_order: items.length,
                        },
                      ])
                    }
                  >
                    Add Product
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {items.map((item, index) => (
                    <FlexibleBundleItem
                      key={index}
                      item={item}
                      index={index}
                      setItems={setItems}
                      products={products}
                      fetchMoreProducts={fetchMoreProducts}
                      hasNextPage={hasNextPage}
                    />
                  ))}
                </div>

                {items.length === 0 && (
                  <div className="text-center py-8 text-ui-fg-muted">
                    <p>No products added yet</p>
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={() =>
                        setItems([
                          {
                            product_id: undefined,
                            quantity: 1,
                            is_optional: true,
                            sort_order: 0,
                          },
                        ])
                      }
                    >
                      Add First Product
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FocusModal.Body>

        <FocusModal.Footer className="border-t">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-ui-fg-muted">
              {items.filter((item) => item.product_id).length} products
              configured
            </div>
            <div className="flex items-center gap-x-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                isLoading={isCreating}
                disabled={
                  !title.trim() || items.every((item) => !item.product_id)
                }
              >
                Create Bundle
              </Button>
            </div>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};

type FlexibleBundleItemProps = {
  item: {
    product_id: string | undefined;
    quantity: number;
    is_optional: boolean;
    sort_order: number;
  };
  index: number;
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  products: HttpTypes.AdminProduct[] | undefined;
  fetchMoreProducts: () => void;
  hasNextPage: boolean;
};

const FlexibleBundleItem = ({
  item,
  index,
  setItems,
  products,
  fetchMoreProducts,
  hasNextPage,
}: FlexibleBundleItemProps) => {
  const observer = useRef(
    new IntersectionObserver(
      (entries) => {
        if (!hasNextPage) {
          return;
        }
        const first = entries[0];
        if (first.isIntersecting) {
          fetchMoreProducts();
        }
      },
      { threshold: 1 }
    )
  );

  const lastOptionRef = useCallback(
    (node: HTMLDivElement) => {
      if (!hasNextPage) {
        return;
      }
      if (observer.current) {
        observer.current.disconnect();
      }
      if (node) {
        observer.current.observe(node);
      }
    },
    [hasNextPage]
  );

  const selectedProduct = products?.find((p) => p.id === item.product_id);

  return (
    <div className="border border-ui-border-base rounded-lg p-4 space-y-4 bg-white">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-ui-bg-interactive text-white text-xs flex items-center justify-center font-medium">
            {index + 1}
          </div>
          <Heading level={"h3"} className="text-sm font-medium">
            Product {index + 1}
          </Heading>
          {selectedProduct && (
            <span className="text-xs text-ui-fg-muted">
              • {selectedProduct.title}
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={() =>
            setItems((items) => items.filter((_, i) => i !== index))
          }
          className="text-ui-fg-error hover:bg-ui-bg-error-light"
        >
          Remove
        </Button>
      </div>

      <div>
        <Label className="text-sm font-medium">Product *</Label>
        <Select
          value={item.product_id || ""}
          onValueChange={(value) =>
            setItems((items) =>
              items.map((item, i) => {
                return i === index ? { ...item, product_id: value } : item;
              })
            )
          }
        >
          <Select.Trigger className="mt-1">
            <Select.Value placeholder="Select Product" />
          </Select.Trigger>
          <Select.Content className="max-h-60">
            {products?.map((product, productIndex) => (
              <Select.Item
                key={product.id}
                value={product.id}
                ref={
                  productIndex === products.length - 1 ? lastOptionRef : null
                }
              >
                <div className="flex flex-col">
                  <span>{product.title}</span>
                  <span className="text-xs text-ui-fg-muted">
                    {product.variants?.length || 0} variants
                  </span>
                </div>
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Quantity</Label>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) =>
              setItems((items) =>
                items.map((item, i) => {
                  return i === index
                    ? { ...item, quantity: parseInt(e.target.value) || 1 }
                    : item;
                })
              )
            }
            min={1}
            className="mt-1"
          />
          <p className="text-xs text-ui-fg-muted mt-1">
            Default quantity for this product
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium">Options</Label>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={item.is_optional}
                onCheckedChange={(checked) =>
                  setItems((items) =>
                    items.map((item, i) => {
                      return i === index
                        ? { ...item, is_optional: checked }
                        : item;
                    })
                  )
                }
              />
              <Label className="text-sm">Optional</Label>
            </div>
          </div>
          <p className="text-xs text-ui-fg-muted mt-1">
            {item.is_optional
              ? "Customers can skip this product"
              : "Required for bundle completion"}
          </p>
        </div>
      </div>
    </div>
  );
};
