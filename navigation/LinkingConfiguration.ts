/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { RootStackParamList } from '../types';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Root: {
        screens: {
          Search: {
            screens: {
              SearchScreen: 'search',
            },
          },
          ResultsShow: {
            screens: {
              ResultsShowScreen: 'results:id',
            },
            parse: {
              id: String,
            },
          },
        },
      },
      Modal: {
        screens: {
          ModalScreen: 'modal',
        },
        parse: {
          id: String,
          name: String,
        }
      },
      NotFound: '*',
    },
  },
};

export default linking;
