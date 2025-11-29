import React from 'react';
import renderer from 'react-test-renderer';

// Mock TurboModuleRegistry before anything else
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  return {
    getEnforcing: jest.fn((name) => {
      const modules: { [key: string]: any } = {
        SettingsManager: {
          getConstants: jest.fn(() => ({})),
          get: jest.fn(),
          set: jest.fn(),
        },
        PlatformConstants: {
          getConstants: jest.fn(() => ({
            isTesting: true,
            reactNativeVersion: { major: 0, minor: 70, patch: 8 },
          })),
        },
        DeviceInfo: {
          getConstants: jest.fn(() => ({})),
        },
      };
      return modules[name] || {};
    }),
    get: jest.fn(),
  };
});

// Mock dependencies that require native modules
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-location');
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'expo://'),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-geocoding');
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));
jest.mock('react-native-gesture-handler', () => {
  const mockReact = require('react');
  const View = mockReact.forwardRef((props: any, ref: any) => mockReact.createElement('View', { ...props, ref }));
  
  return {
    // Gesture handlers
    PanGestureHandler: View,
    TapGestureHandler: View,
    LongPressGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    FlingGestureHandler: View,

    // Touchables
    TouchableOpacity: View,
    TouchableHighlight: View,
    TouchableWithoutFeedback: View,
    
    // Gesture state
    State: {
      UNDETERMINED: 0,
      FAILED: 1,
      BEGAN: 2,
      CANCELLED: 3,
      ACTIVE: 4,
      END: 5,
    },

    // Directions
    Directions: {
      RIGHT: 1,
      LEFT: 2,
      UP: 4,
      DOWN: 8,
    },

    // Containers
    GestureHandlerRootView: View,
  };
});
jest.mock('react-native-reanimated');
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => React.createElement('SafeAreaView', null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 375, height: 812 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    },
  };
});

