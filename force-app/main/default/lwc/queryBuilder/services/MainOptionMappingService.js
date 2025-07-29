import IMainOptionHandler from "../interfaces/IMainOptionHandler";

export default class MainOptionMappingService extends IMainOptionHandler {
  buildMainOptions(fields) {
    const options = fields.map((f) => ({
      label: `${f.label} (${f.value})`,
      value: f.value,
      type: typeof f.type === 'string' ? f.type.toLowerCase() : String(f.type ?? ''),
      isReference: f.isReference,
      referenceTo: f.referenceTo,
      relationshipName: f.relationshipName
    }));
    return options;
  }
  
}
