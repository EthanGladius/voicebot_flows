// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, NumberPrompt, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
const { TopLevelDialog, TOP_LEVEL_DIALOG } = require('./topLevelDialog');
const { TopLevelDialog2, TOP_LEVEL_DIALOG2 } = require('./topLevelDialog2');

const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';
const NUMBER_PROMPT = 'NUMBER_PROMPT';

class MainDialog extends ComponentDialog {
    constructor(userState) {
        super(MAIN_DIALOG);
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
        
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));

        this.addDialog(new TopLevelDialog());
        this.addDialog(new TopLevelDialog2());
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.askFlowStep.bind(this),
            this.initialStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async askFlowStep(stepContext) {
        const promptOptions = { prompt: 'Please enter 1 for dialog flow 1, and 2 for dialog flow 2.' };
        return await stepContext.prompt(NUMBER_PROMPT, promptOptions);
    }

    async initialStep(stepContext) {
        if (stepContext.result == 1) {
            return await stepContext.beginDialog(TOP_LEVEL_DIALOG);

        } else {
            // Otherwise, start the review selection dialog.
            return await stepContext.beginDialog(TOP_LEVEL_DIALOG2);
    }
}

    async finalStep(stepContext) {
        const userInfo = stepContext.result;

        const status = 'You are signed up to review ' +
            (userInfo.companiesToReview.length === 0 ? 'no companies' : userInfo.companiesToReview.join(' and ')) + '.';
        await stepContext.context.sendActivity(status);
        await this.userProfileAccessor.set(stepContext.context, userInfo);
        return await stepContext.endDialog();
    }
}

module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;
