from pathlib import Path

path = Path(r'c:\Users\USER\Downloads\inellihire\files\files\intellihire\src\App.jsx')
text = path.read_text(encoding='utf-8')

text = text.replace(
    'import { Brain, FileText, BarChart3, Users, LogOut, Send, TrendingUp, CheckCircle, Shield, Zap, Target, Award, BookOpen, Home, Loader2, X, Plus, Video, Mic, MicOff, PhoneOff, Volume2, VideoOff, MessageSquare, Trophy, Calendar, Building2, Timer, ChevronRight, RefreshCw } from "lucide-react";',
    'import { Brain, FileText, BarChart3, Users, LogOut, Send, TrendingUp, CheckCircle, Shield, Award, Home, Loader2, X, Plus, Video, Mic, PhoneOff, Volume2, VideoOff, MessageSquare, Calendar, Building2, Timer, ChevronRight, RefreshCw } from "lucide-react";'
)
text = text.replace(
    'import { AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";',
    'import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";'
)

text = text.replace('  const currentFeedback = feedback || answers[qIdx] || null;\n', '')
text = text.replace(
    '  useEffect(() => { if (step !== "active" || !timeLimit) return undefined; setTimeLeft(timeLimit); timerRef.current = setInterval(() => setTimeLeft(value => { if (value <= 1) { clearInterval(timerRef.current); submit("(No answer submitted before the timer expired.)"); return 0; } return value - 1; }), 1000); return () => clearInterval(timerRef.current); }, [step, qIdx, timeLimit]);',
    '  useEffect(() => { if (step !== "active" || !timeLimit) return undefined; setTimeLeft(timeLimit); timerRef.current = setInterval(() => setTimeLeft(value => { if (value <= 1) { clearInterval(timerRef.current); submit("(No answer submitted before the timer expired.)"); return 0; } return value - 1; }), 1000); return () => clearInterval(timerRef.current); }, [step, qIdx, timeLimit, submit]);'
)

markers = [
    ("function LegacyInterviewCore({ title, subtitle, accentColor = C.cyan, timeLimit = null, hardMode = false, onComplete }) {", "function InterviewCore({ title, subtitle, accentColor = C.cyan, timeLimit = null, hardMode = false, onComplete }) {"),
    ("function VideoInterviewPage({ onComplete }) {", "function ResumeAnalyzerPage() {"),
    ("function LegacyResumeAnalyzerPage() {", "function ChatbotPage({ dashboard }) {"),
    ("function ChatbotPage({ dashboard }) {", "function DailyPracticePage() {"),
    ("function DailyPracticePage() {", "function CompanyPrepPage({ onStartInterview, dashboard }) {")
]

for start_marker, end_marker in markers:
    start = text.index(start_marker)
    end = text.index(end_marker)
    text = text[:start] + text[end:]

path.write_text(text, encoding='utf-8')
print('Updated', path)
