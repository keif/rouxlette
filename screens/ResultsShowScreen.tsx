import React, { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import yelp from "../api/yelp";

const ResultsShowScreen = ({ navigation, route }) => {
  const [result, setResult] = useState(null);
  const { id } = route.params;

  const getResult = async (id) => {
    try {
      const response = await yelp.get(`/${id}`);
      setResult(response.data);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    getResult(id);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('gestureStart', (e) => {
      // Do something
    });

    return unsubscribe;

  }, []);

  if (!result) {
    return null;
  }

  return (
    <View>
      <Text>{result.name}</Text>
      <FlatList
        data={result.photos}
        keyExtractor={(photo) => photo}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={styles.image}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    height: 200,
    width: 300,
  },
});

export default ResultsShowScreen;
