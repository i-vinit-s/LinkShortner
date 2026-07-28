"use client";

import { BIO_PRESETS } from "@/lib/bioPresets";

export default function BioThemePicker(props) {
  var theme = props.theme;
  var setTheme = props.setTheme;

  var setPreset = function (key) {
    setTheme(Object.assign({}, theme, { preset: key }));
  };

  var setCustomColor = function (field, value) {
    var custom = Object.assign({}, theme.custom, {});
    custom[field] = value;
    setTheme(Object.assign({}, theme, { preset: "custom", custom: custom }));
  };

  var setButtonStyle = function (style) {
    setTheme(Object.assign({}, theme, { buttonStyle: style }));
  };

  var presetKeys = Object.keys(BIO_PRESETS);

  return (
    <div className="bg-surface border border-white/10 rounded-lg p-5 space-y-4">
      <h3 className="text-sm font-display font-medium text-white">Theme</h3>

      <div className="flex flex-wrap gap-2">
        {presetKeys.map(function (key) {
          var p = BIO_PRESETS[key];
          var active = theme.preset === key;
          return (
            <button
              key={key}
              onClick={function () {
                setPreset(key);
              }}
              className={
                "flex items-center gap-2 border rounded-md px-3 py-2 text-xs transition-colors " +
                (active
                  ? "border-signal"
                  : "border-white/10 hover:border-white/30")
              }
              style={{ backgroundColor: p.bg }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: p.accent }}
              />
              <span style={{ color: p.text }}>{p.label}</span>
            </button>
          );
        })}
        <button
          onClick={function () {
            setPreset("custom");
          }}
          className={
            "border rounded-md px-3 py-2 text-xs text-text-muted hover:text-white transition-colors " +
            (theme.preset === "custom"
              ? "border-signal"
              : "border-white/10 hover:border-white/30")
          }
        >
          Custom
        </button>
      </div>

      {theme.preset === "custom" ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["bg", "surface", "accent", "text"].map(function (field) {
            var current = (theme.custom && theme.custom[field]) || "#12141C";
            return (
              <div key={field}>
                <label className="text-xs text-text-muted capitalize block mb-1">
                  {field}
                </label>
                <input
                  type="color"
                  value={current}
                  onChange={function (e) {
                    setCustomColor(field, e.target.value);
                  }}
                  className="w-full h-9 bg-surface-raised border border-white/10 rounded-md cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      ) : null}

      <div>
        <label className="text-xs text-text-muted block mb-1">
          Button style
        </label>
        <div className="flex gap-2">
          {["rounded", "pill", "square"].map(function (style) {
            var active = theme.buttonStyle === style;
            return (
              <button
                key={style}
                onClick={function () {
                  setButtonStyle(style);
                }}
                className={
                  "text-xs border rounded-md px-3 py-1.5 capitalize transition-colors " +
                  (active
                    ? "border-signal text-white"
                    : "border-white/10 text-text-muted hover:text-white")
                }
              >
                {style}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
