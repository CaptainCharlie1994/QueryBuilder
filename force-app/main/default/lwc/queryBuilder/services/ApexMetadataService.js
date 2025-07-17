// services/ApexMetadataService.js
import IMetadataService from '../interfaces/IMetadataService';
import getQueryableObjects from '@salesforce/apex/MetadataLoaderController.getQueryableObjects';
import getFieldsFromObject from '@salesforce/apex/MetadataLoaderController.getFieldsFromObject';

export default class ApexMetadataService extends IMetadataService {
  async getQueryableObjects() {
    
    return getQueryableObjects();
  }

  async getFieldsFromObject(objectApiName){
    console.log('ApexMetadataService -> getFieldsFromObject() called for: ', objectApiName);
    return getFieldsFromObject({objectApiName});
  }
}