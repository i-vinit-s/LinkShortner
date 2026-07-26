"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

var PIE_COLORS = ["#F5A623", "#7C6FF0", "#34D399", "#F87171", "#60A5FA"];

function StatCard(props) {
  return (
    <div className="bg-surface border border-white/10 rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted font-mono">
        {props.label}
      </p>
      <p className="text-2xl font-display font-bold text-white mt-1">
        {props.value}
      </p>
    </div>
  );
}

function ChartCard(props) {
  return (
    <div className="bg-surface border border-white/10 rounded-lg p-5">
      <h2 className="text-sm font-display font-medium text-white mb-4">
        {props.title}
      </h2>
      {props.isEmpty ? (
        <div className="h-55 flex items-center justify-center">
          <p className="text-sm text-text-muted">
            No data yet — check back after a few clicks.
          </p>
        </div>
      ) : (
        props.children
      )}
    </div>
  );
}

function CustomTooltip(props) {
  if (!props.active || !props.payload || props.payload.length === 0)
    return null;
  return (
    <div className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-xs">
      <p className="text-text-muted mb-0.5">{props.label}</p>
      {props.payload.map(function (entry, i) {
        return (
          <p key={i} className="text-white font-mono">
            {entry.value} {entry.name}
          </p>
        );
      })}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="h-6 w-40 bg-surface rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-20 bg-surface rounded-lg" />
        <div className="h-20 bg-surface rounded-lg" />
        <div className="h-20 bg-surface rounded-lg" />
      </div>
      <div className="h-64 bg-surface rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="h-56 bg-surface rounded-lg" />
        <div className="h-56 bg-surface rounded-lg" />
      </div>
    </div>
  );
}

function AnalyticsContent() {
  var params = useParams();
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");
  var [exporting, setExporting] = useState(false);

  useEffect(
    function () {
      var loadAnalytics = async function () {
        try {
          var res = await api.get("/analytics/" + params.id);
          setData(res.data);
        } catch (err) {
          setError("Could not load analytics for this link.");
        } finally {
          setLoading(false);
        }
      };
      loadAnalytics();
    },
    [params.id],
  );

  var handleExportCsv = async function () {
    setExporting(true);
    try {
      var res = await api.get("/analytics/" + params.id + "/events");
      var events = res.data.events;

      if (events.length === 0) {
        alert("No click events to export yet.");
        return;
      }

      var csv = Papa.unparse(
        events.map(function (e) {
          return {
            timestamp: new Date(e.timestamp).toISOString(),
            referrer: e.referrer,
            device: e.device,
            browser: e.browser,
            os: e.os,
            country: e.country,
            city: e.city,
          };
        }),
      );

      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = res.data.shortCode + "-clicks.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <AnalyticsSkeleton />;

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-danger">{error || "No data found"}</p>
        <Link
          href="/dashboard"
          className="text-wire hover:underline text-sm mt-3 inline-block"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  var topReferrer =
    data.topReferrers.length > 0 ? data.topReferrers[0]._id : "—";
  var topCountry =
    data.topCountries.length > 0 ? data.topCountries[0]._id : "—";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-xs text-text-muted hover:text-wire font-mono"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="text-2xl font-display font-bold text-white mt-2">
          Link analytics
        </h1>
      </div>

      <button
        onClick={handleExportCsv}
        disabled={exporting}
        className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
      >
        {exporting ? "Exporting..." : "Export CSV"}
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total clicks" value={data.totalClicks} />
        <StatCard label="Top referrer" value={topReferrer} />
        <StatCard label="Top country" value={topCountry} />
      </div>

      <ChartCard
        title="Clicks over time"
        isEmpty={data.clicksOverTime.length === 0}
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.clicksOverTime}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="_id"
              tick={{ fill: "#8B93A7", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#8B93A7", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              name="clicks"
              stroke="#F5A623"
              strokeWidth={2}
              dot={{ r: 3, fill: "#F5A623" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ChartCard
          title="Top referrers"
          isEmpty={data.topReferrers.length === 0}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data.topReferrers}
              layout="vertical"
              margin={{ left: 8 }}
            >
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: "#8B93A7", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="_id"
                type="category"
                width={90}
                tick={{ fill: "#8B93A7", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar
                dataKey="count"
                name="clicks"
                fill="#7C6FF0"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Device breakdown"
          isEmpty={data.deviceBreakdown.length === 0}
        >
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.deviceBreakdown}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {data.deviceBreakdown.map(function (entry, index) {
                  return (
                    <Cell
                      key={"cell-" + index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="none"
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {data.deviceBreakdown.map(function (entry, index) {
              return (
                <div
                  key={index}
                  className="flex items-center gap-1.5 text-xs text-text-muted"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                    }}
                  />
                  {entry._id}
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Top countries" isEmpty={data.topCountries.length === 0}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.topCountries}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="_id"
              tick={{ fill: "#8B93A7", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#8B93A7", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar
              dataKey="count"
              name="clicks"
              fill="#34D399"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-ink">
        <Navbar />
        <AnalyticsContent />
      </div>
    </ProtectedRoute>
  );
}
