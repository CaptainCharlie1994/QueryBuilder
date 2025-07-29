import { LightningElement, track } from "lwc";
// ========== SERVICES ======================
import ApexMetadataService from "./services/ApexMetadataService";
import MainOptionMappingService from "./services/MainOptionMappingService";
import ParentObjectMappingService from "./services/ParentOptionMappingService";
//=========== CONTROLLERS ======================
import MetadataLoaderController from "./controllers/MetadataLoaderController";
import MainOptionController from "./controllers/MainOptionController";
import ParentOptionController from "./controllers/ParentOptionController";
import ChildOptionController from "./controllers/ChildOptionController";

//=============== UTILS =======================
import ToggleHelper from "./helpers/ToggleHelper";
import { buildPreview } from "./helpers/QueryPreview";
import {
  getParentFieldRefs,
  getChildSubqueries,
  getWhereClauseFields,
  getWhereClauseOperators
} from "./utils/getters";
import ChildOptionMappingService from "./services/ChildOptionMappingService";
import TabBuilderService from "./services/TabBuilderService";

export default class QueryBuilder extends LightningElement {
  //=============================//
  // 🌐 MAIN OBJECT CONFIGURATION //
  //=============================//

  @track mainObjectOptions = []; // List of selectable top-level objects
  @track selectedMainObject = ""; // Currently selected object API name
  @track mainObjectSelected = false; // Flag to show if an object was successfully selected

  @track mainFieldOptions = []; // Available fields for the selected object
  @track selectedMainFields = []; // Fields selected by the user (dual listbox)

  //===============================//
  // 🎛️ UI STATE & LAYOUT CONTROL //
  //===============================//

  @track layoutClass = "panel-collapsed"; // Toggles UI layout between collapsed and expanded
  @track isMainObjectLoading = true;
  debugMode = false; // Toggles visual debugging (e.g. red borders)

  //=============================//
  // 🔍 QUERY CONFIGURATION STATE //
  //=============================//

  @track queryLimit = 500; // Default LIMIT applied to the query
  @track orderBy = "ASC"; // Default ORDER BY direction
  @track previewText = "SOQL preview will be generated here...."; // Live query preview
  @track mainWhereClause = ""; // WHERE clause text (can expand later into an object)

  //=================================//
  // 🧩 PARENT OBJECT CONFIGURATION //
  //=================================//

  @track parentReferenceTabs = [];
  @track parentObjectOptions = [];
  @track selectedParentReferenceField = "";
  // Dynamic list of parent reference tab objects
  // Each tab holds: { key, label, options[], selected[] }

  //================================//
  // 🧵 CHILD OBJECT CONFIGURATION //
  //================================//

  @track childReferenceTabs = []; // Dynamic list of child subquery tab objects
  @track childObjectOptions = [];
  @track selectedChildReferenceField = "";
  // Each tab will support: { key, label, options[], selected[] }
  // Subqueries will be rendered separately in the final preview

  //===========================//
  // ⚙️ UPCOMING: WHERE CLAUSE //
  //===========================//
  @track filters = [];
  @track selectedWhereField;
  @track selectedWhereType;
  @track currentOperators = [];
  // Planned addition:
  // This will eventually evolve into structured WHERE clause building,
  // including filters for RecordType.DeveloperName and other advanced field logic.

  constructor() {
    super();
    // inject the concrete implementation
    this.metadataLoaderController = new MetadataLoaderController(
      new ApexMetadataService()
    );
    this.mainOptionController = new MainOptionController(
      new MainOptionMappingService()
    );
    this.parentOptionController = new ParentOptionController(
      new ParentObjectMappingService(),
      this.metadataLoaderController
    );
    this.childOptionController = new ChildOptionController(
      new ChildOptionMappingService(),
      this.metadataLoaderController
    );

    this.tabBuilder = new TabBuilderService(this.metadataLoaderController);
  }

