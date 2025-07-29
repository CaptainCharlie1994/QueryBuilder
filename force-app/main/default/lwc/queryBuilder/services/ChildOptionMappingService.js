import IChildOptionHandler from "../interfaces/IChildOptionHandler";
import loadChildRelationshipsForObject from '@salesforce/apex/MetadataLoaderController.loadChildRelationshipsForObject';

export default class ChildOptionMappingService extends IChildOptionHandler{
  async getChildRelationships(objectApiName) {
    return loadChildRelationshipsForObject({objectApiName});
  }
}
