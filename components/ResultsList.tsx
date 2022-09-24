import { FlatList, StyleSheet, TouchableOpacity } from "react-native";

import ResultsDetail from "./ResultsDetail";
import { useNavigation, useNavigationContainerRef } from "@react-navigation/native";
import { Text, View } from "../components/Themed";

const ResultsList = ({ results, title }) => {
  const navigation = useNavigation();
  if (!results.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}, {results.length} results</Text>
      <FlatList
        data={results}
        horizontal
        keyExtractor={(result) => result.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate(`ResultsShow`, {
                id: item.id,
              })
            }}
          >
            <ResultsDetail result={item} />
          </TouchableOpacity>
        )
        }
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: `bold`,
    marginBottom: 5,
    marginLeft: 15,
  },
});

export default ResultsList;
