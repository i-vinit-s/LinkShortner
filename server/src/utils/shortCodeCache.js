async function clearShortCodeCache(redisClient, link) {
  const codes = new Set([link.shortCode, ...(link.legacyShortCodes || [])]);
  await Promise.all(
    [...codes].filter(Boolean).map((code) => redisClient.del("short:" + code)),
  );
}

module.exports = { clearShortCodeCache };
