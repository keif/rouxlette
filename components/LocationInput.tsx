import { Entypo } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import useLocation from "../hooks/useLocation";
import { Text } from "./Themed";

interface LocationInputProps {
  location: string;
  onLocationChange: (value: (((prevState: string) => string) | string)) => void;
  setCity: Dispatch<SetStateAction<string>>;
}

const LocationInput = ({ onLocationChange, location, setCity }: LocationInputProps) => {
  const [locationErrorMessage, city, locationResults, searchLocation] = useLocation();

  const handleEndEditing = async () => {
    await searchLocation(location);
    setCity(city);
  };

  return (
    <View>
      <View style={styles.view}>
        <Entypo
          name="location-pin"
          style={styles.icon}
        />
        <TextInput
          autoCapitalize={`none`}
          autoCorrect={false}
          onChangeText={onLocationChange}
          onEndEditing={handleEndEditing}
          placeholder={location ? location : `Current Location`}
          style={styles.input}
          value={location}
        />
      </View>
      {locationErrorMessage !== `` ? <Text>{`${locationErrorMessage}`}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  view: {
    backgroundColor: `#F0EEEE`,
    borderRadius: 5,
    flexDirection: `row`,
    height: 50,
    marginBottom: 10,
    marginHorizontal: 15,
    marginTop: 10,
  },
  icon: {
    alignSelf: `center`,
    color: `#87ceeb`,
    fontSize: 30,
    marginHorizontal: 15,
  },
  input: {
    color: `#87ceeb`,
    flex: 1,
    fontSize: 18,
  },
});

export default LocationInput;
