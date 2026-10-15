"use client";

import { BIO_PRESETS, BIO_TEMPLATES } from "@/lib/bioPresets";

function ChoiceRow(props) {
  return (
    <div>
      <label className="text-xs text-text-muted block mb-1">
        {props.label}
      </label>
      <div className="flex flex-wrap gap-2">
        {props.options.map(function (o) {
          var active = props.value === o.value;
          return (
            <button
              key={o.value}
              onClick={function () {
                props.onChange(o.value);
              }}
              className={
                "text-xs border rounded-md px-3 py-1.5 transition-colors " +
                (active
                  ? "border-signal text-white"
                  : "border-white/10 text-text-muted hover:text-white")
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow(props) {
  return (
    <button
      onClick={function () {
        props.onChange(!props.value);
      }}
      className="flex items-center justify-between w-full text-left"
    >
      <span className="text-xs text-text-muted">{props.label}</span>
      <span
        className={
          "w-9 h-5 rounded-full relative transition-colors " +
          (props.value ? "bg-signal" : "bg-white/15")
        }
      >
        <span
          className={
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all " +
            (props.value ? "left-4.5" : "left-0.5")
          }
        />
      </span>
    </button>
  );
}

var BACKGROUNDS = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "aurora", label: "Aurora" },
  { value: "grid", label: "Grid" },
];
var FONTS = [
  { value: "classic", label: "Classic" },
  { value: "grotesk", label: "Grotesk" },
  { value: "mono", label: "Mono" },
  { value: "serif", label: "Serif" },
];
var SHAPES = [
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
  { value: "square", label: "Square" },
];
var FILLS = [
  { value: "surface", label: "Filled" },
  { value: "outline", label: "Outline" },
  { value: "solid", label: "Solid" },
  { value: "glass", label: "Glass" },
  { value: "brutal", label: "Brutal" },
];
var HOVERS = [
  { value: "fade", label: "Fade" },
  { value: "lift", label: "Lift" },
  { value: "glow", label: "Glow" },
  { value: "none", label: "None" },
];
var AVATARS = [
  { value: "circle", label: "Circle" },
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" },
];

export default function BioThemePicker(props) {
  var theme = props.theme;
  var setTheme = props.setTheme;

  var update = function (field, value) {
    var next = Object.assign({}, theme);
    next[field] = value;
    setTheme(next);
  };

  var applyTemplate = function (tpl) {
    setTheme(Object.assign({}, theme, tpl.theme));
  };

  var setCustomColor = function (field, value) {
    var custom = Object.assign({}, theme.custom, {});
    custom[field] = value;
    setTheme(Object.assign({}, theme, { preset: "custom", custom: custom }));
  };

  var presetKeys = Object.keys(BIO_PRESETS);

  return (
    <div className="bg-surface border border-white/10 rounded-lg p-5 space-y-5">
      <h3 className="text-sm font-display font-medium text-white">Theme</h3>

      <div>
        <label className="text-xs text-text-muted block mb-1">
          Templates (one tap, then fine-tune below)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BIO_TEMPLATES.map(function (tpl) {
            var p = BIO_PRESETS[tpl.theme.preset];
            return (
              <button
                key={tpl.key}
                onClick={function () {
                  applyTemplate(tpl);
                }}
                className="flex items-center gap-2 border border-white/10 hover:border-white/30 rounded-md px-3 py-2 text-xs transition-colors"
                style={{ backgroundColor: p.bg }}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.accent }}
                />
                <span style={{ color: p.text }} className="truncate">
                  {tpl.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs text-text-muted block mb-1">Colors</label>
        <div className="flex flex-wrap gap-2">
          {presetKeys.map(function (key) {
            var p = BIO_PRESETS[key];
            var active = theme.preset === key;
            return (
              <button
                key={key}
                onClick={function () {
                  update("preset", key);
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
              update("preset", "custom");
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

      <ChoiceRow
        label="Background"
        value={theme.background}
        options={BACKGROUNDS}
        onChange={function (v) {
          update("background", v);
        }}
      />
      <ChoiceRow
        label="Font"
        value={theme.font}
        options={FONTS}
        onChange={function (v) {
          update("font", v);
        }}
      />
      <ChoiceRow
        label="Button shape"
        value={theme.buttonStyle}
        options={SHAPES}
        onChange={function (v) {
          update("buttonStyle", v);
        }}
      />
      <ChoiceRow
        label="Button fill"
        value={theme.buttonFill}
        options={FILLS}
        onChange={function (v) {
          update("buttonFill", v);
        }}
      />
      <ChoiceRow
        label="Button hover effect"
        value={theme.buttonHover}
        options={HOVERS}
        onChange={function (v) {
          update("buttonHover", v);
        }}
      />
      <ChoiceRow
        label="Avatar shape"
        value={theme.avatarShape}
        options={AVATARS}
        onChange={function (v) {
          update("avatarShape", v);
        }}
      />

      <div className="space-y-3 pt-1">
        <ToggleRow
          label="Glowing avatar ring"
          value={theme.avatarRing}
          onChange={function (v) {
            update("avatarRing", v);
          }}
        />
        <ToggleRow
          label="Entrance animation"
          value={theme.animate}
          onChange={function (v) {
            update("animate", v);
          }}
        />
      </div>
    </div>
  );
}
