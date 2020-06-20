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
    
    private currentDeck: Flashcard[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.flashcardsRootPath = `${context.globalStoragePath}/flashcards`;
        this.trainingDataRootPath = `${context.globalStoragePath}/training_data`;

        this.init();
    }
    
    private init(): void {

    }

    public async cmdSelectDeck() {
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
        } catch (error) {
            this.handleError(error);            
        }
    }

    public async selectDeck() {
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
    
    public async loadDeck(deckTitle: string | undefined) {
        if (!deckTitle) {
            throw new Error('Wow!!');
        }
        await this._loadDeck(deckTitle);
    }

    public startFlashcards(): void {
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

    private async _loadDeck(deckTitle: string) {
		let filePath = `${this.flashcardsRootPath}/${deckTitle}.${constants.FLASHCARD_FILE_EXTENSION}`;
		const fileStream = fs.createReadStream(filePath);
		const rl = readline.createInterface({
		  input: fileStream,
		  crlfDelay: Infinity
		});

        this.currentDeck = [];
		for await (const line of rl) {
			let qna = line.split("##");
			if (qna.length === 2) {
				this.currentDeck.push({
					question: qna[0],
					answer: qna[1]
				});
			}
			else {
				let fillInBlank = line.split("$$");
				if (fillInBlank.length % 2 === 1 && fillInBlank.length >= 3) {
					let text: string[] = [];
					for (let i = 0; i < fillInBlank.length; i++) {
						if (i % 2 === 1) {
							text.push('___');
						}
						else {
							text.push(fillInBlank[i]);
						}
					}
					this.currentDeck.push({
						question: text.join(""),
						answer: fillInBlank.join("")
					});
				}
				else {
					vscode.window.showWarningMessage(`Invalid data in your flashcards : ${line}`);
					return;
				}
			}		
        }
        
        if (this.currentDeck.length === 0) {
            throw new Error(`Deck : "${deckTitle}" doesn't have any content`);
        }
    }
    
    public async inputDeckTitle() {
        let deckTitle = await vscode.window.showInputBox(
            {
                placeHolder: 'Title of New Deck'
            }
        );
        if (!deckTitle) {
            throw Error('Invalid title');
        }

        return deckTitle;
    }
    
    public createDeck(deckTitle: string) {
        let newFilePath = `${this.flashcardsRootPath}/${deckTitle}.${constants.FLASHCARD_FILE_EXTENSION}`;
		if (fs.existsSync(newFilePath)) {
            throw Error(`Flashcard: ${deckTitle} already exists`);
		}

        let content = "Question##Answer";

        try {
            fs.writeFileSync(newFilePath, content);
        } catch (error) {
            throw Error(`The file "${newFilePath}" couldn't be created: ${error}`);
        }
    }

    public async openDeck(deckTitle: string) {
        let filePath = `${this.flashcardsRootPath}/${deckTitle}.${constants.FLASHCARD_FILE_EXTENSION}`;
		if (!fs.existsSync(filePath)) {
			throw Error(`Flashcard: ${deckTitle} doesn't exists`);
		}

        const doc = await vscode.workspace.openTextDocument(
			vscode.Uri.file(filePath)
		);
		vscode.window.showTextDocument(doc);
	}

    public async deleteDeck(deckTitle: string) {
        let filePath = `${this.flashcardsRootPath}/${deckTitle}.${constants.FLASHCARD_FILE_EXTENSION}`;
		if (!fs.existsSync(filePath)) {
			throw Error(`Flashcard: ${deckTitle} doesn't exists`);
        }
        
        fs.unlinkSync(filePath);
        vscode.window.showInformationMessage(`Deck: ${deckTitle} is successfully deleted`);
	}

}