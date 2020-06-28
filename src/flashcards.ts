import * as vscode from 'vscode';
import * as constants from './constants';
import * as fs from "fs";
import * as readline from "readline";

interface Flashcard {
	question: string;
	answer: string;
}

interface TraningData {
	question: string;
	level: number;
}

/*
{
    "Encoded Question string" : 1~10
}
*/

export class Flashcards {

	private deckRootPath: string;
    private trainingDataRootPath: string;
    private separator: string = '';
    
    private currentDeck: Flashcard[] = [];
    private currentTitle: string = '';
    private currentTrainingData: any;

    constructor(deckRootPath: string, trainingDataRootPath: string) {
        this.deckRootPath = deckRootPath;
        this.trainingDataRootPath = trainingDataRootPath;
    
        this.init();
    }
    
    private init() {
        this.updateSeparator();

        let isFirstInit = false;
        if (!fs.existsSync(this.deckRootPath)){
            fs.mkdirSync(this.deckRootPath, { recursive: true });
            isFirstInit = true;
        }
        
        if (!fs.existsSync(this.trainingDataRootPath)){
            fs.mkdirSync(this.trainingDataRootPath, { recursive: true });
        }

        if (isFirstInit) {
            this.createSampleDeck();
        }
    }

    public async cmdStartFlashcards() {
        try {
            let deckTitle = await this.selectDeck();
            await this.loadFlashcards(deckTitle);
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

    private getDeckFilePath(deckTitle: string): string {
        return `${this.deckRootPath}/${deckTitle}.${constants.FLASHCARD_FILE_EXTENSION}`;

    }
    private getTrainingDataFilePath(deckTitle: string): string {
        return `${this.trainingDataRootPath}/${deckTitle}.${constants.TRANING_DATA_FILE_EXTENSION}`;

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
		let deckTitles = fs.readdirSync(this.deckRootPath);
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
                this.changeTrainingLevel(flashcard, 3);
			} else if (selection === constants.MODAL_OPTION_ANSWER_GOOD) {
                this.changeTrainingLevel(flashcard, 0);
			} else if (selection === constants.MODAL_OPTION_ANSWER_EASY) {
                this.changeTrainingLevel(flashcard, -2);
            }
			this.giveQuestion();
		});
    }
    
    private changeTrainingLevel(flashcard:Flashcard, diff: number): void {
        let encodedQuestion = encodeURI(flashcard.question);
        let level: number = constants.TRAINING_DATA_DEFAULT_LEVEL;
        if (this.currentTrainingData[encodedQuestion]) {
            level = this.currentTrainingData[encodedQuestion];
            if (level + diff > constants.TRAINING_DATA_MAXIMUM_LEVEL) {
                level = constants.TRAINING_DATA_MAXIMUM_LEVEL;
            }
            else if (level + diff < constants.TRAINING_DATA_MINIMUM_LEVEL) {
                level = constants.TRAINING_DATA_MINIMUM_LEVEL;
            }
            else {
                level = level + diff;
            }
        }
        this.currentTrainingData[encodedQuestion] = level;
        this.saveCurrentTraningData();
    }

    private saveCurrentTraningData() {
        let stringifiedTrainingData = JSON.stringify(this.currentTrainingData);
        let trainingDataPath = this.getTrainingDataFilePath(this.currentTitle);
        try {
            fs.writeFileSync(trainingDataPath, stringifiedTrainingData);
        } catch (error) {
            throw Error(`The file "${trainingDataPath}" couldn't be saved: ${error}`);
        }
    }

    
    private getNextFlashcard(): Flashcard {

        let encodedQuestion = this.getRandomFlashcardByTrainingData();
        if (!encodedQuestion) {
            return this.getRandomFlashcard();
        }
        else {
            for (let i = 0; i < this.currentDeck.length; i++) {
                if (encodeURI(this.currentDeck[i].question) === encodedQuestion) {
                    return this.currentDeck[i];
                }                
            }
        }
        return this.getRandomFlashcard();
        
    }

    private getRandomFlashcardByTrainingData(): string | undefined {
        let totalLevel = 1;

        for (let encodedQuestion in this.currentTrainingData) {
            totalLevel += this.currentTrainingData[encodedQuestion];
        }

        
        const threshold = Math.floor(Math.random() * totalLevel);
        
        let total = 0;
        for (let encodedQuestion in this.currentTrainingData) {
            total += this.currentTrainingData[encodedQuestion];
        
            if (total >= threshold) {
                return encodedQuestion;
            }
        }
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

    private async loadFlashcards(deckTitle: string) {
        // Load Deck
		await this.loadDeck(deckTitle);

        // Load traning data
        await this.loadTrainingData(deckTitle);
    }
    
    private async loadDeck(deckTitle: string) {
        let deckFilePath = this.getDeckFilePath(deckTitle);
        const fileStream = fs.createReadStream(deckFilePath);
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
            vscode.window.showWarningMessage(`Invalid contents in Deck : "${deckTitle}".  line number : [${wrongLineNumbers.join(', ')}]`);
        }

        if (this.currentDeck.length === 0) {
            throw new Error(`Deck : "${deckTitle}" doesn't have any content`);
        }

        this.currentTitle = deckTitle;
    }

    private async loadTrainingData(deckTitle: string) {
        // FIXME: What if file doesn't exist?
        let trainingDataPath = this.getTrainingDataFilePath(deckTitle);
        vscode.workspace.openTextDocument(trainingDataPath).then((document) => {
            let text = document.getText();
            try {
                this.currentTrainingData = JSON.parse(text);
                this.syncTrainingDataWithDeck();
            } catch (error) {
                throw Error(`Error getting training data: ${error}`);
            }
        });
    }

    private syncTrainingDataWithDeck() {
        for (let i = 0; i < this.currentDeck.length; i++) {
            let encodedQuestion = encodeURI(this.currentDeck[i].question);
            if (!this.currentTrainingData[encodedQuestion]) {
                this.currentTrainingData[encodedQuestion] = constants.TRAINING_DATA_DEFAULT_LEVEL;
            }
        }
        this.saveCurrentTraningData();
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
    
    private createDeck(deckTitle: string, contents: string = '') {
        // Create Deck file
        let newDeckFilePath = this.getDeckFilePath(deckTitle);
        
        if (fs.existsSync(newDeckFilePath)) {
            throw Error(`Flashcard: ${deckTitle} already exists`);
		}

        if (!contents) {
            contents = "13 * 15 ?" + this.separator + "195" + '\n';
            contents += "You can change separator" + this.separator + "in settings";
        }

        try {
            fs.writeFileSync(newDeckFilePath, contents);
        } catch (error) {
            throw Error(`The file "${newDeckFilePath}" couldn't be created: ${error}`);
        }
        
        // Create Training Data
        let newTrainingDataPath = this.getTrainingDataFilePath(deckTitle);
        try {
            fs.writeFileSync(newTrainingDataPath, "{}");
        } catch (error) {
            throw Error(`The file "${newTrainingDataPath}" couldn't be created: ${error}`);
        }
    }

    private async openDeck(deckTitle: string) {
        let deckFilePath = this.getDeckFilePath(deckTitle);
		if (!fs.existsSync(deckFilePath)) {
			throw Error(`Flashcard: ${deckTitle} doesn't exists`);
		}

        const doc = await vscode.workspace.openTextDocument(
			vscode.Uri.file(deckFilePath)
		);
		vscode.window.showTextDocument(doc);
	}

    private async deleteDeck(deckTitle: string) {
        // Delete Deck
        let deckFilePath = this.getDeckFilePath(deckTitle);
        if (!fs.existsSync(deckFilePath)) {
            throw Error(`Flashcard: ${deckTitle} doesn't exists`);
        }
        fs.unlinkSync(deckFilePath);


        // Delete Traning Data
        let trainingDataPath = this.getTrainingDataFilePath(deckTitle);
        fs.unlinkSync(trainingDataPath);
	}
    
    private createSampleDeck() {
        let contents = '';
        contents += "abase" + this.separator + "(v) To lower in position, estimation, or the like; degrade\n";
        contents += "abbess" + this.separator + "(n) The lady superior of a nunnery\n";
        contents += "abbey" + this.separator + "(n) The group of buildings which collectively form the dwelling-place of a society of monks or nuns\n";
        contents += "abbot" + this.separator + "(n) The superior of a community of monks\n";
        contents += "abdicate" + this.separator + "(v) To give up (royal power or the like)\n";
        contents += "abdomen" + this.separator + "(n) In mammals, the visceral cavity between the diaphragm and the pelvic floor; the belly\n";
        contents += "abdominal" + this.separator + "(n) Of, pertaining to, or situated on the abdomen\n";
        contents += "abduction" + this.separator + "(n) A carrying away of a person against his will, or illegally\n";
        contents += "abed" + this.separator + "(adv) In bed; on a bed\n";
        contents += "aberration" + this.separator + "(n) Deviation from a right, customary, or prescribed course\n";
        contents += "abet" + this.separator + "(v) To aid, promote, or encourage the commission of (an offense)\n";
        contents += "abeyance" + this.separator + "(n) A state of suspension or temporary inaction\n";
        contents += "abhorrence" + this.separator + "(n) The act of detesting extremely\n";
        contents += "abhorrent" + this.separator + "(adj) Very repugnant; hateful\n";

        this.createDeck("Sample - SAT Vocabulary", contents);
    }

}