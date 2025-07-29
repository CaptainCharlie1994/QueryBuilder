// helpers/QueryPreview.js
export function buildPreview({ mainObject, fields, where, orderBy, limit }) {
  // Join all fragments (plain fields + subqueries)
  const fieldList = fields.join(', ');

  let soql = `SELECT ${fieldList} FROM ${mainObject}`;
  if (where)   soql += ` WHERE ${where}`;
  if (orderBy) soql += ` ORDER BY ${orderBy}`;
  if (limit)   soql += ` LIMIT ${limit}`;
  return soql;
}