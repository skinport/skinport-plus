import { InterpolateMessage } from "@/components/interpolate-message";
import { SkinportPlusLogo } from "@/components/skinport-plus-logo";
import { getI18nMessage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PricingBySkinportPlus({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-1 text-xs items-baseline", className)}>
      <InterpolateMessage
        message={getI18nMessage("common_pricingBySkinportPlus")}
        values={{
          skinportPlusLogo: <SkinportPlusLogo className="h-4 w-auto" />,
        }}
      />
    </div>
  );
}
