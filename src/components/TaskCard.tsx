import { Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  Layout,
} from "react-native-reanimated";

import { COLORS, SHADOW, SIZES } from "../constants/theme";

type Props = {
  title: string;
  completed: boolean;
  onPress: () => void;
};

export default function TaskCard({
  title,
  completed,
  onPress,
}: Props) {
  return (
    <Animated.View
      entering={FadeInRight}
      exiting={FadeOutLeft}
      layout={Layout.springify()}
      style={[
        styles.card,
        completed && styles.done,
      ]}
    >
      <Pressable onPress={onPress}>
        <Text
          style={[
            styles.text,
            completed && styles.doneText,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    ...SHADOW,
  },
  text: {
    fontSize: 16,
    color: COLORS.text,
  },
  done: {
    backgroundColor: "#E0F2FE",
  },
  doneText: {
    textDecorationLine: "line-through",
    color: COLORS.gray,
  },
});
