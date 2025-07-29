// services/IMetadataService.js
export default class IMetadataService {
  /**
   * Returns a Promise resolving to an array of queryable object API names.
   * @returns {Promise<string[]>}
   */
  async getQueryableObjects() {
    throw new Error('IMetadataService.getQueryableObjects() not implemented');
  }

  async getFieldsFromObject(){
    throw new Error('IMetadataServices.getFieldsFromObject() not implemented');
  }

  async loadChildRelationshipsForObject(){
    throw new Error('IMetadataService.loadChildRelationshipsForObject() not implemented');
  }
}