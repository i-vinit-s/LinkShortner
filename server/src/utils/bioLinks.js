const validator = require("validator");

function normalizeBioLinkUrl(platform, value) {
  var url = String(value || "").trim();

  if (platform === "email") {
    var email = url.replace(/^mailto:/i, "");
    return validator.isEmail(email) ? "mailto:" + email : null;
  }

  if (platform === "phone") {
    var phone = url.replace(/^tel:/i, "");
    var digits = phone.replace(/\D/g, "");
    return /^[+]?[-().\s\d]+$/.test(phone) && digits.length >= 7 && digits.length <= 15
      ? "tel:" + phone.replace(/[\s().-]/g, "")
      : null;
  }

  try {
    var parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? url
      : null;
  } catch (err) {
    return null;
  }
}

function isValidBioLinkDestination(platform, value) {
  return normalizeBioLinkUrl(platform, value) !== null;
}

module.exports = { normalizeBioLinkUrl, isValidBioLinkDestination };
