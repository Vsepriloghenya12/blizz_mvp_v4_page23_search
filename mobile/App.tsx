import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppRoot } from './src/core/AppRoot';
import { colors } from './src/shared/ui/theme';

type ErrorBoundaryState = {
  errorMessage: string | null;
};

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { errorMessage: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { errorMessage: error.message };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.title}>Близз</Text>
            <Text style={styles.errorTitle}>Приложение не смогло открыться</Text>
            <Text style={styles.errorText}>{this.state.errorMessage}</Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoot />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16
  },
  title: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '800'
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10
  }
});
