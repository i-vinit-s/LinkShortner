function sanitizeValue(value) {
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      value[i] = sanitizeValue(value[i]);
    }
    return value;
  }

  if (value && typeof value === "object") {
    var keys = Object.keys(value);
    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      if (key.startsWith("$") || key.includes(".")) {
        delete value[key];
      } else {
        value[key] = sanitizeValue(value[key]);
      }
    }
    return value;
  }

  return value;
}

function sanitizeRequest(req, res, next) {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  // Deliberately not touching req.query — it's read-only in this Express version,
  // and nothing in this app builds Mongo queries from query-string input anyway.
  next();
}

module.exports = sanitizeRequest;
