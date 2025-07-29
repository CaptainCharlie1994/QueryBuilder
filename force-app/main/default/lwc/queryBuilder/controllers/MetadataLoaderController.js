// services/QueryBuilderController.js
export default class MetadataLoaderController {
  /**
   * @param {IMetadataService} metadataService
   */
  constructor(metadataService) {
    this.meta = metadataService;
  }

  /**
   * Fetches queryable objects via the injected service.
   * @returns {Promise<string[]>}
   */
  async loadObjects() {
    return this.meta.getQueryableObjects();
  }

  async loadFields(objectName){
    return this.meta.getFieldsFromObject(objectName);
  }

  async loadChildRelationships(objectName){
    return this.meta.loadChildRelationshipsForObject(objectName);
  }
}