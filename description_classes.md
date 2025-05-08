# Detailed Description of Each Class

## 1. **`CRequest` Class (`cRequest.js`)**

### Description:
The `CRequest` class is responsible for sending HTTP requests to the server. It handles the communication between the client and the server, allowing the client to retrieve data, send prompts, and save files.

### Key Methods:
- **`sendRequest(path, data)`**:
  - Sends an HTTP POST request to the specified path with the provided data.
  - Handles the response and returns it as a JSON object.
  - Displays a loading animation while the request is being processed.

### Usage:
- Used to retrieve the file list, send prompts, save files, and perform other server-side operations.

---

## 2. **`RequestData` Class (`cRequestData.js`)**

### Description:
The `RequestData` class handles the data sent in requests and builds prompts for the model. It is responsible for constructing the prompt by combining user input with file content and sending it to the server.

### Key Methods:
- **`getFilesContent()`**:
  - Retrieves the content of the selected files from the server.
- **`buildPrompt(pmt)`**:
  - Constructs the prompt by combining the user's input with the content of the selected files.
  - Includes prefixes, postfixes, and other settings defined in the chat settings.
- **`sendPrompt(pmt, clearContext, useDiff, autoAnswer)`**:
  - Sends the constructed prompt to the server and processes the response.
  - Stores the response in the chat and updates the chat interface.

### Usage:
- Used to build and send prompts to the model, combining user input with file content.

---

## 3. **`ResponseData` Class (`cResponseData.js`)**

### Description:
The `ResponseData` class handles the parsing and processing of server responses. It parses the response data, identifies file changes, and prepares the data for display in the chat.

### Key Methods:
- **`parseResponse()`**:
  - Parses the response data and identifies changes in file content.
  - Replaces file content with placeholders and stores the parsed data.
- **`updateUserFilesContent(files_data)`**:
  - Updates the content of the user files with the data received from the server.

### Usage:
- Used to parse and process server responses, preparing them for display in the chat.

---

## 4. **`CSettings` Class (`cSettings.js`)**

### Description:
The `CSettings` class manages the chat settings, including loading and saving settings. It allows users to select different configurations and apply them to the chat.

### Key Methods:
- **`loadSettingsList()`**:
  - Loads the list of available settings from the server.
- **`handleSettingsChange(event)`**:
  - Handles changes in the settings selection and sends the selected settings to the server.
- **`sendSelectedSettings(selectedSettings)`**:
  - Sends the selected settings to the server for saving.
- **`loadPromptSettings()`**:
  - Loads the prompt settings from the server.

### Usage:
- Used to manage and apply chat settings, including prefixes, postfixes, and other configuration options.

---

## 5. **`FilesList` Class (`cFilesList.js`)**

### Description:
The `FilesList` class manages the file list, its display, and interaction with files. It allows users to navigate directories, select files, and view file content.

### Key Methods:
- **`setPath(path)`**:
  - Sets the current project path and updates the file list.
- **`addFile(file)`**:
  - Adds a file to the file list and updates the DOM to display the file.
- **`removeFile(filePath)`**:
  - Removes a file from the file list and updates the DOM.
- **`getFilesList()`**:
  - Retrieves the file list from the server and updates the display.
- **`handleFileSelection(file)`**:
  - Handles the selection of a file or directory, updating the current path or adding the file to the list.
- **`closeFileListPopup()`**:
  - Closes the file list popup.
- **`showFileListPopup()`**:
  - Displays the file list popup.

### Usage:
- Used to manage the file list, allowing users to navigate directories and select files for editing.

---

## 6. **`Message` Class (`cMessage.js`)**

### Description:
The `Message` class creates and manages chat messages. It constructs the HTML representation of messages and handles interactions with files and user input.

### Key Methods:
- **`constructMessageHtml()`**:
  - Constructs the HTML representation of the message, including file content and changes.
- **`attachDataEventListeners(messageElement)`**:
  - Attaches event listeners to the message elements, allowing users to interact with file changes.
- **`replaceParsedData(content)`**:
  - Replaces placeholders in the message content with parsed file data.
- **`replaceUnknownResponse(content)`**:
  - Replaces placeholders in the message content with unknown data.
- **`renderDiff(init_text, new_text)`**:
  - Renders a diff between the initial text and the new text, highlighting changes.

### Usage:
- Used to create and display chat messages, including file content and changes.

---

## 7. **`ChatList` Class (`cChatList.js`)**

### Description:
The `ChatList` class is the main class that manages the chat logic. It handles user input, server responses, and file interactions. It also manages the display of messages and settings.

### Key Methods:
- **`scrollToMessage(messageId)`**:
  - Scrolls to the specified message in the chat.
- **`closeSettings()`**:
  - Closes the settings popup and focuses on the chat input.
- **`storeMessage(messageText)`**:
  - Stores a user message in the chat and updates the display.
- **`storeResponse(response, clearContext, useDiff, autoAnswer, author)`**:
  - Stores a response from the model in the chat and updates the display.
- **`handleConfirmClick(btn, response)`**:
  - Handles the confirmation of file changes, sending the updated file content to the server.
- **`handleCancelClick(btn, response)`**:
  - Handles the cancellation of file changes, removing the file from the list.
- **`handleError(message, error)`**:
  - Handles errors by displaying an error message in the chat.

### Usage:
- Used to manage the chat interface, handle user input, and display messages and responses.

---

## Conclusion

Each class in the project plays a crucial role in the functionality of the interactive chat application. The `CRequest` class handles server communication, while the `RequestData` and `ResponseData` classes manage the processing of prompts and responses. The `CSettings` class allows users to configure the chat, and the `FilesList` class manages file interactions. The `Message` class creates and displays chat messages, and the `ChatList` class ties everything together, managing the chat logic and user interactions.