@isTest
private class OpportunityLossControllerTest {

    @testSetup
    static void setupData() {
        // Create and insert Account
        Account acc = new Account(
            Name = 'Test Account',
            Rating = 'Competitor' // ✅ This matches the filter requirement
        );
        insert acc;

        // Create and insert Opportunity linked to Account
        Opportunity opp = new Opportunity(
            Name = 'Test Opportunity',
            StageName = '1. Qualification Analysis',
            CloseDate = Date.today(),
            AccountId = acc.Id,
            Commit_Upscope__c = 'Commit',
            Opportunity_Type__c = 'Renewal',
            LeadSource = 'Other'
        );
        insert opp;

        // Create and insert OMN_Competitors__c linked to Account and Opportunity
        OMN_Competitors__c comp1 = new OMN_Competitors__c(
            Opportunity__c = opp.Id,
            Account__c = acc.Id
        );

        OMN_Competitors__c comp2 = new OMN_Competitors__c(
            Opportunity__c = opp.Id,
            Account__c = acc.Id
        );

        insert new List<OMN_Competitors__c> { comp1, comp2 };
    }

    @IsTest
    static void testGetLossReasonPicklistValues() {
        List<String> picklistValues = OpportunityLossController.getLossReasonPicklistValues();
        System.assert(picklistValues.size() > 0, 'Picklist values should not be empty');
    }

    @IsTest
    static void testGetRelatedCompetitors() {
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
        List<OMN_Competitors__c> competitors = OpportunityLossController.getRelatedCompetitors(opp.Id);
        System.assertEquals(2, competitors.size(), 'Competitors size should be equal');
    }

    @IsTest
    static void testGetRelatedCompetitorsWithEmptyId() {
        List<OMN_Competitors__c> competitors = OpportunityLossController.getRelatedCompetitors(null);
        System.assertEquals(0, competitors.size(), 'Should return empty list when no ID provided');
    }
}
