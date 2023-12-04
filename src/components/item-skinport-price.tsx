import { formatPrice } from "@/lib/format";
import { getI18nMessage } from "@/lib/i18n";
import { Discount } from "./discount";

export function ItemSkinportPrice({
  price,
  currency,
  discount,
}: { price: number; currency: string; discount?: string }) {
  return (
    <div>
      <div>{getI18nMessage("common_startingAt")}</div>
      <div className="flex gap-2 items-center">
        <div className="text-3xl font-semibold text-white">
          {formatPrice(price, currency)}
        </div>
        {discount && <Discount discount={discount} />}
      </div>
    </div>
  );
}
