import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Currency = "USD" | "GBP" | "EUR" | "BRL" | "RUB" | "ILS" | "RON";

const symbols: {
  [currency: string]: string[];
} = {
  BRL: ["R$", "BRL"],
  RON: ["lei", "LEI", "Lei", "RON"],
  USD: ["$", "US$", "US dollars", "USD"],
  GBP: ["£", "GBP"],
  EUR: ["€", "Euro", "EUR"],
  RUB: ["руб", "RUB"],
  ILS: ["₪", "ILS"],
  INR: ["Rs.", "Rs", "INR", "RS", "RS."],
  PHP: ["₱", "PHP", "PhP", "Php"],
  JPY: ["¥", "JPY", "円"],
  AUD: ["A$", "AU$", "AUD"],
  CAD: ["CA$", "C$", "CAD"],
};

export function parseCurrency(text: string) {
  //scan for currency
  const currenciesFound: { currency: Currency; index: number }[] = [];
  for (const currency of Object.keys(symbols) as Currency[]) {
    symbols[currency].find((symbol) => {
      const index = text.indexOf(symbol);
      if (index > -1) {
        //found symbol
        currenciesFound.push({ currency, index });
      }
    });
  }

  let index = 0;
  if (currenciesFound.length >= 1) {
    index = currenciesFound[0].index;
  }

  //search numbers near the currency
  const start = Math.max(0, index - 40);
  const end = index + 40;
  let slice = text.substr(start, end);

  //remove text
  slice = slice.replace(/[^\d|^\.|^,]/g, "");
  //remove any trailing dots and commas
  slice = slice.replace(/(,|\.)*$/, "");
  //remove any dot and comma from the front
  while (slice.charAt(0) === "." || slice.charAt(0) === ",") {
    slice = slice.substr(1);
  }

  if (!slice.length) return null;

  const dotCount = slice.split(".").length - 1;
  const commaCount = slice.split(",").length - 1;

  let amount = 0;
  if (dotCount === 0 && commaCount === 0) {
    //integer
  } else if (commaCount > 1 && dotCount <= 1) {
    //comma are delimiters
    //dot is decimal separator
    slice = slice.split(",").join("");
  } else if (dotCount > 1 && commaCount <= 1) {
    //comma are delimiters
    //dot is decimal separator
    slice = slice.split(".").join("");
    slice = slice.split(",").join(".");
  } else if (dotCount > 0 && commaCount > 0) {
    //check position
    if (slice.indexOf(".") > slice.indexOf(",")) {
      //215,254.23
      slice = slice.split(",").join("");
    } else {
      //215.2123,23
      slice = slice.split(".").join("");
      slice = slice.split(",").join(".");
    }
  } else if (dotCount === 1 && commaCount === 0) {
    //check groups
    //215.21 is 215.21
    //215.212 is 215222
    //215.1 is 215.1
    const segments = slice.split(".");
    const second = segments[1];
    if (second.length === 3) {
      //group separator
      slice = slice.replace(".", "");
    } else {
      //decimal separator
    }
  } else {
    // (commaCount === 1 && dotCount === 0)

    //check groups
    //215,21 is 215.21
    //215,212 is 215222
    //215,1 is 215.1
    const segments = slice.split(",");
    const second = segments[1];
    if (second.length === 3) {
      //group separator
      slice = slice.replace(",", "");
    } else {
      //decimal separator
      slice = slice.replace(",", ".");
    }
  }

  amount = parseFloat(slice);

  return amount;
}

export function getPercentageDecrease(oldNumber: number, newNumber: number) {
  const percentageDecrease = Math.round(
    ((newNumber - oldNumber) / oldNumber) * 100,
  );

  return percentageDecrease < 0 ? `${percentageDecrease}%` : undefined;
}

export function sum(numbers: number[]) {
  let result = 0;

  for (const number of numbers) {
    result += number;
  }

  return result;
}

export function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
