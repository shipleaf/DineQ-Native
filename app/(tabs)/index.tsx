import React, { useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import {
  View,
  StyleSheet,
  Animated,
  BackHandler,
  Platform,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";

interface NavState {
  url: string;
  canGoBack: boolean;
}

export default function MyWebPage() {
  const [navState, setNavState] = useState<NavState>({
    url: "",
    canGoBack: false,
  });
  const [showExitToast, setShowExitToast] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const webViewRef = useRef<WebView>(null);
  const backPressRef = useRef<number>(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const showToast = () => {
    setShowExitToast(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowExitToast(false));
      }, 1500);
    });
  };

  // const handleWebMessage = async (event: any) => {
  //   try {
  //     const message = JSON.parse(event.nativeEvent.data);
  //     if (message.type === "playSound") {
  //       const { sound } = await Audio.Sound.createAsync(
  //         require("../../assets/mp3/notification_long.mp3")
  //       );
  //       soundRef.current = sound;
  //       await sound.setVolumeAsync(1.0);
  //       await sound.playAsync();
  //     }
  //   } catch (e) {
  //     console.error("메시지 처리 오류:", e);
  //   }
  // };

  const handleWebMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "playSound") {
        // ✅ 이전 사운드가 있으면 정지 후 언로드
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        // 새 사운드 로드 및 재생
        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/mp3/notification_long.mp3")
        );
        soundRef.current = sound;
        await sound.setVolumeAsync(1.0);
        await sound.playAsync();
      }
    } catch (e) {
      console.error("메시지 처리 오류:", e);
    }
  };

  useEffect(() => {
    const handleBackPress = () => {
      const isRootPage =
        navState.url === "https://dine-q-fe.vercel.app/manage" ||
        navState.url === "https://dine-q-fe.vercel.app/manage/login";

      if (navState.canGoBack && !isRootPage) {
        webViewRef.current?.goBack();
      } else {
        const now = Date.now();
        if (backPressRef.current && now - backPressRef.current < 1500) {
          BackHandler.exitApp();
        } else {
          backPressRef.current = now;
          if (Platform.OS === "android") {
            showToast(); // ✅ 조건 만족 시 토스트 표시
          }
        }
      }

      return true;
    };

    BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
    };
  }, [navState]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        // source={{ uri: "https://dine-q-fe.vercel.app/manage" }}
        source={{ uri: "http://192.168.45.244:3000/manage" }}
        style={styles.webview}
        onNavigationStateChange={(navState) => setNavState(navState)}
        onMessage={handleWebMessage}
      />
      {showExitToast && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>
            한번 더 클릭하면 앱이 종료됩니다.
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  toast: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
  },
});
