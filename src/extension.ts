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
	let deckRootPath = `${context.globalStoragePath}/${constants.DECK_ROOT_DIR_NAME}`;
	let trainingDataRootPath = `${context.globalStoragePath}/${constants.TRAINING_DATA_ROOT_DIR_NAME}`;

	initExtension(deckRootPath, trainingDataRootPath);

	const fcs = new Flashcards(deckRootPath, trainingDataRootPath);

	registerCommand(context, fcs);

	let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBarItem.text = "Flashcards";
	statusBarItem.tooltip = "Click to start flashcards";
	statusBarItem.command = constants.CMD_SHOW_START_MODAL;
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);
}


function initExtension(deckRootPath: string, trainingDataRootPath: string): void {
	if (!fs.existsSync(deckRootPath)){
        fs.mkdirSync(deckRootPath, { recursive: true });
    }
    if (!fs.existsSync(trainingDataRootPath)){
        fs.mkdirSync(trainingDataRootPath, { recursive: true });
	}
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
				fcs.cmdStartFlashcards();
			} else if (selection === constants.MODAL_MENU_CREATE_NEW_DECK) {
				fcs.cmdCreateNewDeck();
			} else if (selection === constants.MODAL_MENU_UPDATE_DECK) {
				fcs.cmdUpdateDeck();
			} else if (selection === constants.MODAL_MENU_DELETE_DECK) {
				fcs.cmdDeleteDeck();
			}
		});
	}));
	
	
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration(constants.SETTING_SEPARATOR)) {
			fcs.updateSeparator();
		}
	}));
}

export function deactivate() {}
