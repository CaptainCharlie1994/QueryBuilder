// services/ApexMetadataService.js
import IMetadataService from "../interfaces/IMetadataService";
import getQueryableObjects from "@salesforce/apex/MetadataLoaderController.getQueryableObjects";
import getFieldsFromObject from "@salesforce/apex/MetadataLoaderController.getFieldsFromObject";
import loadChildRelationshipsForObject from "@salesforce/apex/MetadataLoaderController.loadChildRelationshipsForObject";

export default class ApexMetadataService extends IMetadataService {
  async getQueryableObjects() {
    return getQueryableObjects();
  }

  async getFieldsFromObject(objectApiName) {
    console.log(
      "ApexMetadataService -> getFieldsFromObject() called for: ",
      objectApiName
    );
    return getFieldsFromObject({ objectApiName });
  }

  async loadChildRelationshipsForObject(objectApiName) {
    console.log(
      "ApexMetadataService -> loadChildRelationshipsForObject() called for: ",
      objectApiName
    );
    return loadChildRelationshipsForObject({ objectApiName });
  }
}
