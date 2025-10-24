type SelectedItemWithPrice = {
  variant_id: string;
  quantity: number;
  unitPrice: number; // in cents
};

export const applyDiscount = (
  items: SelectedItemWithPrice[],
  totalDiscount: number // in cents
): SelectedItemWithPrice[] => {
  const totalPrice = items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0
  );

  if (totalPrice === 0 || totalDiscount <= 0) return items;

  // 1️⃣ Compute ideal proportional discount for each item
  const proportional = items.map((item, index) => {
    const itemTotal = item.unitPrice * item.quantity;
    const exact = (itemTotal * totalDiscount) / totalPrice;
    const floored = Math.floor(exact);
    const remainder = exact - floored;
    return { ...item, index, floored, remainder };
  });

  // 2️⃣ Compute remaining cents to distribute
  let remaining =
    totalDiscount - proportional.reduce((s, i) => s + i.floored, 0);

  // 3️⃣ Sort by remainder (desc) with stable tiebreaker
  proportional.sort((a, b) =>
    b.remainder === a.remainder ? a.index - b.index : b.remainder - a.remainder
  );

  // 4️⃣ Distribute remaining cents
  for (let i = 0; i < proportional.length && remaining > 0; i++) {
    proportional[i].floored += 1;
    remaining--;
  }

  // 5️⃣ Restore original order
  proportional.sort((a, b) => a.index - b.index);

  // 6️⃣ Apply exact per-item discount
  const discounted = proportional.map((item) => {
    const itemDiscount = item.floored;
    const newTotal = item.unitPrice * item.quantity - itemDiscount;
    const newUnitPrice = Math.round(newTotal / item.quantity);
    return { ...item, unitPrice: newUnitPrice };
  });

  // 7️⃣ Adjustment step (if rounding causes 1-cent drift)
  const before = totalPrice;
  let after = discounted.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  let diff = before - after;

  if (diff !== totalDiscount) {
    const delta = totalDiscount - diff; // usually ±1
    // Adjust the item with the largest quantity or first item
    discounted[0].unitPrice = Math.max(
      discounted[0].unitPrice - delta / discounted[0].quantity,
      0
    );
    after = discounted.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    diff = before - after;
  }

  return discounted;
};
