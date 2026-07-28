"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { PLATFORMS, BioIcon } from "@/components/BioIcons";
import BioThemePicker from "@/components/BioThemePicker";
import { resolveThemeColors, buttonRadiusClass } from "@/lib/bioPresets";

var DEFAULT_THEME = {
  preset: "signal",
  custom: {
    bg: "#12141C",
    surface: "#1B1F2A",
    accent: "#F5A623",
    text: "#EDEFF4",
  },
  buttonStyle: "rounded",
};

export default function BioBuilder(props) {
  var pageId = props.pageId; // null for a new page
  var router = useRouter();

  var [slug, setSlug] = useState("");
  var [slugStatus, setSlugStatus] = useState(null);
  var [displayName, setDisplayName] = useState("");
  var [bio, setBio] = useState("");
  var [avatarUrl, setAvatarUrl] = useState("");
  var [links, setLinks] = useState([]);
  var [theme, setTheme] = useState(DEFAULT_THEME);
  var [loading, setLoading] = useState(!!pageId);
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState("");
  var [success, setSuccess] = useState("");

  useEffect(
    function () {
      if (!pageId) return;
      var load = async function () {
        try {
          var res = await api.get("/bio/mine/" + pageId);
          var p = res.data.page;
          setSlug(p.slug);
          setDisplayName(p.displayName || "");
          setBio(p.bio || "");
          setAvatarUrl(p.avatarUrl || "");
          setLinks(p.links || []);
          setTheme(p.theme || DEFAULT_THEME);
        } catch (err) {
          setError("Failed to load page");
        } finally {
          setLoading(false);
        }
      };
      load();
    },
    [pageId],
  );

  var checkSlug = async function (value) {
    if (!value || value.length < 3) {
      setSlugStatus(null);
      return;
    }
    setSlugStatus("checking");
    try {
      var params = { slug: value };
      if (pageId) params.excludeId = pageId;
      var res = await api.get("/bio/check-slug", { params: params });
      setSlugStatus(res.data.available ? "available" : "taken");
    } catch (err) {
      setSlugStatus(null);
    }
  };

  var handleSlugChange = function (e) {
    var value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setSlug(value);
    checkSlug(value);
  };

  var addLink = function () {
    setLinks(
      links.concat([
        { id: "link_" + Date.now(), platform: "website", label: "", url: "" },
      ]),
    );
  };

  var updateLink = function (id, field, value) {
    setLinks(
      links.map(function (l) {
        if (l.id !== id) return l;
        var updated = Object.assign({}, l);
        updated[field] = value;
        return updated;
      }),
    );
  };

  var removeLink = function (id) {
    setLinks(
      links.filter(function (l) {
        return l.id !== id;
      }),
    );
  };

  var moveLink = function (index, direction) {
    var newLinks = links.slice();
    var target = index + direction;
    if (target < 0 || target >= newLinks.length) return;
    var temp = newLinks[index];
    newLinks[index] = newLinks[target];
    newLinks[target] = temp;
    setLinks(newLinks);
  };

  var handleSave = async function () {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      var res = await api.post("/bio", {
        pageId: pageId,
        slug: slug,
        displayName: displayName,
        bio: bio,
        avatarUrl: avatarUrl,
        links: links,
        theme: theme,
      });
      setSuccess("Saved!");
      if (!pageId) {
        router.push("/dashboard/bio/" + res.data.page._id);
      }
    } catch (err) {
      var msg = "Failed to save";
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-text-muted text-sm">Loading...</p>;
  }

  var colors = resolveThemeColors(theme);
  var radiusClass = buttonRadiusClass(theme.buttonStyle);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="bg-surface border border-white/10 rounded-lg p-5 space-y-3">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wide">
              Your page URL
            </label>
            <div className="mt-1 flex items-center bg-surface-raised border border-white/10 rounded-md overflow-hidden focus-within:border-signal">
              <span className="text-text-muted text-sm font-mono pl-3 pr-1 py-2 shrink-0 whitespace-nowrap">
                {process.env.NEXT_PUBLIC_APP_URL}/u/
              </span>
              <input
                value={slug}
                onChange={handleSlugChange}
                placeholder="your-name"
                className="flex-1 min-w-0 bg-transparent px-1 py-2 pr-3 text-sm text-white placeholder:text-text-muted focus:outline-none font-mono"
              />
            </div>
            {slugStatus === "checking" ? (
              <p className="text-xs text-text-muted mt-1">Checking...</p>
            ) : null}
            {slugStatus === "available" ? (
              <p className="text-xs text-led mt-1">Available</p>
            ) : null}
            {slugStatus === "taken" ? (
              <p className="text-xs text-danger mt-1">Already taken</p>
            ) : null}
          </div>

          <input
            value={displayName}
            onChange={function (e) {
              setDisplayName(e.target.value);
            }}
            placeholder="Display name"
            className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
          />

          <input
            value={avatarUrl}
            onChange={function (e) {
              setAvatarUrl(e.target.value);
            }}
            placeholder="Avatar image URL"
            className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
          />

          <textarea
            value={bio}
            onChange={function (e) {
              setBio(e.target.value.slice(0, 200));
            }}
            placeholder="Short bio (max 200 characters)"
            rows={3}
            className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal resize-none"
          />
          <p className="text-xs text-text-muted text-right">{bio.length}/200</p>
        </div>

        <BioThemePicker theme={theme} setTheme={setTheme} />

        <div className="bg-surface border border-white/10 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-medium text-white">
              Links
            </h3>
            <button
              onClick={addLink}
              disabled={links.length >= 15}
              className="text-xs border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white disabled:opacity-40"
            >
              + Add link
            </button>
          </div>

          {links.map(function (link, index) {
            return (
              <div
                key={link.id}
                className="bg-surface-raised border border-white/10 rounded-md p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={link.platform}
                    onChange={function (e) {
                      updateLink(link.id, "platform", e.target.value);
                    }}
                    className="bg-surface border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-signal"
                  >
                    {PLATFORMS.map(function (p) {
                      return (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      );
                    })}
                  </select>
                  <div className="flex-1" />
                  <button
                    onClick={function () {
                      moveLink(index, -1);
                    }}
                    className="text-text-muted hover:text-white text-xs px-1"
                  >
                    Up
                  </button>
                  <button
                    onClick={function () {
                      moveLink(index, 1);
                    }}
                    className="text-text-muted hover:text-white text-xs px-1"
                  >
                    Down
                  </button>
                  <button
                    onClick={function () {
                      removeLink(link.id);
                    }}
                    className="text-danger hover:text-danger text-xs px-1"
                  >
                    Remove
                  </button>
                </div>
                <input
                  value={link.label}
                  onChange={function (e) {
                    updateLink(link.id, "label", e.target.value);
                  }}
                  placeholder="Label (e.g. Join my Discord)"
                  className="w-full bg-surface border border-white/10 rounded-md px-2 py-1.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
                />
                <input
                  value={link.url}
                  onChange={function (e) {
                    updateLink(link.id, "url", e.target.value);
                  }}
                  placeholder="https://..."
                  className="w-full bg-surface border border-white/10 rounded-md px-2 py-1.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-signal font-mono"
                />
              </div>
            );
          })}

          {links.length === 0 ? (
            <p className="text-text-muted text-xs text-center py-2">
              No links yet.
            </p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {success ? <p className="text-sm text-led">{success}</p> : null}

        <button
          onClick={handleSave}
          disabled={saving || !slug}
          className="w-full bg-signal text-ink font-display font-medium rounded-md py-2.5 hover:brightness-110 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save page"}
        </button>
      </div>

      <div className="lg:sticky lg:top-6 h-fit">
        <p className="text-xs uppercase tracking-widest text-text-muted font-mono mb-2">
          Preview
        </p>
        <div
          className="rounded-xl p-8 text-center space-y-4"
          style={{ backgroundColor: colors.bg }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: colors.surface }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span style={{ color: colors.text }} className="text-2xl">
                ?
              </span>
            )}
          </div>
          <div>
            <p
              className="font-display font-bold"
              style={{ color: colors.text }}
            >
              {displayName || "Your name"}
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: colors.text, opacity: 0.7 }}
            >
              {bio || "Your bio goes here"}
            </p>
          </div>
          <div className="space-y-2 pt-2">
            {links
              .filter(function (l) {
                return l.label;
              })
              .map(function (link) {
                return (
                  <div
                    key={link.id}
                    className={
                      "flex items-center gap-2 px-4 py-2.5 text-sm " +
                      radiusClass
                    }
                    style={{
                      backgroundColor: colors.surface,
                      color: colors.text,
                      border: "1px solid " + colors.accent + "33",
                    }}
                  >
                    <BioIcon platform={link.platform} />
                    <span>{link.label}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