// Mock react-native dimensions module before main mock
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  set: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock react-native modules that might cause DatePickerIOS issues
jest.mock('react-native', () => {
  const mockReact = require('react');
  const mockComponent = (name: string) => {
    const Component = ({ children, ...props }: any) => mockReact.createElement(name, props, children);
    Component.displayName = name;
    return Component;
  };

  const mockDimensions = {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    set: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  
  return {
    // Core components
    ActivityIndicator: mockComponent('ActivityIndicator'),
    Button: mockComponent('Button'),
    FlatList: mockComponent('FlatList'),
    Image: mockComponent('Image'),
    ImageBackground: mockComponent('ImageBackground'),
    KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
    Modal: mockComponent('Modal'),
    Pressable: mockComponent('Pressable'),
    RefreshControl: mockComponent('RefreshControl'),
    SafeAreaView: mockComponent('SafeAreaView'),
    ScrollView: mockComponent('ScrollView'),
    SectionList: mockComponent('SectionList'),
    StatusBar: mockComponent('StatusBar'),
    Switch: mockComponent('Switch'),
    Text: mockComponent('Text'),
    TextInput: mockComponent('TextInput'),
    TouchableHighlight: mockComponent('TouchableHighlight'),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    TouchableWithoutFeedback: mockComponent('TouchableWithoutFeedback'),
    View: mockComponent('View'),
    VirtualizedList: mockComponent('VirtualizedList'),

    // iOS specific components
    DatePickerIOS: mockComponent('DatePickerIOS'),
    ActionSheetIOS: {},

    // Platform utilities
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
    Dimensions: mockDimensions,
    PixelRatio: {
      get: jest.fn(() => 2),
      getFontScale: jest.fn(() => 1),
      getPixelSizeForLayoutSize: jest.fn((layoutSize) => layoutSize * 2),
      roundToNearestPixel: jest.fn((layoutSize) => layoutSize),
    },

    // App utilities
    AppRegistry: {
      registerComponent: jest.fn(),
      runApplication: jest.fn(),
      unmountApplicationComponentAtRootTag: jest.fn(),
      registerRunnable: jest.fn(),
      registerConfig: jest.fn(),
      setWrapperComponentProvider: jest.fn(),
    },
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(() => Promise.resolve()),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      getInitialURL: jest.fn(() => Promise.resolve(null)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },

    // Style utilities
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((style) => style),
      absoluteFill: {},
      absoluteFillObject: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },

    // Permissions
    PermissionsAndroid: {
      PERMISSIONS: {},
      request: jest.fn(() => Promise.resolve('granted')),
      check: jest.fn(() => Promise.resolve('granted')),
      requestMultiple: jest.fn(() => Promise.resolve({})),
    },

    // Settings
    Settings: {
      get: jest.fn(),
      set: jest.fn(),
      watchKeys: jest.fn(),
      clearWatch: jest.fn(),
    },

    // Native modules
    NativeModules: {
      SettingsManager: {
        getConstants: jest.fn(() => ({})),
        get: jest.fn(),
        set: jest.fn(),
      },
      RNGestureHandlerModule: {
        attachGestureHandler: jest.fn(),
        createGestureHandler: jest.fn(),
        dropGestureHandler: jest.fn(),
        updateGestureHandler: jest.fn(),
        getConstants: jest.fn(() => ({
          State: { BEGAN: 2, ACTIVE: 4, END: 5 },
          Direction: { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 },
        })),
      },
      ViewManagerResolver: {
        getViewManagerConfig: jest.fn(() => ({})),
      },
      EXNativeModulesProxy: {
        getConstants: jest.fn(() => ({})),
        addProxiedListener: jest.fn(),
        removeProxiedListener: jest.fn(),
        removeProxiedListeners: jest.fn(),
      },
      RNCAsyncStorage: {
        getItem: jest.fn(() => Promise.resolve(null)),
        setItem: jest.fn(() => Promise.resolve()),
        removeItem: jest.fn(() => Promise.resolve()),
        clear: jest.fn(() => Promise.resolve()),
        getAllKeys: jest.fn(() => Promise.resolve([])),
        multiGet: jest.fn(() => Promise.resolve([])),
        multiSet: jest.fn(() => Promise.resolve()),
        multiRemove: jest.fn(() => Promise.resolve()),
      },
    },

    // TurboModule registry
    TurboModuleRegistry: {
      getEnforcing: jest.fn((name) => {
        const modules: { [key: string]: any } = {
          SettingsManager: {
            getConstants: jest.fn(() => ({})),
            get: jest.fn(),
            set: jest.fn(),
          },
        };
        return modules[name] || {};
      }),
    },
  };
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('@react-navigation/material-top-tabs', () => ({
  createMaterialTopTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    manifest: {},
    platform: {},
  },
}));

// Note: @env is mocked via setupTests or Jest config if needed

// Import App after all mocks are set up
import App from '../App';

describe('App Boot Test', () => {
  beforeEach(() => {
    // Suppress console warnings during tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock useCachedResources to return loaded immediately
    jest.doMock('../hooks/useCachedResources', () => ({
      __esModule: true,
      default: () => true, // Always return loaded
    }));

    // Mock useColorScheme
    jest.doMock('../hooks/useColorScheme', () => ({
      __esModule: true,
      default: () => 'light',
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render App component without crashing', () => {
    expect(() => {
      renderer.create(<App />);
    }).not.toThrow();
  });

  it('should render App component and match snapshot', () => {
    const tree = renderer.create(<App />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('should not throw DatePickerIOS related errors', () => {
    // This test specifically checks that we can import and render 
    // without the "None of these files exist: DatePickerIOS" error
    let renderError: Error | null = null;
    
    try {
      renderer.create(<App />);
    } catch (error) {
      renderError = error as Error;
    }

    expect(renderError).toBeNull();
    if (renderError) {
      expect(renderError.message).not.toMatch(/DatePicker/i);
      expect(renderError.message).not.toMatch(/None of these files exist/i);
    }
  });
});