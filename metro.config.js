// metro.config.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, realModuleName, platform) => {
  if (
    realModuleName === 'react-native/Libraries/Components/DatePicker/DatePickerIOS'
  ) {
    return {
      type: 'sourceFile',
      filePath: require('path').resolve(__dirname, 'shims/DatePickerIOS.js'),
    };
  }
  return context.resolveRequest(context, realModuleName, platform);
};

module.exports = config;