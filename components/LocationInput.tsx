import { Entypo } from '@expo/vector-icons';
import React from "react"
import { StyleSheet, TextInput, View } from "react-native"

const LocationInput = ({ onLocationChange, onLocationSubmit, location }) => (
    <View style={ styles.view }>
        <Entypo
            name="location-pin"
            style={ styles.icon }
        />
        <TextInput
            autoCapitalize={ `none` }
            autoCorrect={ false }
            onChangeText={ onLocationChange }
            onEndEditing={ onLocationSubmit }
            placeholder={ location ? location : `Enter your location` }
            style={ styles.input }
            value={ location }
        />
    </View>
)

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
    }
})

export default LocationInput
