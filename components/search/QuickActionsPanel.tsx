import React, { useContext, useState } from 'react';
import { StyleSheet, Pressable, Text } from 'react-native';
import { View } from '../Themed';
import SearchInput from './SearchInput';
import LocationInput from './LocationInput';
import AppStyles from '../../AppStyles';
import { RootContext } from '../../context/RootContext';
import { setShowFilter } from '../../context/reducer';
import { Ionicons } from '@expo/vector-icons';

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
  const { dispatch } = useContext(RootContext);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  };

  const handleFilterPress = () => {
    dispatch(setShowFilter(true));
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchInput
            placeholder="What are you craving?"
            setErrorMessage={setErrorMessage}
            setResults={setResults || (() => {})}
            setTerm={handleSearchTermChange}
            term={searchTerm}
            onFocus={() => {}}
          />
        </View>
        <Pressable style={styles.filterButton} onPress={handleFilterPress}>
          <Ionicons 
            name="options" 
            size={24} 
            color={AppStyles.color.white} 
          />
        </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    marginRight: 12,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppStyles.color.roulette.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppStyles.color.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  locationContainer: {
    // Location input styling handled in LocationInput component
  },
});

export default QuickActionsPanel;