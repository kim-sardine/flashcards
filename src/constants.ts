export const EXTENSION_ID: string = 'flashcards';

export const FLASHCARD_FILE_EXTENSION: string = 'txt';
export const TRANING_DATA_FILE_EXTENSION: string = 'json';

export const DECK_ROOT_DIR_NAME: string = 'decks';
export const TRAINING_DATA_ROOT_DIR_NAME: string = 'training_datas';

export const TRAINING_DATA_MAXIMUM_LEVEL: number = 10;
export const TRAINING_DATA_MINIMUM_LEVEL: number = 1;
export const TRAINING_DATA_DEFAULT_LEVEL: number = 5;

export const CMD_SHOW_START_MODAL: string = `${EXTENSION_ID}.show-start-modal`;
export const CMD_SHOW_QUOTE_ON_MODAL: string = `${EXTENSION_ID}.show-quote-on-modal`;
export const CMD_CREATE_FLASHCARD: string = `${EXTENSION_ID}.create-flashcard`;
export const CMD_SELECT_FLASHCARD: string = `${EXTENSION_ID}.select-flashcard`;
export const CMD_OPEN_FLASHCARD: string = `${EXTENSION_ID}.open-flashcard`;
export const CMD_DELETE_FLASHCARD: string = `${EXTENSION_ID}.delete-flashcard`;
export const CMD_EXPORT_FLASHCARD: string = `${EXTENSION_ID}.export-flashcard`; // HOW?
export const CMD_RESET_FLASHCARD_TRAINING_DATA: string = `${EXTENSION_ID}.reset-flashcard-training-data`; // HOW?

export const SETTING_SEPARATOR: string = `${EXTENSION_ID}.separator`;

export const MODAL_MENU_START_FLASHCARD: string = 'Start Flashcard';
export const MODAL_MENU_CREATE_NEW_DECK: string = 'Create New Deck';
export const MODAL_MENU_UPDATE_DECK: string = 'Update Deck';
export const MODAL_MENU_DELETE_DECK: string = 'Delete Deck';

export const MODAL_OPTION_SHOW_ANSWER: string = 'See Answer';
export const MODAL_OPTION_ANSWER_EASY: string = 'Easy';
export const MODAL_OPTION_ANSWER_GOOD: string = 'Good';
export const MODAL_OPTION_ANSWER_HARD: string = 'Hard';

export const SEPARATOR_SPACE: string = 'Space';
export const SEPARATOR_DOUBLE_NUMBER_SIGN: string = 'Double #';
export const SEPARATOR_COMMA: string = 'Comma';

export const TIMER_TIME_INTERVAL: number = 15;

export const STATUS_BAR_DEFAULT_TEXT: string = 'Flashcards!';