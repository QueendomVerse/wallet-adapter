// borrowed from https://github.com/near/near-api-js/blob/7f16b10ece3c900aebcedf6ebc660cc9e604a242/packages/near-api-js/src/utils/format.ts
export const cleanupAmount = (amount: string): string => {
  return amount.replace(/,/g, "").trim();
};

export const trimLeadingZeroes = (value: string): string => {
  value = value.replace(/^0+/, "");
  if (value === "") {
    return "0";
  }
  return value;
};

export const parseInputAmount = (amount: string): string => {
  return trimLeadingZeroes(cleanupAmount(amount));
};
