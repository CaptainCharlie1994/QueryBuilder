export default class ParentOptionController {
  /**
   * @param {IParentOptionHandler} handler
   * @param {MetadataLoaderController} metadataLoader
   */
  constructor(handler, metadataLoader) {
    this.mapper = handler;
    this.metadataLoader = metadataLoader;
  }

  async buildOptions(fields) {
    return this.mapper.buildParentOptions(fields);
  }

  async buildReferenceTab(fieldApiName, referenceObjectApiName, label, relationshipName) {
    const rawFields = await this.metadataLoader.loadFields(referenceObjectApiName);
    const options = await this.mapper.buildParentOptions(rawFields);

    return {
      key: fieldApiName,
      label,
      relationshipName,
      options,
      selected: []
      
    };
  }
}