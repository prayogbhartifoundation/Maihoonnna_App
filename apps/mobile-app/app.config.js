export default ({ config }) => {
  return {
    ...config,

    plugins: [
      ...(config.plugins || []),
      "@react-native-community/datetimepicker",
      "expo-font",
    ],

    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || config.ios?.config?.googleMapsApiKey,
      },
    },

    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || config.android?.config?.googleMaps?.apiKey,
        },
      },
    },
  };
}; 
