import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import { COLORS } from "@/src/constants/theme";

export default function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../assets/loader.json")}
        autoPlay
        loop
        style={styles.animation}
      />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 25,
  },

  animation: {
    width: 120,
    height: 120,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 5,
  },

  sub: {
    color: COLORS.gray,
    marginTop: 4,
  },
});
