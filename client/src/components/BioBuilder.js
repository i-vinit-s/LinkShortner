"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { PLATFORMS } from "@/components/BioIcons";
import BioThemePicker from "@/components/BioThemePicker";
import BioPageView from "@/components/BioPageView";
import { DEFAULT_THEME, normalizeTheme } from "@/lib/bioPresets";
import { SkeletonBlock } from "@/components/LoadingSkeleton";

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
          setTheme(normalizeTheme(p.theme));
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
    return (
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:gap-8" role="status" aria-label="Loading bio page editor" aria-busy="true">
        <div className="space-y-4">
          <section className="space-y-4 rounded-xl border border-white/10 bg-surface p-5 sm:p-6">
            <SkeletonBlock className="h-6 w-32" />
            <SkeletonBlock className="h-11 w-full" />
            <SkeletonBlock className="h-11 w-full" />
            <SkeletonBlock className="h-24 w-full" />
          </section>
          <section className="space-y-4 rounded-xl border border-white/10 bg-surface p-5 sm:p-6">
            <SkeletonBlock className="h-5 w-24" />
            <div className="grid grid-cols-3 gap-2">
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          </section>
        </div>
        <SkeletonBlock className="min-h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:gap-8">
      <div className="space-y-4">
        <div className="bg-surface border border-white/10 rounded-xl p-5 space-y-4 sm:p-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Profile</h2>
            <p className="mt-1 text-sm text-text-muted">Choose how your public page appears.</p>
          </div>
          <div>
            <label htmlFor="bio-slug" className="text-sm font-medium text-white">Page address</label>
            <div className="mt-1 flex items-center bg-surface-raised border border-white/10 rounded-md overflow-hidden focus-within:border-signal">
              <span className="text-text-muted text-sm pl-3 pr-1 py-2 shrink-0 whitespace-nowrap">
                {process.env.NEXT_PUBLIC_APP_URL}/u/
              </span>
              <input
                id="bio-slug"
                value={slug}
                onChange={handleSlugChange}
                placeholder="your-name"
                className="focus-ring flex-1 min-w-0 bg-transparent px-1 py-2 pr-3 text-sm text-white placeholder:text-text-muted focus:outline-none"
                aria-describedby="bio-slug-status"
              />
            </div>
            <p id="bio-slug-status" className={"mt-1 min-h-5 text-xs " + (slugStatus === "available" ? "text-led" : slugStatus === "taken" ? "text-danger" : "text-text-muted")} aria-live="polite">
              {slugStatus === "checking" ? "Checking availability" : slugStatus === "available" ? "Address is available" : slugStatus === "taken" ? "Address is already in use" : "Use 3 or more letters, numbers, dashes, or underscores."}
            </p>
          </div>

          <label className="block text-sm font-medium text-white">Display name<input
            value={displayName}
            onChange={function (e) {
              setDisplayName(e.target.value);
            }}
            placeholder="Display name"
            className="ui-input focus-ring mt-2"
          /></label>

          <label className="block text-sm font-medium text-white">Avatar image URL <span className="font-normal text-text-muted">optional</span><input
            value={avatarUrl}
            onChange={function (e) {
              setAvatarUrl(e.target.value);
            }}
            placeholder="Avatar image URL"
            className="ui-input focus-ring mt-2"
          /></label>

          <label className="block text-sm font-medium text-white">Short bio<textarea
            value={bio}
            onChange={function (e) {
              setBio(e.target.value.slice(0, 200));
            }}
            placeholder="Short bio (max 200 characters)"
            rows={3}
            className="ui-input focus-ring mt-2 h-24 resize-y"
            aria-describedby="bio-length"
          /></label>
          <p id="bio-length" className="text-xs text-text-muted text-right">{bio.length} of 200 characters</p>
        </div>

        <BioThemePicker theme={theme} setTheme={setTheme} />

        <div className="bg-surface border border-white/10 rounded-xl p-5 space-y-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div><h3 className="text-lg font-display font-semibold text-white">Links</h3><p className="mt-1 text-sm text-text-muted">Add and arrange the destinations on your page.</p></div>
            <button
              onClick={addLink}
              disabled={links.length >= 15}
              className="ui-button-secondary focus-ring text-sm disabled:opacity-40"
            >
              + Add link
            </button>
          </div>

          {links.map(function (link, index) {
            return (
              <div
                key={link.id}
                className="bg-surface-raised border border-white/10 rounded-lg p-3 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={link.platform}
                    onChange={function (e) {
                      updateLink(link.id, "platform", e.target.value);
                    }}
                    className="focus-ring min-h-10 bg-surface border border-white/10 rounded-md px-3 text-sm text-white focus:border-signal"
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
                    className="focus-ring rounded px-2 text-sm text-text-muted hover:text-white"
                  >
                    Up
                  </button>
                  <button
                    onClick={function () {
                      moveLink(index, 1);
                    }}
                    className="focus-ring rounded px-2 text-sm text-text-muted hover:text-white"
                  >
                    Down
                  </button>
                  <button
                    onClick={function () {
                      removeLink(link.id);
                    }}
                    className="focus-ring rounded px-2 text-sm text-danger"
                  >
                    Remove
                  </button>
                </div>
                <label className="block text-xs text-text-muted">Link label<input
                  value={link.label}
                  onChange={function (e) {
                    updateLink(link.id, "label", e.target.value);
                  }}
                  placeholder="What should this button say?"
                  className="ui-input focus-ring mt-1"
                /></label>
                <label className="block text-xs text-text-muted">Destination<input
                  value={link.url}
                  onChange={function (e) {
                    updateLink(link.id, "url", e.target.value);
                  }}
                  placeholder="https://example.com"
                  className="ui-input focus-ring mt-1"
                /></label>
              </div>
            );
          })}

          {links.length === 0 ? (
            <p className="text-text-muted text-xs text-center py-2">
              No links yet.
            </p>
          ) : null}
        </div>

        {error ? <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p> : null}
        {success ? <p className="rounded-md border border-led/25 bg-led/10 px-3 py-2 text-sm text-led" role="status">Changes saved.</p> : null}

        <button
          onClick={handleSave}
          disabled={saving || !slug}
          className="ui-button-primary focus-ring w-full"
        >
          {saving ? "Saving..." : "Save page"}
        </button>
      </div>

      <div className="lg:sticky lg:top-6 h-fit">
        <p className="mb-3 text-sm font-medium text-text-muted">Page preview</p>
        <BioPageView
          preview
          page={{
            displayName: displayName,
            bio: bio,
            avatarUrl: avatarUrl,
            links: links,
            theme: theme,
            showBranding: false,
          }}
        />
      </div>
    </div>
  );
}
