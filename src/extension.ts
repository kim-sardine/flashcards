import * as vscode from 'vscode';
import * as constants from './constants';
import Timer from './timer';

import { Flashcards } from './flashcards';

/*****
 * 1. Manage flashcard data
 * 2. Select flashcard category
 * 3. Display flashcard on statusbar
 */

export function activate(context: vscode.ExtensionContext) {
	let deckRootPath = `${context.globalStoragePath}/${constants.DECK_ROOT_DIR_NAME}`;
	let trainingDataRootPath = `${context.globalStoragePath}/${constants.TRAINING_DATA_ROOT_DIR_NAME}`;

	const fcs = new Flashcards(deckRootPath, trainingDataRootPath);

	registerCommand(context, fcs);

	let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBarItem.text = getStatusBarItemText(constants.STATUS_BAR_DEFAULT_TEXT);
	statusBarItem.tooltip = "Click to start flashcards";
	statusBarItem.command = constants.CMD_SHOW_START_MODAL;
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	const timer = new Timer(constants.TIMER_TIME_INTERVAL);
	timer.onTimeChanged(async () => {
		let question = await fcs.getRandomQuestion();
		if (question) {
			statusBarItem.text = getStatusBarItemText(question);
		}
		else {
			statusBarItem.text = getStatusBarItemText(constants.STATUS_BAR_DEFAULT_TEXT);
		}
	});


}

function getStatusBarItemText(text: string): string {
	return `$(symbol-constant) ${text}`;
}


function registerCommand(context: vscode.ExtensionContext, fcs: Flashcards): void {
    context.subscriptions.push(vscode.commands.registerCommand(constants.CMD_SHOW_START_MODAL, () => {
		vscode.window.showInformationMessage("Welcome to Flashcards!",
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
