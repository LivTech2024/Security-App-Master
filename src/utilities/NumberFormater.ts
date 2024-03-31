export const numberFormatter = (
  num: number,
  showCurrency = false,
  decimalCounts?: number
) => {
  if (decimalCounts === undefined) {
    decimalCounts = 2;
  }
  let currency = "$";

  let numberSystem = "en";

  let formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimalCounts,
    minimumFractionDigits: decimalCounts,
  });

  if (!numberSystem) {
    numberSystem = "indian";
  }
  if (numberSystem === "indian") {
    formatter = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: decimalCounts,
      maximumFractionDigits: decimalCounts,
    });
  }
  if (!currency) {
    currency = "$";
  }

  if (showCurrency) {
    const formattedNum = formatter.format(num);
    return num < 0
      ? `-${currency} ${formattedNum.slice(1)}`
      : `${currency} ${formattedNum}`;
  }

  return formatter.format(num);
};
