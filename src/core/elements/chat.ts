import { byId } from './helpers';

export const chatElements = {
    chat: {
        get scrollContainer() { return byId('problem-and-chat-scroll'); },
        get section() { return byId('chat-section'); },
        get inputContainer() { return byId('chat-input-container'); },
        get clearBtn() { return byId<HTMLButtonElement>('clear-chat-btn'); },
        get newTabBtn() { return byId<HTMLButtonElement>('new-chat-tab-btn'); },
        get tabsContainer() { return byId('chat-tabs-container'); },
        get tabsFadeLeft() { return byId('chat-tabs-fade-left'); },
        get tabsFadeRight() { return byId('chat-tabs-fade-right'); },
        get messages() { return byId('chat-messages'); },
        get quickChips() { return byId('chat-quick-chips'); },
        get input() { return byId<HTMLTextAreaElement>('chat-input'); },
        get sendBtn() { return byId<HTMLButtonElement>('chat-send-btn'); },
    },
};

