import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analytics.api';
import type { DashboardSummary, GoogleAdsMonth, SeoMonth, SocialMonth } from '../../types/analytics.types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { ErrorState } from '../shared/ErrorState';
import { formatNumber, formatCurrency, formatPercent, getDelta, deltaColor } from '../../utils/formatters';
import { MONTH_SHORT } from '../../utils/constants';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

type DrillDown = null | 'google-ads' | 'seo' | 'social' | 'video' | 'print';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drillDown, setDrillDown] = useState<DrillDown>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const summary = await analyticsApi.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner text="Loading analytics..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const latestAds = data.googleAds[data.googleAds.length - 1];
  const prevAds = data.googleAds[data.googleAds.length - 2];
  const latestSeo = data.seo[data.seo.length - 1];
  const latestSocial = data.social[data.social.length - 1];
  const prevSocial = data.social[data.social.length - 2];

  if (drillDown) {
    return (
      <div>
        <button onClick={() => setDrillDown(null)} className="btn-ghost text-xs mb-4">← Back to Dashboard</button>
        {drillDown === 'google-ads' && <GoogleAdsDrillDown data={data.googleAds} />}
        {drillDown === 'seo' && <SeoDrillDown data={data.seo} />}
        {drillDown === 'social' && <SocialDrillDown data={data.social} />}
        {drillDown === 'video' && <ProjectsDrillDown title="Video Production" projects={data.videoProjects.byMonth} />}
        {drillDown === 'print' && <ProjectsDrillDown title="Print & Design" projects={data.printProjects.byMonth} />}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Google Ads Card */}
      <div className="card-hover" onClick={() => setDrillDown('google-ads')}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-200">Google Ads</h3>
          <span className="text-xs text-slate-400">{latestAds?.monthLabel}</span>
        </div>
        {latestAds && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Impressions" value={formatNumber(latestAds.kpis.impressions)} delta={prevAds ? getDelta(latestAds.kpis.impressions, prevAds.kpis.impressions) : 0} />
            <Stat label="Clicks" value={formatNumber(latestAds.kpis.clicks)} delta={prevAds ? getDelta(latestAds.kpis.clicks, prevAds.kpis.clicks) : 0} />
            <Stat label="CTR" value={formatPercent(latestAds.kpis.ctr)} />
            <Stat label="ROAS" value={latestAds.kpis.roas.toFixed(1) + 'x'} />
          </div>
        )}
        <MiniChart data={data.googleAds.map(m => ({ label: m.monthLabel, value: m.kpis.impressions }))} color="#22c55e" />
      </div>

      {/* SEO Card */}
      <div className="card-hover" onClick={() => setDrillDown('seo')}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-200">SEO / GEO</h3>
          <span className="text-xs text-slate-400">{latestSeo?.monthLabel}</span>
        </div>
        {latestSeo && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="AI Visibility" value={latestSeo.geoKpis.aiVisibilityScore?.toFixed(1) || '—'} />
            <Stat label="Share of Voice" value={formatPercent(latestSeo.geoKpis.aiShareOfVoice || 0)} />
            <Stat label="Attribution Rate" value={formatPercent(latestSeo.geoKpis.attributionRate || 0)} />
            <Stat label="AI Sessions" value={formatNumber(latestSeo.geoKpis.aiTrafficSessions || 0)} />
          </div>
        )}
        <MiniChart data={data.seo.map(m => ({ label: m.monthLabel, value: m.geoKpis.aiVisibilityScore || 0 }))} color="#3b82f6" />
      </div>

      {/* Social Media Card */}
      <div className="card-hover" onClick={() => setDrillDown('social')}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-200">Social Media</h3>
          <span className="text-xs text-slate-400">{latestSocial?.monthLabel}</span>
        </div>
        {latestSocial && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Followers" value={formatNumber(latestSocial.followers.total)} delta={prevSocial ? getDelta(latestSocial.followers.total, prevSocial.followers.total) : 0} />
            <Stat label="Net Change" value={`+${formatNumber(latestSocial.followers.change)}`} />
          </div>
        )}
        <MiniChart data={data.social.map(m => ({ label: m.monthLabel, value: m.followers.total }))} color="#a855f7" />
      </div>

      {/* Video Production Card */}
      <div className="card-hover" onClick={() => setDrillDown('video')}>
        <h3 className="text-sm font-semibold text-gray-200 mb-3">🎬 Video Production</h3>
        <p className="text-2xl font-bold text-gray-100">{Object.values(data.videoProjects.byMonth).flat().length}</p>
        <p className="text-xs text-slate-400">approved projects</p>
      </div>

      {/* Print & Design Card */}
      <div className="card-hover" onClick={() => setDrillDown('print')}>
        <h3 className="text-sm font-semibold text-gray-200 mb-3">🖨️ Print & Design</h3>
        <p className="text-2xl font-bold text-gray-100">{Object.values(data.printProjects.byMonth).flat().length}</p>
        <p className="text-xs text-slate-400">approved projects</p>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Stat({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-gray-100">{value}</p>
      {delta !== undefined && delta !== 0 && (
        <span className={`text-xs ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
        </span>
      )}
    </div>
  );
}

function MiniChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  return (
    <div className="mt-3 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Drill-Down Views ── */

function GoogleAdsDrillDown({ data }: { data: GoogleAdsMonth[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-100">Google Ads Performance</h2>
      <div className="card h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="monthLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
            <Bar dataKey="kpis.impressions" fill="#22c55e" radius={[4, 4, 0, 0]} name="Impressions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.length > 0 && data[data.length - 1].campaigns.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Top Campaigns</h3>
          <div className="space-y-2">
            {data[data.length - 1].campaigns.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                <span className="text-sm text-gray-300">{c.name}</span>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>{formatNumber(c.impr)} impr</span>
                  <span>{formatCurrency(c.spent)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.length > 0 && data[data.length - 1].execSummary.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-200 mb-2">Executive Summary</h3>
          <ul className="space-y-1.5">
            {data[data.length - 1].execSummary.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-emerald-500">•</span>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SeoDrillDown({ data }: { data: SeoMonth[] }) {
  const latest = data[data.length - 1];
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-100">SEO / GEO Performance</h2>
      <div className="card h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="monthLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
            <Line type="monotone" dataKey="geoKpis.aiVisibilityScore" stroke="#3b82f6" strokeWidth={2} name="AI Visibility" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {latest?.platformMentions.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Platform Share of Voice</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {latest.platformMentions.map((p) => (
              <div key={p.name} className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-100">{p.mentions}</p>
                <p className="text-xs text-slate-400">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SocialDrillDown({ data }: { data: SocialMonth[] }) {
  const latest = data[data.length - 1];
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-100">Social Media Performance</h2>
      <div className="card h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="monthLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
            <Line type="monotone" dataKey="followers.total" stroke="#a855f7" strokeWidth={2} name="Followers" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {latest?.contentEngagement.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Content Engagement</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 pr-3">Type</th>
                <th className="text-right py-2 px-2">Posts</th>
                <th className="text-right py-2 px-2">Likes</th>
                <th className="text-right py-2 px-2">Comments</th>
                <th className="text-right py-2 px-2">Shares</th>
                <th className="text-right py-2 px-2">Reach</th>
              </tr>
            </thead>
            <tbody>
              {latest.contentEngagement.map((e) => (
                <tr key={e.type} className="border-b border-slate-800/50 last:border-0">
                  <td className="py-2 pr-3 text-gray-200 font-medium">{e.type}</td>
                  <td className="text-right py-2 px-2 text-slate-300">{e.posts}</td>
                  <td className="text-right py-2 px-2 text-slate-300">{formatNumber(e.likes)}</td>
                  <td className="text-right py-2 px-2 text-slate-300">{formatNumber(e.comments)}</td>
                  <td className="text-right py-2 px-2 text-slate-300">{formatNumber(e.shares)}</td>
                  <td className="text-right py-2 px-2 text-slate-300">{formatNumber(e.reach)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProjectsDrillDown({ title, projects }: { title: string; projects: Record<string, any[]> }) {
  const months = Object.keys(projects).sort().reverse();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-100">{title}</h2>
      {months.length === 0 && <p className="text-sm text-slate-400">No approved projects yet.</p>}
      {months.map((mk) => (
        <div key={mk}>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">{mk}</h3>
          <div className="space-y-2">
            {projects[mk].map((p: any) => (
              <div key={p._id} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">{p.projectName}</p>
                  <p className="text-xs text-slate-400">{p.type} • {p.subject}</p>
                </div>
                <div className="flex gap-2">
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer" className="btn-ghost text-xs">View →</a>
                  )}
                  {p.printReadyFile && (
                    <a href={p.printReadyFile.url} download className="btn-primary text-xs">
                      Download Print Ready File
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
