import ITabBuilder from "../interfaces/ITabBuilder";

// services/TabBuilderService.js

export default class TabBuilderService extends ITabBuilder{
  constructor(metadataLoader) {
    super();
    this.metadataLoader = metadataLoader;
  }

  // Parent‐tab builder needs the local lookup field as the key
  async buildParentTab({ key, objectApiName, label, relationshipName }) {
    const rawFields = await this.metadataLoader.loadFields(objectApiName);
    const options = rawFields.map(f => ({
      label: `${f.label} (${f.value})`,
      value: f.value
    }));

    return {
      key,
      label,
      relationshipName,
      options,
      selected: []
    };
  }

  // Child‐tab builder only needs the child sObject and its relationshipName
  async buildChildTab({ objectApiName, relationshipName }) {
    const rawFields = await this.metadataLoader.loadFields(objectApiName);
    const options = rawFields.map(f => ({
      label: `${f.label} (${f.value})`,
      value: f.value
    }));

    return {
      key: relationshipName,       // subquery alias
      label: relationshipName,  // e.g. “Contacts”
      options,
      selected: []
    };
  }
}