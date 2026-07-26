"use client";

import { useState } from "react";

export default function TagInput(props) {
  var tags = props.tags;
  var setTags = props.setTags;
  var [inputValue, setInputValue] = useState("");

  var addTag = function () {
    var value = inputValue.trim().toLowerCase();
    if (value === "") return;
    if (tags.indexOf(value) !== -1) {
      setInputValue("");
      return;
    }
    if (tags.length >= 5) {
      setInputValue("");
      return;
    }
    setTags(tags.concat([value]));
    setInputValue("");
  };

  var removeTag = function (tag) {
    setTags(
      tags.filter(function (t) {
        return t !== tag;
      }),
    );
  };

  var handleKeyDown = function (e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 flex flex-wrap gap-1.5 items-center">
      {tags.map(function (tag) {
        return (
          <span
            key={tag}
            className="flex items-center gap-1 bg-wire/15 text-wire text-xs rounded px-2 py-1 font-mono"
          >
            {tag}
            <button
              type="button"
              onClick={function () {
                removeTag(tag);
              }}
              className="hover:text-white"
            >
              &times;
            </button>
          </span>
        );
      })}
      <input
        value={inputValue}
        onChange={function (e) {
          setInputValue(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? "Add tags (press Enter)" : ""}
        className="bg-transparent text-sm text-white placeholder:text-text-muted focus:outline-none flex-1 min-w-25"
      />
    </div>
  );
}
