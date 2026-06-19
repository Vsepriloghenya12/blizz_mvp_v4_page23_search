import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from './theme';

type BackButtonProps = {
  onPress: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <Path
          d="M13 16L7 10L13 4"
          stroke={colors.textPrimary}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
