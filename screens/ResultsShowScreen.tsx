import React, { useEffect, useState } from "react";
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import yelp from "../api/yelp";
import { ResultsShowScreenProps } from "../types";
import { Result } from "../hooks/useResults";

const ResultsShowScreen = ({ navigation, route }: ResultsShowScreenProps<`ResultsShow`>) => {
  const [result, setResult] = useState<Result>(null);
  const { id } = route.params;

  const getResult = async (id: string) => {
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

  if (!result) {
    return null;
  }

  let resultArr = [];

  const generateElement = (key: string, value: string) => <Text><Text style={{fontWeight: `bold`}}>{`${key}:`}</Text>{`${value}`}</Text>
  const canPrint = [`string`, `boolean`, `number`];
  for (let key in result) {
    // @ts-ignore
    if (canPrint.indexOf(typeof result[key]) > -1) {
      // @ts-ignore
      resultArr.push(generateElement(key, result[key]));
    } else {
      // is object or array
      // @ts-ignore
      if (result[key].length) {
        // @ts-ignore
        result[key].forEach(value => generateElement(key, value))
      } else {
        // @ts-ignore
        for (let sKey in result[key]) {
          // @ts-ignore
          resultArr.push(generateElement(sKey, result[key][sKey]));
        }
      }

    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{result.name}</Text>
      <FlatList
        data={result.photos}
        horizontal
        keyExtractor={(photo) => photo}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={styles.image}
          />
        )}
      />
      <ScrollView style={styles.codeblock}>
        {resultArr}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: `bold`,
    marginBottom: 5,
    marginLeft: 15,
  },
  image: {
    height: 200,
    width: 300,
  },
  codeblock: {
    marginLeft: 10,
    marginRight: 10,
  },
});

export default ResultsShowScreen;
