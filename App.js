import React, { useEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useKeepAwake } from 'expo-keep-awake';
import { gameHtml } from './src/gameHtml';

export default function App() {
  useKeepAwake(); // don't let the screen lock mid-game

  useEffect(() => () => Speech.stop(), []);

  const onMessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }

    if (msg.type === 'speak') {
      if (msg.interrupt) Speech.stop();
      Speech.speak(msg.text, { rate: 1.05 });
    }

    if (msg.type === 'haptic') {
      switch (msg.style) {
        case 'heavy': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
        case 'light': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
        case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
        case 'error': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <WebView
        source={{ html: gameHtml }}
        originWhitelist={['*']}
        onMessage={onMessage}
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
});
