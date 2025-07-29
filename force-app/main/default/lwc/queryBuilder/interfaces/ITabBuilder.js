export default class ITabBuilder {
  async buildChildTab({key, objectApiName, label, relationshipName}) {
    throw new Error("buildReferenceTab() not implemented");
  }

  async buildParentTab(objectApiName, relationshipName) {
    throw new Error("buildReferenceTab() not implemented");
  }
}