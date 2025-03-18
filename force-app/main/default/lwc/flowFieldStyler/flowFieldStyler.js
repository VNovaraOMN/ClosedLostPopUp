import { LightningElement } from 'lwc';

export default class FlowFieldStyler extends LightningElement {
    connectedCallback() {
        window.setTimeout(() => {
            // Select all input fields inside Flow screens
            let requiredFields = this.template.querySelectorAll('input.slds-input[required], textarea[required], select[required]');

            requiredFields.forEach(field => {
                // Apply a red border only to required fields
                field.style.border = "2px solid red";
                field.style.borderRadius = "5px";
                field.style.padding = "5px";
            });
        }, 200); // Delay to ensure Flow fields are fully rendered
    }
}