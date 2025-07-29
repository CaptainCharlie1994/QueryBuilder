// utils/getters.js

export function getParentFieldRefs(tabs) {
  return tabs.flatMap((tab) =>
    tab.selected.map((field) =>
      convertRelationshipPath(`${tab.relationshipName || tab.key}.${field}`)
    )
  );
}

export function getSelectedFieldMap(tabs) {
  return tabs.reduce((acc, tab) => {
    acc[tab.key] = tab.selected;
    return acc;
  }, {});
}

export function getReferenceLabels(tabs) {
  return tabs.map((tab) => tab.label);
}

function convertRelationshipPath(path) {
  return path.replace(/__c/g, "__r");
}

export function getChildSubqueries(tabs) {
  return tabs
    .map((tab) => {
      const selected = tab.selected;
      if (!Array.isArray(selected) || selected.length === 0) {
        return null;
      }
      // e.g. "(SELECT Name, Email FROM Contacts)"
      return `(SELECT ${selected.join(", ")} FROM ${tab.key})`;
    })
    .filter((sub) => sub);
}

/**
 * Build combobox options for the WHERE‐clause field dropdown.
 * @param {Object}   params
 * @param {Array}    params.allMainOptions     — full list of main fields/options
 * @param {string[]} params.selectedMainFields — values the user has selected
 * @param {Array}    params.parentTabs         — your parentReferenceTabs array
 */
export function getWhereClauseFields({
  allMainOptions,
  selectedMainFields,
  parentTabs = []
}) {
  const mainOpts = allMainOptions
    .filter((opt) => selectedMainFields.includes(opt.value))
    .map((opt) => ({
      label: opt.label,
      value: opt.value, // ← Add this
      type: opt.type
    }));

  const parentOpts = parentTabs.flatMap((tab) =>
    (tab.options || [])
      .filter((o) => (tab.selected || []).includes(o.value))
      .map((o) => ({
        label: `${tab.label}.${o.label}`,
        value: `${tab.relationshipName}.${o.value}`,
        type: o.type
      }))
  );

  return [...mainOpts, ...parentOpts];
}

export function getWhereClauseOperators(selectedWhereField) {
  const validOperatorsByType = {
    string: ["=", "!=", "LIKE"],
    number: ["=", "!=", ">", "<", ">=", "<="],
    boolean: ["=", "!="],
    date: ["=", "!=", ">", "<", ">=", "<="],
    datetime: ["=", "!=", ">", "<", ">=", "<="],
    id: ["=", "!="],
    picklist: ["=", "!="],
    multipicklist: ["INCLUDES", "EXCLUDES"],
    reference: ["=", "!="]
  };
  return validOperatorsByType[selectedWhereField];
}
