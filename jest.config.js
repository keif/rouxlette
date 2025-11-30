export default {
    preset: "jest-expo",
    verbose: true,

    globals: {
        __DEV__: true,
        'ts-jest': {
            diagnostics: true,
            tsconfig: {
                target: "ES2017",
                module: "commonjs",
            }
        }
    },

    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native|react-native.*|@react-navigation|expo(nent)?|@expo|expo-modules-core|expo-.*|@expo/.*|uuid))"
    ],

    moduleDirectories: ["node_modules", "<rootDir>"],

    moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],

    setupFilesAfterEnv: [
        "@testing-library/jest-native/extend-expect",
        "<rootDir>/__tests__/setup.js"
    ],

    moduleNameMapper: {
        "\\.(png|jpg|jpeg|gif|webp)$": "<rootDir>/__mocks__/fileMock.js",
        "\\.svg": "<rootDir>/__mocks__/svgMock.js",
        "^@env$": "<rootDir>/__tests__/mocks/mockEnv.js"
    },

};