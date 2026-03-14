import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LineChart } from "react-native-gifted-charts";

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const MOOD_OPTIONS = [
  { label: "Manic", color: "#dc2626" },
  { label: "Hypomanic", color: "#ea580c" },
  { label: "Very Happy", color: "#f59e0b" },
  { label: "Pleasant", color: "#fbbf24" },
  { label: "Normal", color: "#10b981" },
  { label: "Sad", color: "#3b82f6" },
  { label: "Depressed", color: "#6366f1" },
  { label: "Extremely Depressed", color: "#7c3aed" },
  { label: "Extremely Suicidal", color: "#991b1b" },
];

const MANIA_SYMPTOMS = [
  { key: "racing_thoughts", label: "Racing Thoughts" },
  { key: "no_sleep", label: "No Need of Sleep" },
  { key: "over_interest", label: "Overly Interested in Things" },
  { key: "lack_control", label: "Lack of Physical Control" },
  { key: "anxiety", label: "Anxiety" },
  { key: "ordering", label: "Ordering" },
  { key: "over_planning", label: "Over Planning" },
];

const DEPRESSION_SYMPTOMS = [
  { key: "self_harm", label: "Self Harm" },
  { key: "angry", label: "Angry" },
  { key: "depressed_anxiety", label: "Anxious" },
];

interface MoodEntry {
  id: string;
  mood: string;
  date: string;
  racing_thoughts: boolean;
  no_sleep: boolean;
  over_interest: boolean;
  lack_control: boolean;
  anxiety: boolean;
  ordering: boolean;
  over_planning: boolean;
  self_harm: boolean;
  angry: boolean;
  depressed_anxiety: boolean;
}

