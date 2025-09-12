import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function truncateToDecimals(value: number, decimals = 2) {
  let truncatedValue = value;

  if (Math.abs(value) < 1.0) {
    const normalizedValue = Number.parseInt(
      value.toString().split("e-")[1],
      10,
    );

    if (normalizedValue) {
      truncatedValue *= 10 ** (normalizedValue - 1);

      truncatedValue = Number(
        `0.${(new Array(normalizedValue)).join("0")}${value.toString().substring(2)}`,
      );
    }
  } else {
    let normalizedValue = Number.parseInt(value.toString().split("+")[1], 10);

    if (normalizedValue > 20) {
      normalizedValue -= 20;

      truncatedValue /= 10 ** normalizedValue;

      truncatedValue += Number(new Array(normalizedValue + 1).join("0"));
    }
  }

  return Number(truncatedValue.toString().substring(0, decimals + 2));
}

function FloatBarSection({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("absolute inset-0", className)} {...props} />;
}

export function FloatBar({
  float,
  decimals = 3,
  className,
}: {
  float: number;
  decimals?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mr-2">{truncateToDecimals(float, decimals)}</div>
        </TooltipTrigger>
        <TooltipContent>{float}</TooltipContent>
      </Tooltip>

      <div className="flex-1 h-2 relative">
        <div className="flex rounded-sm overflow-hidden">
          <FloatBarSection className="w-full bg-[#E05A59]" />
          <FloatBarSection className="w-[45%] bg-[#E9A75D]" />
          <FloatBarSection className="w-[38%] bg-[#E3E15B]" />
          <FloatBarSection className="w-[15%] bg-[#79D154]" />
          <FloatBarSection className="w-[7%] bg-[#5EB648]" />
        </div>
        <div
          className="absolute"
          style={{
            left: `${float * 100}%`,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlSpace="preserve"
            viewBox="0 0 8.5 5.6"
            className="absolute top-1 -left-2 w-3.5 h-2 fill-white stroke-[0.6px] stroke-[#2B2F30]"
          >
            <path d="m4.2.3-4 5h8l-4-5z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
