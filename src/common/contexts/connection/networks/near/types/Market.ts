import { MarketOption } from "./MarketOption";

export type Market = Readonly<{
  base: MarketOption;
  fee: number;
  id: number;
  quote: MarketOption;
}>;