export default function Moods() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentMoodId, setCurrentMoodId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<{[key: string]: boolean}>({});
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingSymptoms, setSavingSymptoms] = useState(false);

  useEffect(() => {
    fetchMoodHistory();
  }, []);

  const fetchMoodHistory = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/moods?user=default_user`);
      if (response.ok) {
        const data = await response.json();
        setMoodHistory(data);
      }
    } catch (error) {
      console.error("Error fetching mood history:", error);
    }
  };

  const handleMoodSelect = async (mood: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/moods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, user: "default_user" }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedMood(mood);
        setCurrentMoodId(data.id);
        setSymptoms({});
        fetchMoodHistory();
      }
    } catch (error) {
      console.error("Error creating mood entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSymptoms = async () => {
    if (!currentMoodId) return;
    
    setSavingSymptoms(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/moods/${currentMoodId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(symptoms),
      });

      if (response.ok) {
        setSelectedMood(null);
        setCurrentMoodId(null);
        setSymptoms({});
        fetchMoodHistory();
      }
    } catch (error) {
      console.error("Error saving symptoms:", error);
    } finally {
      setSavingSymptoms(false);
    }
  };

  const toggleSymptom = (key: string) => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showManiaSymptoms = selectedMood && ["Very Happy", "Hypomanic", "Manic"].includes(selectedMood);
  const showDepressionSymptoms = selectedMood && ["Depressed", "Extremely Depressed"].includes(selectedMood);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMoodValue = (mood: string): number => {
    const moodMap: {[key: string]: number} = {
      "Extremely Suicidal": 1,
      "Extremely Depressed": 2,
      "Depressed": 3,
      "Sad": 4,
      "Normal": 5,
      "Pleasant": 6,
      "Very Happy": 7,
      "Hypomanic": 8,
      "Manic": 9,
    };
    return moodMap[mood] || 5;
  };

  const getMoodColor = (value: number): string => {
    if (value <= 2) return "#991b1b";
    if (value <= 4) return "#3b82f6";
    if (value === 5) return "#10b981";
    if (value <= 6) return "#fbbf24";
    if (value <= 7) return "#f59e0b";
    return "#dc2626";
  };

  const prepareChartData = () => {
    if (moodHistory.length === 0) return [];
    
    // Group moods by date (YYYY-MM-DD)
    const moodsByDate: {[key: string]: number[]} = {};
    
    moodHistory.forEach(entry => {
      const dateKey = new Date(entry.date).toLocaleDateString();
      const moodValue = getMoodValue(entry.mood);
      
      if (!moodsByDate[dateKey]) {
        moodsByDate[dateKey] = [];
      }
      moodsByDate[dateKey].push(moodValue);
    });
    
    // Calculate average for each day and prepare chart data
    const chartData = Object.entries(moodsByDate)
      .slice(0, 10)
      .reverse()
      .map(([dateKey, values]) => {
        const avgValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        const date = new Date(dateKey);
        return {
          value: avgValue,
          label: date.getDate().toString(),
          dataPointColor: getMoodColor(avgValue),
          dataPointRadius: 5,
        };
      });
    
    return chartData;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Mood Tracking</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.label}
                style={[styles.moodButton, { backgroundColor: mood.color }]}
                onPress={() => handleMoodSelect(mood.label)}
                disabled={loading}
              >
                <Text style={styles.moodButtonText}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}

        {showManiaSymptoms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mania Symptoms</Text>
            <View style={styles.symptomsContainer}>
              {MANIA_SYMPTOMS.map((symptom) => (
                <TouchableOpacity
                  key={symptom.key}
                  style={styles.checkboxRow}
                  onPress={() => toggleSymptom(symptom.key)}
                >
                  <Ionicons
                    name={symptoms[symptom.key] ? "checkbox" : "square-outline"}
                    size={24}
                    color="#6366f1"
                  />
                  <Text style={styles.checkboxLabel}>{symptom.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveSymptoms}
                disabled={savingSymptoms}
              >
                {savingSymptoms ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Symptoms</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showDepressionSymptoms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Depression Symptoms</Text>
            <View style={styles.symptomsContainer}>
              {DEPRESSION_SYMPTOMS.map((symptom) => (
                <TouchableOpacity
                  key={symptom.key}
                  style={styles.checkboxRow}
                  onPress={() => toggleSymptom(symptom.key)}
                >
                  <Ionicons
                    name={symptoms[symptom.key] ? "checkbox" : "square-outline"}
                    size={24}
                    color="#6366f1"
                  />
                  <Text style={styles.checkboxLabel}>{symptom.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveSymptoms}
                disabled={savingSymptoms}
              >
                {savingSymptoms ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Symptoms</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {moodHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood Trend (Last 10 Entries)</Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartLegend}>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: "#dc2626" }]} />
                  <Text style={styles.legendText}>Manic/Hypomanic</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: "#10b981" }]} />
                  <Text style={styles.legendText}>Normal</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: "#991b1b" }]} />
                  <Text style={styles.legendText}>Depressed</Text>
                </View>
              </View>
              <LineChart
                data={prepareChartData()}
                width={Dimensions.get('window').width - 64}
                height={200}
                color="#6366f1"
                thickness={2}
                dataPointsColor="#6366f1"
                startFillColor="rgba(99, 102, 241, 0.3)"
                endFillColor="rgba(99, 102, 241, 0.05)"
                startOpacity={0.9}
                endOpacity={0.2}
                curved
                areaChart
                hideRules
                hideYAxisText
                yAxisColor="#e2e8f0"
                xAxisColor="#e2e8f0"
                yAxisThickness={0}
                xAxisThickness={1}
                noOfSections={4}
                maxValue={10}
                pointerConfig={{
                  pointerStripHeight: 160,
                  pointerStripColor: '#6366f1',
                  pointerStripWidth: 2,
                  pointerColor: '#6366f1',
                  radius: 6,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 90,
                  activatePointersOnLongPress: false,
                  autoAdjustPointerLabelPosition: false,
                  pointerLabelComponent: (items: any) => {
                    const moodNames = ["", "Extremely Suicidal", "Extremely Depressed", "Depressed", "Sad", "Normal", "Pleasant", "Very Happy", "Hypomanic", "Manic"];
                    return (
                      <View style={styles.tooltipContainer}>
                        <Text style={styles.tooltipText}>{moodNames[items[0]?.value] || ""}</Text>
                      </View>
                    );
                  },
                }}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood History</Text>
          {moodHistory.length === 0 ? (
            <Text style={styles.emptyText}>No mood entries yet</Text>
          ) : (
            <View style={styles.historyContainer}>
              {moodHistory.map((entry) => {
                const maniaSymptoms = [];
                const depressionSymptoms = [];
                
                // Collect mania symptoms
                if (entry.racing_thoughts) maniaSymptoms.push("Racing Thoughts");
                if (entry.no_sleep) maniaSymptoms.push("No Need of Sleep");
                if (entry.over_interest) maniaSymptoms.push("Overly Interested");
                if (entry.lack_control) maniaSymptoms.push("Lack of Control");
                if (entry.anxiety) maniaSymptoms.push("Anxiety");
                if (entry.ordering) maniaSymptoms.push("Ordering");
                if (entry.over_planning) maniaSymptoms.push("Over Planning");
                
                // Collect depression symptoms
                if (entry.self_harm) depressionSymptoms.push("Self Harm");
                if (entry.angry) depressionSymptoms.push("Angry");
                if (entry.depressed_anxiety) depressionSymptoms.push("Anxious");
                
                const allSymptoms = [...maniaSymptoms, ...depressionSymptoms];
                
                return (
                  <View key={entry.id} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyMood}>{entry.mood}</Text>
                      <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                    </View>
                    {allSymptoms.length > 0 && (
                      <View style={styles.symptomsTagsContainer}>
                        {allSymptoms.map((symptom, index) => (
                          <View key={index} style={styles.symptomTag}>
                            <Text style={styles.symptomTagText}>{symptom}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginLeft: 8,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  moodGrid: {
    gap: 12,
  },
  moodButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  moodButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },
  symptomsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#1e293b",
  },
  saveButton: {
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  historyContainer: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyMood: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  historyDate: {
    fontSize: 14,
    color: "#64748b",
  },
  symptomsTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  symptomTag: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  symptomTagText: {
    fontSize: 12,
    color: "#4f46e5",
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    padding: 24,
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 16,
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: "#64748b",
  },
  tooltipContainer: {
    backgroundColor: "#1e293b",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
