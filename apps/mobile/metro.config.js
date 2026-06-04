// ============================================================
// Metro Config — NativeWind v4 + SVG support + Expo SDK 54
// ============================================================
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// SVG: remove da lista de assets e adiciona em sourceExts
const { transformer, resolver } = config
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
}
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
}

module.exports = withNativeWind(config, {
  input: './src/app/globals.css',
  inlineRem: 16,
})
