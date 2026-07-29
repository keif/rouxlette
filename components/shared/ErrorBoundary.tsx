import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { supperClub } from '../../theme/supperClub';
import { logSafe } from '../../utils/log';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Root error boundary. Without it, an uncaught render/lifecycle error in a
 * release build silently closes the app (no red screen, no report). This keeps
 * the app alive and surfaces the error so a crash can actually be diagnosed —
 * catch it, show it, offer a way back.
 *
 * Note: React error boundaries only catch errors thrown during render /
 * lifecycle / child hooks — NOT inside async callbacks or event handlers.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logSafe('[ErrorBoundary] caught render error', {
      message: error?.message,
      stack: error?.stack,
      componentStack: info?.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <View style={styles.container} testID="error-boundary">
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          The screen hit an unexpected error. Details below — please share them so we can fix it.
        </Text>
        <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContent}>
          <Text style={styles.detailText}>{error.message || String(error)}</Text>
          {!!error.stack && <Text style={styles.stackText}>{error.stack}</Text>}
        </ScrollView>
        <Pressable style={styles.button} onPress={this.handleReset} accessibilityRole="button">
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: supperClub.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Georgia',
    color: supperClub.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: supperClub.textMuted,
    marginBottom: 16,
  },
  detailScroll: {
    maxHeight: 260,
    backgroundColor: supperClub.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: supperClub.borderSoft,
  },
  detailContent: { padding: 12 },
  detailText: {
    fontSize: 13,
    color: supperClub.error,
    marginBottom: 8,
  },
  stackText: {
    fontSize: 11,
    color: supperClub.textMuted,
    fontFamily: 'Courier',
  },
  button: {
    marginTop: 20,
    backgroundColor: supperClub.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