  connectedCallback() {
    this.isMainObjectLoading = true;
    this.metadataLoaderController
      .loadObjects()
      .then((list) => {
        this.mainObjectOptions = list.map((name) => ({
          label: `${name.label} (${name.name})`,
          value: name.name
        }));
      })
      .catch((err) => {
        // handle error, show toast, etc.
        console.error("Error loading objects", err);
      })
      .finally(() => {
        this.isMainObjectLoading = false;
      });

    this.addFilter();
  }

  //-------------------------- HANDLES --------------------------
  async handleMainObjectChange(event) {
    this.selectedMainObject = event.detail.value;
    try {
      const rawFields = await this.metadataLoaderController.loadFields(
        this.selectedMainObject
      );
      console.log("Getting the fields returns -> ", JSON.stringify(rawFields));
      this.mainFieldOptions =
        await this.mainOptionController.buildOptions(rawFields);
      console.log(
        "Building the options from the rawFields",
        JSON.stringify(this.mainFieldOptions)
      );

      const refFields = rawFields.filter((f) => f.isReference === true);
      this.parentObjectOptions =
        await this.parentOptionController.buildOptions(refFields);

      this.childObjectOptions = await this.childOptionController.buildOptions(
        this.selectedMainObject
      );

      this.mainObjectSelected = this.mainFieldOptions.length > 0;
    } catch (error) {
      console.error("Error loading fields:", error?.message || error);
      this.mainObjectSelected = false;
    }
  }

  async handleMainFieldChange(event) {
    this.selectedMainFields = event.detail.value;
    console.log(
      "this.selectedMainFields: ",
      JSON.stringify(this.selectedMainFields)
    );

    this.updatePreview();
  }

  handleParentObjectOptionChange(event) {
    this.selectedParentReferenceField = event.detail.value;
  }

  handleParentFieldsChange(event) {
    const relKey = event.target.dataset.relKey;
    const updatedValue = event.detail.value;

    this.parentReferenceTabs = this.parentReferenceTabs.map((tab) =>
      tab.key === relKey ? { ...tab, selected: updatedValue } : tab
    );

    this.updatePreview();
  }

  handleChildObjectChange(event) {
    this.selectedChildReferenceField = event.detail.value;
  }

  async handleReferenceTabClick(event) {
    const tabType = event.currentTarget.dataset.tabType;
    await this.addReferenceTab(tabType);
  }

  // queryBuilder.js

  async addReferenceTab(tabType) {
    const isParent = tabType === "parent";
    const selectedKey = isParent
      ? this.selectedParentReferenceField
      : this.selectedChildReferenceField;

    const optionsList = isParent
      ? this.parentObjectOptions
      : this.childObjectOptions;

    const mapping = optionsList.find((o) => o.value === selectedKey);
    if (!mapping) return;

    // Build tab using the correct service method
    const tab = isParent
      ? await this.tabBuilder.buildParentTab({
          key: selectedKey,
          objectApiName: mapping.referenceTo,
          label: mapping.label,
          relationshipName: mapping.relationshipName
        })
      : await this.tabBuilder.buildChildTab({
          objectApiName: mapping.value,
          relationshipName: mapping.relationshipName
        });
    console.log("Tab type: ", isParent);

    const listProp = isParent ? "parentReferenceTabs" : "childReferenceTabs";
    if (!this[listProp].some((t) => t.key === tab.key)) {
      this[listProp] = [...this[listProp], tab];
    }

    // reset the combobox
    if (isParent) this.selectedParentReferenceField = "";
    else this.selectedChildReferenceField = "";
  }

  handleChildFieldsChange(event) {
    const relKey = event.target.dataset.relKey;
    const updatedValue = event.detail.value;

    this.childReferenceTabs = this.childReferenceTabs.map((tab) =>
      tab.key === relKey ? { ...tab, selected: updatedValue } : tab
    );

    this.updatePreview();
  }

