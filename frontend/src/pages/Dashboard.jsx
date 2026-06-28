import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import UsageMeter from "../components/UsageMeter";
import UpgradeBanner from "../components/UpgradeBanner";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [scoreData, setScoreData] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [recentBriefs, setRecentBriefs] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, briefsRes, scoresRes, industriesRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/recent-briefs"),
        api.get("/dashboard/score-trend"),
        api.get("/dashboard/industry-breakdown"),
      ]);
      setStats(statsRes.data);
      setRecentBriefs(briefsRes.data);
      setScoreData(scoresRes.data);
      setIndustries(industriesRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";
  const firstScore = scoreData[0]?.score || 0;
  const lastScore = scoreData[scoreData.length - 1]?.score || 0;
  const trend = scoreData.length >= 2 ? lastScore - firstScore : 0;
  const trendText = trend >= 0 ? `+${trend} pts` : `${trend} pts`;

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 bg-gray-200 rounded-xl" />
          <div className="lg:col-span-4 h-80 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Icon name="error" className="text-[48px] text-status-danger" />
        <p className="text-status-danger mt-4 font-semibold">{error}</p>
        <button onClick={fetchDashboardData}
          className="mt-4 text-primary font-semibold hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 md:pt-0">
        <div>
          <h1 className="text-2xl md:text-3xl text-on-surface font-bold">Welcome back, {firstName}</h1>
          <p className="text-sm text-on-surface-variant">Your analysis engine is primed. Here is your current performance snapshot.</p>
        </div>
        <Link to="/new"
          className="bg-[#1e1e1e] hover:bg-black text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm self-start md:self-auto">
          <Icon name="edit" className="text-[20px]" />
          New Brief
        </Link>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Briefs Analyzed" value={stats.totalBriefs || 0} icon="analytics" iconBg="bg-blue-50 text-blue-600"
          trend={stats.totalBriefs > 0 ? { value: stats.change || "+0%", up: true } : null} />
        <StatCard label="Avg Score" value={`${stats.avgScore || 0}%`} icon="monitoring" iconBg="bg-amber-50 text-amber-600" target="Target: 80%" />
        <StatCard label="Time Saved" value={stats.timeSaved || "0h"} icon="timer" iconBg="bg-teal-50 text-teal-600" subtitle="Estimated" />
        <StatCard label="Success Rate" value={`${stats.successRate || 0}%`} icon="verified" iconBg="bg-indigo-50 text-indigo-600" target="Success" />
      </div>

      {user?.billing?.plan === "free" && (
        <UsageMeter current={user.billing.briefsUsed ?? stats.totalBriefs ?? 0} max={user.billing.briefLimit ?? 5} plan="free" />
      )}

      {(user?.billing?.plan === "free" && (user.billing.briefsUsed ?? 0) >= (user.billing.briefLimit ?? 5)) && (
        <UpgradeBanner
          title="You've used all your free briefs"
          description="Upgrade to Pro for unlimited briefs, Brief Builder, and PDF exports."
          cta="Upgrade to Pro"
        />
      )}

      {/* Score Chart + Industry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Over Time */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-outline-variant">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-on-surface">Score Over Time</h2>
            {scoreData.length >= 2 && (
              <span className={`text-sm font-bold flex items-center gap-1 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                <Icon name={trend >= 0 ? "trending_up" : "trending_down"} className="text-[18px]" />
                {trendText}
              </span>
            )}
          </div>
          {scoreData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-on-surface-variant">No score data yet. Analyze your first brief to see your scores over time.</div>
          ) : (
            <div className="relative h-40">
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-outline">
                <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
              </div>
              <div className="ml-8 h-full flex items-end gap-3">
                {scoreData.map((item, i) => {
                  const h = Math.max((item.score / 100) * 100, 5);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-sm bg-primary transition-all" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-outline truncate w-full text-center">{item.date || item.briefName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* By Industry */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant">
          <h2 className="font-bold text-sm text-on-surface mb-1">By Industry</h2>
          <p className="text-xs text-on-surface-variant mb-4">Self-benchmarking across your {stats.totalBriefs || 0} brief{stats.totalBriefs !== 1 ? "s" : ""}</p>
          {industries.length === 0 ? (
            <div className="text-center py-8 text-sm text-on-surface-variant">No industry data yet. Add industries to your briefs.</div>
          ) : (
            <div className="space-y-3">
              {industries.map((ind) => (
                <div key={ind.name} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-on-surface">{ind.name}</span>
                    <span className={`text-[10px] ml-1.5 font-medium ${ind.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {ind.difference >= 0 ? "+" : ""}{ind.difference}pts
                    </span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">{ind.score}%</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between">
            <span className="text-[10px] text-outline">{stats.totalBriefs || 0} brief{stats.totalBriefs !== 1 ? "s" : ""} analyzed</span>
            <Link to="/new" className="text-[10px] text-primary font-semibold hover:underline">Create New Brief &rarr;</Link>
          </div>
        </div>
      </div>

      {/* Overall Average */}
      <div className="bg-white p-5 rounded-xl border border-outline-variant">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-on-surface-variant">Your overall avg</span>
          <span className="text-2xl font-bold text-primary">{stats.avgScore || 0}%</span>
        </div>
      </div>

      {/* Recent Briefs */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-bold text-on-surface">Recent Briefs</h2>
          {recentBriefs.length > 0 && (
            <Link to="/new" className="text-[11px] font-bold text-primary hover:underline">View all</Link>
          )}
        </div>
        {recentBriefs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="description" className="text-[40px] text-on-surface-variant" />
            <p className="mt-3 font-semibold text-on-surface">No briefs yet</p>
            <p className="text-sm text-on-surface-variant mt-1">Create your first brief to get started.</p>
            <Link to="/new" className="mt-4 bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition">Create your first brief</Link>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {recentBriefs.map((b) => {
              const scoreColor = b.score >= 80 ? "text-green-600 bg-green-50" : b.score >= 60 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
              return (
                <div key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition">
                  <div className="min-w-0 flex-1">
                    <Link to={`/brief/${b.id}`} className="font-semibold text-sm text-on-surface hover:text-primary transition">{b.projectName || "Untitled"}</Link>
                    <p className="text-xs text-on-surface-variant mt-0.5">{b.clientName || "—"} &middot; {b.createdAt ? new Date(b.createdAt + "Z").toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor}`}>{b.score}%</span>
                    <Link to={`/brief/${b.id}`} className="text-xs text-primary font-semibold hover:underline">View</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, iconBg, trend, target, subtitle }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-outline-variant hover:shadow-sm transition-all flex flex-col justify-between h-28">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-on-surface">{value}</h3>
        </div>
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon name={icon} className="text-[18px]" />
        </div>
      </div>
      {trend ? (
        <span className={`text-[11px] font-bold flex items-center gap-0.5 ${trend.up ? "text-green-600" : "text-red-600"}`}>
          <Icon name={trend.up ? "trending_up" : "trending_down"} className="text-[14px]" />
          {trend.value}
        </span>
      ) : target ? (
        <span className="text-[11px] text-on-surface-variant font-medium">{target}</span>
      ) : subtitle ? (
        <span className="text-[11px] text-on-surface-variant font-medium">{subtitle}</span>
      ) : <div />}
    </div>
  );
}
