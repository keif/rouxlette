import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../Themed';
import SearchInput from './SearchInput';
import LocationInput from './LocationInput';

interface QuickActionsPanelProps {
  onSearch?: (term: string) => void;
  setErrorMessage: (message: string) => void;
  setResults?: (results: any) => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ 
  onSearch, 
  setErrorMessage,
  setResults 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchInput
          placeholder="What are you craving?"
          setErrorMessage={setErrorMessage}
          setResults={setResults || (() => {})}
          setTerm={handleSearchTermChange}
          term={searchTerm}
          onFocus={() => {}}
        />
      </View>
      
      <View style={styles.locationContainer}>
        <LocationInput
          onFocus={() => {}}
          setErrorMessage={setErrorMessage}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 20,
  },
  searchContainer: {
    marginBottom: 12,
  },
  locationContainer: {
    // Location input styling handled in LocationInput component
  },
});

export default QuickActionsPanel;