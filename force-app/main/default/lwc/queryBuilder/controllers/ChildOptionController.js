export default class ChildOptionController {
  /**
   * @param {IChildOptionHandler} handler
   * @param {MetadataLoaderController} metadataLoader
   */
  constructor(handler, metadataLoader) {
    this.mapper = handler;
    this.metadataLoader = metadataLoader;
  }

  childOptions = [];

  async buildOptions(selectedParent) {
    const childList = await this.mapper.getChildRelationships(selectedParent);

    // if you ever have multiple child-relationships to the same object,
    // you probably want to key off relationshipName instead of childSObject
    const uniqueRels = Array.from(
      new Map(childList.map((rel) => [rel.relationshipName, rel])).values()
    );

    this.childOptions = uniqueRels.map((rel) => ({
      label: rel.childSObject, // e.g. "Contacts"
      value: rel.childSObject, // use the relationshipName as your key
      referenceTo: rel.childSObject, // so we know which object to load fields for
      relationshipName: rel.relationshipName
    }));

    return this.childOptions;
  }
}
