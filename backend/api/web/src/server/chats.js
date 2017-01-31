class Chats {
    constructor(io) {
        this.io = io;
        this.chats = [];
    }
    addChat(newchat) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (self.chats.map(chat => chat.id).indexOf(newchat.id) === -1) {
                self.chats.push(newchat);
                resolve();
            } else { reject(); }
        });
    }
    removeChat(rmchat) {
        const self = this;
        return new Promise((resolve, reject) => {
            const idx = self.chats.map(chat => chat.id).indexOf(rmchat.id);
            if (idx === -1) {
                reject();
            } else {
                self.chats[idx].stop();
                self.chats.splice(idx, 1);
                resolve();
            }
        });
    }
    getChat(chatId) {
        const self = this;
        return new Promise((resolve, reject) => {
            const idx = self.chats.map(chat => chat.id).indexOf(chatId);
            if (idx === -1) {
                reject();
            } else {
                resolve(self.chats[idx]);
            }
        });
    }
}

module.exports = Chats;