  addFilter() {
    // create a new blank filter with no type → empty operators
    this.filters = [
      ...this.filters,
      {
        id: Date.now(),
        field: null,
        type: null,
        operator: null,
        value: "",
        operators: [] // ← new
      }
    ];
  }

  handleFilterFieldChange(event) {
    const id = event.currentTarget.dataset.id;
    const fieldApi = event.detail.value;
    const opt = this.whereClauseFields.find((o) => o.value === fieldApi) || {};
    const type = opt.type;

    const rawOps = getWhereClauseOperators(type) || [];
    const formatted = rawOps.map((op) => ({ label: op, value: op }));

    this.filters = this.filters.map((f) =>
      f.id === +id ? { ...f, field: fieldApi, type, operators: formatted } : f
    );

    console.log(
      "handleFiltersChange called. filters -> ",
      JSON.stringify(this.filters)
    );
    this.updatePreview();
  }

  handleFilterOperatorChange(event) {
    const id = event.currentTarget.dataset.id;
    const op = event.detail.value;
    this.filters = this.filters.map((f) =>
      f.id === +id ? { ...f, operator: op } : f
    );
    this.updatePreview();
  }

  handleFilterValueChange(event) {
    const id = event.currentTarget.dataset.id;
    const val = event.detail.value;
    this.filters = this.filters.map((f) =>
      f.id === +id ? { ...f, value: val } : f
    );
    this.updatePreview();
  }

  buildWhereText() {
    return this.filters
      .filter((f) => f.field && f.operator && f.value != null)
      .map((f) => {
        // wrap strings/dates in quotes
        const needsQuotes = ["string", "date", "datetime", "picklist"].includes(
          f.type
        );
        const val = needsQuotes ? `'${f.value}'` : f.value;
        return `${f.field} ${f.operator} ${val}`;
      })
      .join(" AND ");
  }

  //------------------------------- TOGGLE -> Logic in ToggleHelper.js ----------------------
  toggleMode(event) {
    const targetProperty = event.currentTarget.dataset.target;
    const toggler = new ToggleHelper();
    const currentValue = this[targetProperty];

    const newValue = toggler.toggle(currentValue);
    this[targetProperty] = newValue;

    // Optional: apply class to DOM for specific toggles like debugMode
    if (targetProperty === "debugMode") {
      const root = this.template.querySelector(".app-container");
      root.classList.toggle("debug-on", newValue);
    }
  }

  get layoutWrapperClass() {
    return `panel-wrapper ${this.layoutClass}`;
  }
  // ---------------------------- GETTERS ------------------------------------------------
  getParentOptions(key) {
    return this.parentReferenceOptions?.[key] || [];
  }

  getParentSelected(key) {
    return this.selectedParentFields?.[key] || [];
  }

  get whereClauseFields() {
    console.log(
      "whereClauseFields",
      JSON.stringify(
        getWhereClauseFields({
          allMainOptions: this.mainFieldOptions,
          selectedMainFields: this.selectedMainFields,
          parentTabs: this.parentReferenceTabs
        })
      )
    );
    return getWhereClauseFields({
      allMainOptions: this.mainFieldOptions,
      selectedMainFields: this.selectedMainFields,
      parentTabs: this.parentReferenceTabs
    });
  }

  get whereClauseOperators() {
    return getWhereClauseOperators(this.selectedWhereField.type);
  }
  //------------------------ SOQL PREVIEW ----------------------------------------------------

  updatePreview() {
    const parentRefs = getParentFieldRefs(this.parentReferenceTabs);
    const childSubs = getChildSubqueries(this.childReferenceTabs);
    const where = this.buildWhereText();
    const fieldFragments = [
      ...this.selectedMainFields,
      ...parentRefs,
      ...childSubs
    ];

    try {
      this.previewText = buildPreview({
        mainObject: this.selectedMainObject,
        fields: fieldFragments,
        where,
        orderBy: this.orderBy,
        limit: this.queryLimit
      });
    } catch (err) {
      this.previewText = "-- Unable to build query --";
    }
  }
}
