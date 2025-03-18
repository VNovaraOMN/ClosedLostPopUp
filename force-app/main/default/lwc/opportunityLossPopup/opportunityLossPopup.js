import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord, updateRecord, createRecord, deleteRecord } from 'lightning/uiRecordApi';
import { getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';

import getLossReasonPicklistValues from '@salesforce/apex/OpportunityLossController.getLossReasonPicklistValues';
import getRelatedCompetitors from '@salesforce/apex/OpportunityLossController.getRelatedCompetitors';

import STAGE_FIELD from '@salesforce/schema/Opportunity.StageName';
import LOSS_REASON_FIELD from '@salesforce/schema/Opportunity.Loss_Reason__c';
import LOSS_EXPLANATION_FIELD from '@salesforce/schema/Opportunity.Loss_Reason_Explanation__c';

import OMN_COMPETITOR_OBJECT from '@salesforce/schema/OMN_Competitors__c';
import OPPORTUNITY_FIELD from '@salesforce/schema/OMN_Competitors__c.Opportunity__c';
import NAME_FIELD from '@salesforce/schema/OMN_Competitors__c.Name';

export default class OpportunityLossPopup extends NavigationMixin(LightningElement) {
    @api recordId;
    @track showModal = false;
    @track lossReason = '';
    @track lossExplanation = '';
    @track lossReasonOptions = [];
    @track competitors = [];
    @track showCompetitorSection = false;
    @track newCompetitorName = '';

    wiredCompetitorsResult;
    hasOpenedModal = false;

    // ✅ Set aria-hidden state only when hidden
    get ariaHiddenState() {
        return this.showModal ? null : 'true';
    }

    // ✅ Define table columns
    competitorColumns = [
        { label: 'Competitor Name', fieldName: 'Name', editable: true },
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:delete',
                title: 'Delete',
                variant: 'border-filled',
                alternativeText: 'Delete'
            }
        }
    ];

    connectedCallback() {
        console.log('Component loaded. recordId:', this.recordId);

        if (window.location.href.includes('flexipageEditor')) {
            console.log('⚠️ Running inside Lightning App Builder — modal will not open.');
            return;
        }
    }

    // ✅ Fetch Loss Reason Picklist Values
    @wire(getLossReasonPicklistValues)
    wiredLossReasons({ data, error }) {
        if (data) {
            this.lossReasonOptions = data.map(value => ({ label: value, value: value }));
        }
    }

    // ✅ Fetch Related Competitors
    @wire(getRelatedCompetitors, { opportunityId: '$recordId' })
    wiredCompetitors(result) {
        this.wiredCompetitorsResult = result;
        if (result.data) {
            this.competitors = result.data;
            console.log('✅ Fetched Competitors:', this.competitors);
        } else if (result.error) {
            console.error('❌ Error fetching competitors:', result.error);
            this.competitors = [];
        }
    }

    // ✅ Fetch Opportunity Data
    @wire(getRecord, { recordId: '$recordId', fields: [STAGE_FIELD, LOSS_REASON_FIELD, LOSS_EXPLANATION_FIELD] })
    opportunity({ data, error }) {
        if (data) {
            const stageValue = getFieldValue(data, STAGE_FIELD);
            const lossReasonValue = getFieldValue(data, LOSS_REASON_FIELD);
            const lossExplanationValue = getFieldValue(data, LOSS_EXPLANATION_FIELD);

            console.log('➡️ Stage:', stageValue);
            console.log('➡️ Loss Reason:', lossReasonValue);
            console.log('➡️ Loss Explanation:', lossExplanationValue);

            if (
                stageValue === '10. Closed Lost' &&
                (!lossReasonValue || !lossExplanationValue) &&
                !this.hasOpenedModal
            ) {
                this.showModal = true;
                this.hasOpenedModal = true;
            }

            this.lossReason = lossReasonValue || '';
            this.lossExplanation = lossExplanationValue || '';
            this.showCompetitorSection = this.lossReason.toLowerCase() === 'competition';
        }
    }

    // ✅ Handle Loss Reason Change
    handleLossReasonChange(event) {
        this.lossReason = event.detail.value;
        console.log('✅ Updated Loss Reason:', this.lossReason);
        this.showCompetitorSection = this.lossReason.toLowerCase() === 'competition';
    }

    // ✅ Handle Loss Explanation Change
    handleLossExplanationChange(event) {
        this.lossExplanation = event.detail.value;
    }

    // ✅ Save Handler
    handleSave() {
        console.log('✅ Attempting to Save...');
        console.log('➡️ Loss Reason:', this.lossReason);
        console.log('➡️ Loss Explanation:', this.lossExplanation);

        if (!this.lossReason || !this.lossExplanation) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'All fields must be filled in before saving.',
                    variant: 'error'
                })
            );
            return;
        }

        const fields = {
            Id: this.recordId,
            Loss_Reason__c: this.lossReason,
            Loss_Explanation__c: this.lossExplanation
        };

        updateRecord({ fields }).then(() => {
            this.showModal = false;
            this.hasOpenedModal = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Opportunity updated successfully!',
                    variant: 'success'
                })
            );

            // ✅ Refresh related data after save
            return refreshApex(this.wiredCompetitorsResult);
        });
    }

    handleCancel() {
        this.showModal = false;
        this.hasOpenedModal = false;
    }
}
