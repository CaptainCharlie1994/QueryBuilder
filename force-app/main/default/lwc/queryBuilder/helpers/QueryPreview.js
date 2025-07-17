// soqlPreviewBuilder.js
export function buildPreview(queryParts) {
  const { mainFields, mainObject, mainWhere, orderBy, queryLimit } = queryParts;
  let preview = `SELECT ${mainFields.join(', ')} FROM ${mainObject}`;

  if (mainWhere) preview += ` WHERE ${mainWhere}`;
  if (orderBy) preview += ` ORDER BY ${orderBy}`;
  if (queryLimit) preview += ` queryLimit ${queryLimit}`;

  return preview;
}