// utils/getters.js

export function getParentFieldRefs(tabs) {
  return tabs.flatMap(tab =>
    tab.selected.map(field => convertRelationshipPath(`${tab.relationshipName || tab.key}.${field}`))
  );
}

export function getSelectedFieldMap(tabs) {
  return tabs.reduce((acc, tab) => {
    acc[tab.key] = tab.selected;
    return acc;
  }, {});
}

export function getReferenceLabels(tabs) {
  return tabs.map(tab => tab.label);
}

function convertRelationshipPath(path) {
  return path.replace(/__c/g, '__r');
}