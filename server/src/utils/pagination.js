function getPageBounds(rawPage, total, limit) {
  const requested = Number(rawPage);
  const pages = Math.ceil(total / limit);
  const pageCount = pages || 1;
  const requestedPage =
    Number.isInteger(requested) && requested > 0 ? requested : 1;

  return {
    page: Math.min(requestedPage, pageCount),
    pages,
  };
}

module.exports = { getPageBounds };
