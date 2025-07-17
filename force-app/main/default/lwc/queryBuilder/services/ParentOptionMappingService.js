import IParentOptionHandler from "../interfaces/IParentOptionHandler";

export default class ParentObjectMappingService extends IParentOptionHandler {
  buildParentOptions(fields) {
    return fields.map(f => ({
      label: f.label,
      value: f.value,
      type: f.type,
      referenceTo: f.referenceTo ?? '',
      relationshipName: f.relationshipName ?? ''
    }));
  }
}