import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from "react-native";

import { COLORS } from "../constants/theme";

export default function Loader() {
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },

  text: {
    marginTop: 10,
    color: COLORS.gray,
    fontWeight: "600",
  },
});
