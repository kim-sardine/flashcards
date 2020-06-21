import * as vscode from 'vscode';
import * as constants from './constants';
import * as fs from "fs";
import * as readline from "readline";

export interface Flashcard {
	question: string;
	answer: string;
}

export class Flashcards {

	private flashcardsRootPath: string;
    private trainingDataRootPath: string;
    private separator: string = '';
    
    private currentDeck: Flashcard[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.flashcardsRootPath = `${context.globalStoragePath}/flashcards`;
        this.trainingDataRootPath = `${context.globalStoragePath}/training_data`;

        this.updateSeparator();
    }
    
    public async cmdStartFlashcards() {
        try {
            let deckTitle = await this.selectDeck();
            await this.loadDeck(deckTitle);
            this.startFlashcards();
        } catch (error) {
            this.handleError(error);
        }
    }

    public async cmdCreateNewDeck() {
        try {
            let deckTitle = await this.inputDeckTitle();
            this.createDeck(deckTitle);
            this.openDeck(deckTitle);
        } catch (error) {
            this.handleError(error);
        }
    }

    public async cmdUpdateDeck() {
        try {
            let deckTitle = await this.selectDeck();
            this.openDeck(deckTitle);
        } catch (error) {
            this.handleError(error);            
        }
    }

    public async cmdDeleteDeck() {
        try {
            let deckTitle = await this.selectDeck();
            this.deleteDeck(deckTitle);
            vscode.window.showInformationMessage(`Deck: "${deckTitle}" is successfully deleted`);
        } catch (error) {
            this.handleError(error);            
        }
    }

    private async selectDeck() {
        let deckTitle = await this.selectDeckTitle();
        if ( !deckTitle ) {
            console.log("Deck is not selected");
            throw Error();
        }
        return deckTitle;
    }

    private handleError(error: any) {
        if (error.message) {
            vscode.window.showWarningMessage(error.message);
        }
    }

    private async selectDeckTitle() {
        let deckTitles = this.getAllDeckTitles();
        if (deckTitles.length === 0) {
            throw new Error(`Please create new deck first.`);
        }

		let deckTitle = await vscode.window.showQuickPick(deckTitles, { placeHolder: "Select Flashcard" });
		return deckTitle;
	}

    private getAllDeckTitles(): string[] {
		let deckTitles = fs.readdirSync(this.flashcardsRootPath);
		deckTitles = deckTitles
					.filter((title) => title.endsWith(`.${constants.FLASHCARD_FILE_EXTENSION}`))
					.map((title) => title.substr(0, title.length - constants.FLASHCARD_FILE_EXTENSION.length - 1));
		return deckTitles;
    }

    private startFlashcards(): void {
        this.giveQuestion();
    }
    
    private giveQuestion(): void {
        let flashcard = this.getNextFlashcard();

        vscode.window.showInformationMessage(flashcard.question,
			constants.MODAL_OPTION_SHOW_ANSWER
		).then(selection => {
			if (selection === constants.MODAL_OPTION_SHOW_ANSWER) {
				this.showAnswer(flashcard);
			}
		});
	}

    private showAnswer(flashcard: Flashcard): void {
		vscode.window.showInformationMessage(flashcard.answer,
			constants.MODAL_OPTION_ANSWER_HARD,
			constants.MODAL_OPTION_ANSWER_GOOD,
			constants.MODAL_OPTION_ANSWER_EASY,
		).then(selection => {
			if (selection === constants.MODAL_OPTION_ANSWER_HARD) {
			} else if (selection === constants.MODAL_OPTION_ANSWER_GOOD) {
			} else if (selection === constants.MODAL_OPTION_ANSWER_EASY) {
			}
			this.giveQuestion();
		});
	}

    private getNextFlashcard(): Flashcard {
        // FIXME: Load by training data
        let flashcard = this.getRandomFlashcard();
        if (!flashcard) {
            throw new Error("Can't get flashcard");
        }
        return flashcard;
	}

    private getRandomFlashcard(): Flashcard {
		let randomIdx = Math.floor(Math.random() * this.currentDeck.length);
		return this.currentDeck[randomIdx];
    }
    
    public updateSeparator(): void {
        let separatorString: string = vscode.workspace.getConfiguration(constants.EXTENSION_ID).get("separator", constants.SEPARATOR_COMMA);
        this.setSeparator(separatorString);
    }
    
    private setSeparator(separatorString: string): void {
        let separator = ','; // Default: COMMA
        if (separatorString === constants.SEPARATOR_SPACE) {
            separator = ' ';
        } 
        else if (separatorString === constants.SEPARATOR_DOUBLE_NUMBER_SIGN) {
            separator = '##';
        }

        this.separator = separator;
    }

    private async loadDeck(deckTitle: string) {
		let filePath = `${this.flashcardsRootPath}/${deckTitle}.${constants.FLASHCARD_FILE_EXTENSION}`;
		const fileStream = fs.createReadStream(filePath);
		const rl = readline.createInterface({
		  input: fileStream,
		  crlfDelay: Infinity
		});

        this.currentDeck = [];
        let wrongLineNumbers: number[] = [];
        let lineNumber: number = 0;
		for await (const line of rl) {
            lineNumber++;
            let qna = line.split(this.separator);
			if (qna.length >= 2) {
				this.currentDeck.push({
					question: qna[0],
					answer: qna.slice(1).join(this.separator)
				});
			}
			else {
                wrongLineNumbers.push(lineNumber);
			}		
        }
        
        if (wrongLineNumbers.length > 0) {
            vscode.window.showWarningMessage(`Invalid contents in "${deckTitle}".  line number : [${wrongLineNumbers.join(', ')}]`);
        }

        if (this.currentDeck.length === 0) {
            throw new Error(`Deck : "${deckTitle}" doesn't have any content`);
        }
    }
    
    private async inputDeckTitle() {
        let deckTitle = await vscode.window.showInputBox(
            {
                placeHolder: 'Title of New Deck'
            }
        );
        if (!deckTitle) {
            console.log(`Invalid deck title: "${deckTitle}"`);
            throw Error();
        }

        return deckTitle;
    }
    
    private createDeck(deckTitle: string) {
        let newFilePath = `${this.flashcardsRootPath}/${deckTitle}.${constants.FLASHCARD_FILE_EXTENSION}`;
		if (fs.existsSync(newFilePath)) {
            throw Error(`Flashcard: ${deckTitle} already exists`);
		}

        let sampleContents = ["First_Question", "First_Answer"].join(this.separator);
        try {
            fs.writeFileSync(newFilePath, sampleContents);
        } catch (error) {
            throw Error(`The file "${newFilePath}" couldn't be created: ${error}`);
        }
    }

    private async openDeck(deckTitle: string) {
        let filePath = `${this.flashcardsRootPath}/${deckTitle}.${constants.FLASHCARD_FILE_EXTENSION}`;
		if (!fs.existsSync(filePath)) {
			throw Error(`Flashcard: ${deckTitle} doesn't exists`);
		}

        const doc = await vscode.workspace.openTextDocument(
			vscode.Uri.file(filePath)
		);
		vscode.window.showTextDocument(doc);
	}

    private async deleteDeck(deckTitle: string) {
        let filePath = `${this.flashcardsRootPath}/${deckTitle}.${constants.FLASHCARD_FILE_EXTENSION}`;
		if (!fs.existsSync(filePath)) {
			throw Error(`Flashcard: ${deckTitle} doesn't exists`);
        }
        
        fs.unlinkSync(filePath);
	}

}