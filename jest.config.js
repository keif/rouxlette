// NOTE: `yarn test` runs Jest in watch mode (--watchAll) and never exits.
// For a one-shot / CI run use `yarn jest --watchAll=false` (add `--ci` on CI).
//
// The full parallel run occasionally prints "A worker process has failed to exit
// gracefully" once at the end. This is benign — `--detectOpenHandles` reports zero
// open handles, it never appears under `--runInBand`, and it vanishes when the
// suite is sharded. The cause is a short-lived UI timer (e.g. the error-message
// setTimeout in useLocation/HomeScreen) that is very occasionally still queued when
// a worker is torn down; it always fires and cleans up given a few more ms, which
// is why open-handle detection never catches it. Scheduling-dependent, not a leak.
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

    testPathIgnorePatterns: [
        "/node_modules/",
        "<rootDir>/__tests__/setup.js",
        "<rootDir>/__tests__/mocks/",
    ],

    moduleNameMapper: {
        "\\.(png|jpg|jpeg|gif|webp)$": "<rootDir>/__mocks__/fileMock.js",
        "\\.svg": "<rootDir>/__mocks__/svgMock.js",
        "^@env$": "<rootDir>/__tests__/mocks/mockEnv.js",
    },
};