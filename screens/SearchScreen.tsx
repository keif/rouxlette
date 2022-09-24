import { useEffect, useState } from "react";
import useResults from "../hooks/useResults";
import useLocation from "../hooks/useLocation";
import { ScrollView, StyleSheet } from "react-native";
import { Text, View } from "../components/Themed";
import ResultsList from "../components/ResultsList";
import SearchBar from "../components/SearchBar";

function LocationInput(props: { onLocationChange: (value: (((prevState: string) => string) | string)) => void, location: string, onLocationSubmit: () => Promise<void> }) {
  return null;
}

const SearchScreen = (props) => {
  const [term, setTerm] = useState(``);
  const [location, setLocation] = useState(``);
  const [errorMessage, results, searchApi] = useResults();
  const [locationErrorMessage, city, locationResults, searchLocation] = useLocation();

  const filterResultsByPrice = (price) => results.filter(result => result.price === price);

  const titles = {
    "$": `Cost Effective`,
    "$$": `Bit Pricier`,
    "$$$": `Big Spender`,
    "$$$$": `Richie Rich Spender`,
  };

  useEffect(() => {
    setLocation(city);
  }, []);

  return (
    <View style={styles.container}>
      <SearchBar
        location={location}
        onTermChange={setTerm}
        onTermSubmit={(term, location) => searchApi(term, location)}
        term={term}
      />
      <LocationInput
        onLocationChange={setLocation}
        onLocationSubmit={() => searchLocation(location)}
        location={location}
      />
      {errorMessage !== `` ? <Text>{errorMessage}</Text> : null}
      {locationErrorMessage !== `` ? <Text>{locationErrorMessage}</Text> : null}
      <ScrollView>
        {
          [`$`, `$$`, `$$$`, `$$$$`].map(pricePoint => <ResultsList
            key={pricePoint}
            results={filterResultsByPrice(pricePoint)}
            title={titles[pricePoint]}
          />)
        }
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SearchScreen;
