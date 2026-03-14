import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

const MOTIVATIONAL_QUOTES = [
  "DISCIPLINE Trumps motivation",
  "Success is not final, failure is not fatal: it is the courage to continue that counts",
  "The only way to do great work is to love what you do",
  "Your limitation—it's only your imagination",
  "Push yourself, because no one else is going to do it for you",
  "Great things never come from comfort zones",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it",
  "The harder you work for something, the greater you'll feel when you achieve it",
  "Don't stop when you're tired. Stop when you're done",
  "Wake up with determination. Go to bed with satisfaction",
  "Do something today that your future self will thank you for",
  "Little things make big days",
  "It's going to be hard, but hard does not mean impossible",
  "Don't wait for opportunity. Create it",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths",
  "The key to success is to focus on goals, not obstacles",
  "Dream bigger. Do bigger",
  "Don't tell people your plans. Show them your results",
  "Work hard in silence, let your success be the noise",
  "The struggle you're in today is developing the strength you need tomorrow",
  "Perseverance is not a long race; it is many short races one after the other",
  "Fall seven times, stand up eight",
  "It does not matter how slowly you go as long as you do not stop",
  "Mental toughness is not an option—it's a necessity for success",
];

export default function Index() {
  const router = useRouter();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => 
        (prevIndex + 1) % MOTIVATIONAL_QUOTES.length
      );
    }, 15000); // Change quote every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="heart" size={48} color="#6366f1" />
          <Text style={styles.title}>POLARPATH</Text>
          <Text style={styles.subtitle}>Track your journey to better mental health</Text>
        </View>

        <View style={styles.quoteSection}>
          <Ionicons name="trophy" size={24} color="#f59e0b" />
          <Text style={styles.quoteText}>"{MOTIVATIONAL_QUOTES[currentQuoteIndex]}"</Text>
        </View>

        <View style={styles.chatSection}>
          <TouchableOpacity 
            style={styles.chatCard}
            onPress={() => router.push("/chat")}
          >
            <View style={styles.chatHeader}>
              <Ionicons name="chatbubbles" size={28} color="#8b5cf6" />
              <Text style={styles.chatTitle}>What's happening?</Text>
            </View>
            <Text style={styles.chatSubtitle}>
              Talk to your AI companion about how you're feeling
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.moodsButton]}
            onPress={() => router.push("/moods")}
          >
            <Ionicons name="happy-outline" size={32} color="#fff" />
            <Text style={styles.buttonText}>MOODS</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.gratitudeButton]}
            onPress={() => router.push("/gratitude")}
          >
            <Ionicons name="journal-outline" size={32} color="#fff" />
            <Text style={styles.buttonText}>GRATITUDE JOURNAL</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.routineButton]}
            onPress={() => router.push("/routine")}
          >
            <Ionicons name="checkmark-circle-outline" size={32} color="#fff" />
            <Text style={styles.buttonText}>ROUTINE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
  },
  quoteSection: {
    width: "100%",
    backgroundColor: "#fff9ed",
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 100,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    textAlign: "center",
    lineHeight: 24,
    fontStyle: "italic",
  },
  chatSection: {
    width: "100%",
    marginVertical: 16,
  },
  chatCard: {
    backgroundColor: "#f8f9ff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8b5cf6",
  },
  chatSubtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  buttonsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  moodsButton: {
    backgroundColor: "#6366f1",
  },
  gratitudeButton: {
    backgroundColor: "#ec4899",
  },
  routineButton: {
    backgroundColor: "#10b981",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
