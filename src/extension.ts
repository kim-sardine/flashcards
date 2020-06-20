import * as vscode from 'vscode';
import * as constants from './constants';
import * as fs from "fs";

import { Flashcard, Flashcards } from './flashcards';

/*****
 * 1. Manage flashcard data
 * 2. Select flashcard category
 * 3. Display flashcard on statusbar
 */

export function activate(context: vscode.ExtensionContext) {
    initExtension(context);

	const fcs = new Flashcards(context);

	registerCommand(context, fcs);
}


function initExtension(context: vscode.ExtensionContext): void {
    //// Create the defaultNotesRootDirectory only once
    let flashcardsRootPath = `${context.globalStoragePath}/flashcards`;
    let trainingDataRootPath = `${context.globalStoragePath}/training_data`;

	if (!fs.existsSync(flashcardsRootPath)){
        fs.mkdirSync(flashcardsRootPath, { recursive: true });
    }
    if (!fs.existsSync(trainingDataRootPath)){
        fs.mkdirSync(trainingDataRootPath, { recursive: true });
	}
	
	let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBarItem.text = "Flashcards";
	statusBarItem.tooltip = "Click to start flashcards";
	statusBarItem.command = constants.CMD_SHOW_START_MODAL;
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);
}


function registerCommand(context: vscode.ExtensionContext, fcs: Flashcards): void {
    context.subscriptions.push(vscode.commands.registerCommand(constants.CMD_SHOW_START_MODAL, () => {
		vscode.window.showInformationMessage("Select menu",
			constants.MODAL_MENU_START_FLASHCARD,
			constants.MODAL_MENU_CREATE_NEW_DECK,
			constants.MODAL_MENU_UPDATE_DECK,
			constants.MODAL_MENU_DELETE_DECK,
		).then(selection => {
			if (selection === constants.MODAL_MENU_START_FLASHCARD) {
				fcs.cmdSelectDeck();
			} else if (selection === constants.MODAL_MENU_CREATE_NEW_DECK) {
				fcs.cmdCreateNewDeck();
			} else if (selection === constants.MODAL_MENU_UPDATE_DECK) {
				fcs.cmdUpdateDeck();
			} else if (selection === constants.MODAL_MENU_DELETE_DECK) {
				fcs.cmdDeleteDeck();
			}
		});
    }));
}

export function deactivate() {}
