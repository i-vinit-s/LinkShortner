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
import Icon from "@/components/Icon";
import api from "@/lib/api";
import { SkeletonBlock } from "@/components/LoadingSkeleton";

var PIE_COLORS = ["#F1B84B", "#B5A2F6", "#53CFA2", "#F17F79", "#60A5FA"];

function StatCard(props) {
  return (
    <dl className="bg-surface border border-white/10 rounded-xl p-4">
      <dt className="text-sm text-text-muted">{props.label}</dt>
      <dd className="mt-2 wrap-break-word font-display text-2xl font-semibold text-white sm:text-3xl">{props.value}</dd>
    </dl>
  );
}

function ChartCard(props) {
  var headingId = "chart-" + props.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <section className="bg-surface border border-white/10 rounded-xl p-5" aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-4 text-base font-display font-semibold text-white">
        {props.title}
      </h2>
      {props.isEmpty ? (
        <div className="flex h-55 items-center justify-center px-4 text-center">
          <p className="text-sm text-text-muted">
            No data yet — check back after a few clicks.
          </p>
        </div>
      ) : (
        props.children
      )}
    </section>
  );
}

function formatChartDate(value) {
  var date = new Date(value + "T00:00:00");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8" role="status" aria-label="Loading link analytics" aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-10 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SkeletonBlock className="h-24 w-full rounded-xl" />
        <SkeletonBlock className="h-24 w-full rounded-xl" />
        <SkeletonBlock className="h-24 w-full rounded-xl" />
      </div>
      <div className="space-y-4 rounded-xl border border-white/10 bg-surface p-5">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="h-60 w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-white/10 bg-surface p-5">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-52 w-full rounded-lg" />
        </div>
        <div className="space-y-4 rounded-xl border border-white/10 bg-surface p-5">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-52 w-full rounded-lg" />
        </div>
      </div>
      <SkeletonBlock className="h-56 w-full rounded-xl" />
    </div>
  );
}

function AnalyticsContent() {
  var params = useParams();
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");
  var [exporting, setExporting] = useState(false);
  var [exportFeedback, setExportFeedback] = useState("");
  var [exportFailed, setExportFailed] = useState(false);

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
    setExportFeedback("");
    setExportFailed(false);
    try {
      var events = [];
      var page = 1;
      var pages = 1;

      do {
        var res = await api.get("/analytics/" + params.id + "/events", {
          params: { page: page },
        });
        events = events.concat(res.data.events);
        pages = res.data.pages || 1;
        page += 1;
      } while (page <= pages);

      if (events.length === 0) {
        setExportFeedback("No click events are available to export yet.");
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
      window.setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
      setExportFeedback("CSV download started.");
    } catch (err) {
      console.error(err);
      setExportFailed(true);
      setExportFeedback("CSV export failed. Try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <AnalyticsSkeleton />;

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-danger" role="alert">{error || "No data found"}</p>
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
    <div className="mx-auto max-w-5xl space-y-7 px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
        <Link href="/dashboard" className="text-sm text-text-muted transition-colors hover:text-white">
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Link analytics
        </h1>
        <p className="mt-2 text-sm text-text-muted">{data.totalClicks.toLocaleString()} total clicks</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button onClick={handleExportCsv} disabled={exporting} className="ui-button-secondary focus-ring inline-flex items-center gap-2 text-sm disabled:opacity-50">
            <Icon name="download" size={16} />{exporting ? "Preparing CSV..." : "Export CSV"}
          </button>
          {exportFeedback ? <p className={"text-sm " + (exportFailed ? "text-danger" : "text-text-muted")} role={exportFailed ? "alert" : "status"} aria-live="polite">{exportFeedback}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total clicks" value={data.totalClicks} />
        <StatCard label="Top referrer" value={topReferrer} />
        <StatCard label="Top country" value={topCountry} />
      </div>

      <ChartCard
        title="Clicks over time"
        isEmpty={data.clicksOverTime.length === 0}
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.clicksOverTime} accessibilityLayer desc="Daily click count for this link.">
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="_id"
              tickFormatter={formatChartDate}
              tick={{ fill: "#A0AAB4", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#A0AAB4", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              name="clicks"
              stroke="#F1B84B"
              strokeWidth={2}
              dot={{ r: 3, fill: "#F1B84B" }}
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
              accessibilityLayer
              desc="Click counts by referring website."
            >
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: "#A0AAB4", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="_id"
                type="category"
                width={90}
                tick={{ fill: "#A0AAB4", fontSize: 12 }}
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
                fill="#B5A2F6"
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
            <PieChart accessibilityLayer desc="Distribution of clicks by device type.">
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
          <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2" aria-label="Clicks by device">
            {data.deviceBreakdown.map(function (entry, index) {
              return (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-text-muted"
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                    }}
                  />
                  <span className="capitalize">{entry._id}</span>
                  <span className="font-mono text-white">{entry.count}</span>
                </li>
              );
            })}
          </ul>
        </ChartCard>
      </div>

      <ChartCard title="Top countries" isEmpty={data.topCountries.length === 0}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.topCountries} accessibilityLayer desc="Click counts by country.">
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="_id"
              tick={{ fill: "#A0AAB4", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#A0AAB4", fontSize: 12 }}
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
              fill="#53CFA2"
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
