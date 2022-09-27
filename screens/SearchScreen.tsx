import React, { useEffect, useState } from "react";
import { Result } from "../hooks/useResults";
import { StyleSheet } from "react-native";
import { View } from "../components/Themed";
import SearchInput from "../components/SearchInput";
import LocationInput from "../components/LocationInput";
import FilteredOutput from "../components/FilteredOutput";

const SearchScreen = () => {
  const [term, setTerm] = useState<string>(``);
  const [filterTerm, setFilterTerm] = useState<string>(``);
  const [location, setLocation] = useState<string>(``);
  const [searchResults, setSearchResults] = useState<Array<Result>>([]);
  const [filterResults, setFilterResults] = useState<Array<Result>>([]);
  const [city, setCity] = useState<string>(``);

  useEffect(() => {
    setLocation(city);
  }, [city]);

  return (
    <View style={styles.container}>
      <SearchInput
        icon={`search`}
        location={location}
        onTermChange={setTerm}
        placeholder={`What are you craving?`}
        setResults={setSearchResults}
        term={term}
      />
      <SearchInput
        icon={`filter`}
        location={location}
        onTermChange={setFilterTerm}
        placeholder={`…but you don't want?`}
        setResults={setFilterResults}
        term={filterTerm}
      />
      <LocationInput
        location={location}
        onLocationChange={setLocation}
        setCity={setCity}
      />
      <FilteredOutput term={term} filterTerm={filterTerm} searchResults={searchResults}
                      filteredResults={filterResults} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SearchScreen;
