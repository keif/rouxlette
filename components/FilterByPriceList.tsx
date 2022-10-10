import { ScrollView } from "react-native";
import { Text } from "./Themed";
import ResultsList from "./results/ResultsList";
import React from "react";
import { Result } from "../hooks/useResults";

interface FilterByPriceListProps {
  searchResults: Array<Result>;
}

const FilterByPriceList = ({ searchResults }: FilterByPriceListProps) => {
  const titles: { [key: string]: string } = {
    "$": `Cost Effective`,
    "$$": `Bit Pricier`,
    "$$$": `Big Spender`,
    "$$$$": `Richie Rich Spender`,
  };

  const filterResultsByPrice = (price: string, results: Array<Result>) => results.filter(result => result.price === price);

  return (
    <ScrollView>
      <Text>Search Results</Text>
      {
        [`$`, `$$`, `$$$`, `$$$$`].map(pricePoint => <ResultsList
          key={pricePoint}
          results={filterResultsByPrice(pricePoint, searchResults)}
          title={titles[pricePoint]}
        />)
      }
    </ScrollView>
  );
};

export default FilterByPriceList;
