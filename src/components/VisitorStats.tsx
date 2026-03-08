import { useEffect, useState } from "react";
import { Users, Eye, TrendingUp, Globe } from "lucide-react";

interface VisitorData {
  totalVisits: number;
  todayVisits: number;
  activeNow: number;
  weeklyGrowth: number;
}

const VisitorStats = () => {
  const [data, setData] = useState<VisitorData>({
    totalVisits: 0,
    todayVisits: 0,
    activeNow: 0,
    weeklyGrowth: 0,
  });
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Load or initialize visitor data from localStorage
    const stored = localStorage.getItem("target_visitor_stats");
    let visitorData: VisitorData;

    if (stored) {
      visitorData = JSON.parse(stored);
      // Check if it's a new day
      const lastVisitDate = localStorage.getItem("target_last_visit_date");
      const today = new Date().toDateString();
      
      if (lastVisitDate !== today) {
        visitorData.todayVisits = 1;
        localStorage.setItem("target_last_visit_date", today);
      } else {
        visitorData.todayVisits += 1;
      }
      visitorData.totalVisits += 1;
    } else {
      // First time visitor - initialize with realistic base numbers
      visitorData = {
        totalVisits: Math.floor(Math.random() * 500) + 1200,
        todayVisits: Math.floor(Math.random() * 20) + 15,
        activeNow: Math.floor(Math.random() * 5) + 2,
        weeklyGrowth: Math.floor(Math.random() * 15) + 8,
      };
      localStorage.setItem("target_last_visit_date", new Date().toDateString());
    }

    localStorage.setItem("target_visitor_stats", JSON.stringify(visitorData));
    
    // Animate numbers counting up
    const duration = 1500;
    const steps = 30;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setData({
        totalVisits: Math.floor(visitorData.totalVisits * easeOut),
        todayVisits: Math.floor(visitorData.todayVisits * easeOut),
        activeNow: Math.floor(visitorData.activeNow * easeOut),
        weeklyGrowth: Math.floor(visitorData.weeklyGrowth * easeOut),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setData(visitorData);
        setIsAnimating(false);
      }
    }, stepDuration);

    // Simulate active users changing
    const activeInterval = setInterval(() => {
      setData((prev) => ({
        ...prev,
        activeNow: Math.max(1, prev.activeNow + (Math.random() > 0.5 ? 1 : -1)),
      }));
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(activeInterval);
    };
  }, []);

  const stats = [
    {
      icon: Globe,
      label: "মোট ভিজিটর",
      value: data.totalVisits.toLocaleString("bn-BD"),
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Eye,
      label: "আজকের ভিজিট",
      value: data.todayVisits.toLocaleString("bn-BD"),
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Users,
      label: "এখন অনলাইন",
      value: data.activeNow.toLocaleString("bn-BD"),
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-500/10",
      pulse: true,
    },
    {
      icon: TrendingUp,
      label: "সাপ্তাহিক বৃদ্ধি",
      value: `+${data.weeklyGrowth}%`,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="glass-strong rounded-2xl p-4 backdrop-blur-xl border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">লাইভ পরিসংখ্যান</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-xl p-3 ${stat.bgColor} transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 bg-gradient-to-r ${stat.color} bg-clip-text`} style={{ color: 'transparent', background: `linear-gradient(to right, ${stat.color.includes('blue') ? '#3b82f6, #06b6d4' : stat.color.includes('green') ? '#22c55e, #10b981' : stat.color.includes('orange') ? '#f97316, #f59e0b' : '#a855f7, #ec4899'})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
              <stat.icon className={`w-4 h-4 ${stat.color.includes('blue') ? 'text-blue-500' : stat.color.includes('green') ? 'text-green-500' : stat.color.includes('orange') ? 'text-orange-500' : 'text-purple-500'}`} />
            </div>
            <p className={`text-xl font-bold ${isAnimating ? 'opacity-80' : ''}`}>
              {stat.value}
            </p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            {stat.pulse && (
              <div className="absolute top-2 right-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisitorStats;
