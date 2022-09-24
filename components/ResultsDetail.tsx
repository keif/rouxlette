import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const ResultsDetail = ({ result }) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: result.image_url }}
        style={styles.image}
      />
      <Text
        style={styles.name}
      >{result.name}</Text>
      <Text style={styles.name}>{result.rating} Stars, {result.review_count} Reviews</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 15,
  },
  image: {
    borderRadius: 10,
    height: 120,
    marginBottom: 5,
    width: 250,
  },
  name: {
    color: `#fff`,
    fontWeight: `bold`,
  },
});

export default ResultsDetail;
