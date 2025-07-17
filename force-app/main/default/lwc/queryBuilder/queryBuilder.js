import { LightningElement, track } from "lwc";
// ========== SERVICES ======================
import ApexMetadataService from "./services/ApexMetadataService";
import MainOptionMappingService from "./services/MainOptionMappingService";
import ParentObjectMappingService from "./services/ParentOptionMappingService";
//=========== CONTROLLERS ======================
import MetadataLoaderController from "./controllers/MetadataLoaderController";
import MainOptionController from "./controllers/MainOptionController";
import ParentOptionController from "./controllers/ParentOptionController";

//=============== UTILS =======================
import ToggleHelper from "./helpers/ToggleHelper";
import { buildPreview } from "./helpers/QueryPreview";
import { getParentFieldRefs } from "./utils/getters";

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
  // Dynamic list of parent reference tab objects
  // Each tab holds: { key, label, options[], selected[] }

  //================================//
  // 🧵 CHILD OBJECT CONFIGURATION //
  //================================//

  @track childReferenceTabs = []; // Dynamic list of child subquery tab objects
  // Each tab will support: { key, label, options[], selected[] }
  // Subqueries will be rendered separately in the final preview

  //===========================//
  // ⚙️ UPCOMING: WHERE CLAUSE //
  //===========================//

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
  }

  //-------------------------- HANDLES --------------------------
  async handleMainObjectChange(event) {
    this.selectedMainObject = event.detail.value;
    try {
      const rawFields = await this.metadataLoaderController.loadFields(
        this.selectedMainObject
      );

      this.mainFieldOptions =
        await this.mainOptionController.buildOptions(rawFields);

      const refFields = rawFields.filter((f) => f.isReference === true);
      this.parentObjectOptions =
        await this.parentOptionController.buildOptions(refFields);

      this.mainObjectSelected = this.mainFieldOptions.length > 0;
    } catch (error) {
      console.error("Error loading fields:", error?.message || error);
      this.mainObjectSelected = false;
    }
  }

  async handleMainFieldChange(event) {
    this.selectedMainFields = event.detail.value;

    this.updatePreview();
  }

  handleParentObjectOptionChange(event) {
    this.selectedParentReferenceField = event.detail.value;
  }

  async handleAddParentTab() {
    const fieldApiName = this.selectedParentReferenceField;
    if (!fieldApiName) return;

    const mapping = this.parentObjectOptions.find(
      (opt) => opt.value === fieldApiName
    );
    if (!mapping || !mapping.referenceTo) return;

    try {
      const relationshipName =
        mapping.relationshipName || mapping.value || mapping.key;
      const label = mapping.relationshipName
        ? `${mapping.relationshipName} (${mapping.value})`
        : mapping.label;

      const tab = await this.parentOptionController.buildReferenceTab(
        fieldApiName,
        mapping.referenceTo,
        label,
        relationshipName
      );

      const exists = this.parentReferenceTabs.some(
        (t) => t.key === fieldApiName
      );
      if (!exists) {
        this.parentReferenceTabs = [...this.parentReferenceTabs, tab];
      }

      this.selectedParentReferenceField = null;
    } catch (err) {
      console.error("Failed to add parent tab:", err?.message || err);
    }
  }

  handleParentFieldsChange(event) {
    const relKey = event.target.dataset.relKey;
    const updatedValue = event.detail.value;

    this.parentReferenceTabs = this.parentReferenceTabs.map((tab) =>
      tab.key === relKey ? { ...tab, selected: updatedValue } : tab
    );

    this.updatePreview();
  }

  handleChildFieldsChange(event) {
    const relKey = event.target.dataset.relKey;
    const updatedValue = event.detail.value;

    this.childReferenceTabs = this.childReferenceTabs.map((tab) =>
      tab.key === relKey ? { ...tab, selected: updatedValue } : tab
    );

    this.updatePreview();
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
  //------------------------ SOQL PREVIEW ----------------------------------------------------
  updatePreview() {
    const parentFields = getParentFieldRefs(this.parentReferenceTabs);
    const allFields = [...this.selectedMainFields, ...parentFields];

    try {
      this.previewText = buildPreview({
        mainObject: this.selectedMainObject,
        mainFields: allFields,
        mainWhere: this.mainWhereClause,
        orderBy: this.orderBy,
        queryLimit: this.queryLimit
      });
    } catch (error) {
      this.previewText = "-- Query could not be built -- ";
    }
  }
}
