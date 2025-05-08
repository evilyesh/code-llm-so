**# Project: Interactive Chat with File Management**
A web app for chatting with a model, managing files, and configuring settings. Built with aiohttp (Python) and JavaScript.

---
## Structure
### **HTML/CSS**
- `index.html`: Main page with chat, file list, and settings.
- `style.css`: Styles for the interface.

### **JavaScript**
- `fn.js`: DOM helper functions.
- `cRequest.js`: HTTP requests via `CRequest`.
- `cRequestData.js`: Handles request data (`RequestData`).
- `cResponseData.js`: Parses server responses (`ResponseData`).
- `cSettings.js`: Manages chat settings (`CSettings`).
- `cFilesList.js`: Handles file list (`FilesList`).
- `cMessage.js`: Manages chat messages (`Message`).
- `cChatList.js`: Core chat logic (`ChatList`).
- `script.js`: Initializes `ChatList`.

### **Python (aiohttp)**
- `main.py`: Server routes for chat, files, and settings.
- `settings.py`: Loads/saves configurations.
- `db.py`: Database interactions.
- `lang.py`: Language utilities.
- `ext.py`, `chat.py`: Additional utilities.

### **Config**
- JSON files in `/config`: API settings (e.g., OpenRouter, DeepSeek).

### **Database**
- `db.db`: SQLite database.

---
## Features
1. **Chat**: Send/receive messages with model responses.
2. **File Management**: View/edit files, integrate with chat.
3. **Settings**: Configure chat parameters, saved on server.

---
## Conclusion
Modular project for interactive chat, file management, and settings. Easily extensible with clear separation of concerns.