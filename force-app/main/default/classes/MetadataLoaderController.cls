public with sharing class MetadataLoaderController {
  /*
  This method will return a list of all queryable objects.
  */
  @AuraEnabled(cacheable=true)
  public static List<Map<String, Object>> getQueryableObjects() {
    try {
      List<Map<String, Object>> objectDetails = new List<Map<String, Object>>();
      Map<String, Schema.SObjectType> globalDesc = Schema.getGlobalDescribe();

      for (String name : globalDesc.keySet()) {
        Schema.SObjectType objType = globalDesc.get(name);
        Schema.DescribeSObjectResult objDescribe = objType.getDescribe();

        if (
          objDescribe.isQueryable() &&
          objDescribe.isAccessible() &&
          !objDescribe.isCustomSetting() &&
          !objDescribe.getName().toLowerCase().contains('eventrelation')
        ) {
          objectDetails.add(
            new Map<String, Object>{
              'name' => objDescribe.getName(),
              'label' => objDescribe.getLabel()
            }
          );
        }
      }

      objectDetails.sort(new QueryableObjectComparator());

      return objectDetails;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
  /*Helper method for sorting through a map */

  public class QueryableObjectComparator implements Comparator<Map<String, Object>> {
    public Integer compare(Object a, Object b) {
      Map<String, Object> aMap = (Map<String, Object>) a;
      Map<String, Object> bMap = (Map<String, Object>) b;

      String aLabel = (String) aMap.get('label');
      String bLabel = (String) bMap.get('label');

      return aLabel.compareTo(bLabel);
    }
  }

  /*
    This method will pull back all of the fields for a given object.
    @param {String} objectApiName - The API name of the object to get fields for.
  */

  @AuraEnabled(cacheable=true)
  public static List<Map<String, Object>> getFieldsFromObject(
    String objectApiName
  ) {
    //Guard logic if objectApiName is not valid.
    if (String.isBlank(objectApiName)) {
      throw new AuraHandledException('objectApiName must be defined');
    }
    Map<String, Schema.SObjectType> globalDescription = Schema.getGlobalDescribe();
    //Get the key by comparing the keys against the globalDescription (all objects);
    String realKey;
    for (String key : globalDescription.keySet()) {
      if (key.toLowerCase() == objectApiName.toLowerCase()) {
        realKey = key;
        break;
      }
    }

    if (realKey == null) {
      throw new AuraHandledException('Unknown object: ' + objectApiName);
    }

    try {
      Schema.DescribeSObjectResult objectDescription = globalDescription.get(
          realKey
        )
        .getDescribe();

      Map<String, Schema.SObjectField> fieldsMap = objectDescription.fields.getMap();
      List<Map<String, Object>> fieldDetails = new List<Map<String, Object>>();

      for (Schema.SObjectField field : fieldsMap.values()) {
        Schema.DescribeFieldResult fieldDesc = field.getDescribe();

        Schema.DisplayType displayType = fieldDesc.getType();

        Map<String, Object> fieldInfo = new Map<String, Object>{
          'label' => fieldDesc.getLabel(),
          'value' => fieldDesc.getName(),
          'type' => String.valueOf(displayType.name()),
          'isReference' => displayType == Schema.DisplayType.Reference
        };

        // Only enrich reference-specific info if it's relevant
        if (displayType == Schema.DisplayType.Reference) {
          fieldInfo.put(
            'relationshipName',
            fieldDesc.getRelationshipName() ?? ''
          );
          List<Schema.SObjectType> referenceTypes = fieldDesc.getReferenceTo();
          String referenceTo = referenceTypes.isEmpty()
            ? ''
            : referenceTypes[0].getDescribe().getName();
          fieldInfo.put('referenceTo', referenceTo);
        }

        fieldDetails.add(fieldInfo);
      }

      return fieldDetails;
    } catch (Exception e) {
      throw new AuraHandledException(
        'Failed to describe' + realKey + ':' + e.getMessage()
      );
    }
  }

  public class ChildRelationshipMetadata {
    @AuraEnabled public String childSObject;
    @AuraEnabled public String relationshipName;
    @AuraEnabled public String field;
}

  @AuraEnabled(cacheable=true)
  public static List<ChildRelationshipMetadata> loadChildRelationshipsForObject(
    String objectApiName
  ) {
    List<ChildRelationshipMetadata> childRelationships = new List<ChildRelationshipMetadata>();

    Schema.DescribeSObjectResult describe = Schema.getGlobalDescribe()
      .get(objectApiName)
      .getDescribe();
    for (Schema.ChildRelationship rel : describe.getChildRelationships()) {
      if (rel.getRelationshipName() != null) {
        ChildRelationshipMetadata meta = new ChildRelationshipMetadata();
        meta.childSObject = rel.getChildSObject().getDescribe().getName();
        meta.relationshipName = rel.getRelationshipName();
        meta.field = rel.getField().getDescribe().getName();
        childRelationships.add(meta);
        
      }
    }
    for(ChildRelationshipMetadata meta : childRelationships){
      System.debug('Child relationship: ' + meta);
    }
    return childRelationships;
  }
}


