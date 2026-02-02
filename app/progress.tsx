import { View, Text, StyleSheet } from "react-native";

export default function Progress() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>
      <Text>Completed: 0</Text>
      <Text>Pending: 0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    marginBottom: 15,
  },
});
