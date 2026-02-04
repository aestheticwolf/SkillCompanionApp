import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import Loader from "@/src/components/Loader";
import { COLORS } from "@/src/constants/theme";


export default function AppModal({
  visible,
  title,
  message,
  onClose,
}: any) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.msg}>{message}</Text>

          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  box: {
    backgroundColor: "white",
    padding: 25,
    width: "80%",
    borderRadius: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  msg: {
    color: COLORS.gray,
    marginBottom: 20,
  },

  btn: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "600",
  },
});
