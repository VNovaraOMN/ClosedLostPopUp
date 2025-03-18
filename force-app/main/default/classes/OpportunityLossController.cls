public with sharing class OpportunityLossController {

    @AuraEnabled(cacheable=true)
    public static List<String> getLossReasonPicklistValues() {
        List<String> picklistValues = new List<String>();
        Schema.DescribeFieldResult fieldResult = Opportunity.Loss_Reason__c.getDescribe();
        
        for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
            picklistValues.add(entry.getLabel());
        }
        
        return picklistValues;
    }

    @AuraEnabled(cacheable=true)
    public static List<OMN_Competitors__c> getRelatedCompetitors(Id opportunityId) {
        if (String.isEmpty(opportunityId)) {
            return new List<OMN_Competitors__c>();
        }

        return [
            SELECT Id, Name, CreatedDate 
            FROM OMN_Competitors__c 
            WHERE Opportunity__c = :opportunityId 
            ORDER BY CreatedDate DESC
        ];
    }
}