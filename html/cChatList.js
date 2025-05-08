/**
 * Main chat list class that handles:
 * - Message management
 * - File list operations
 * - Chat settings and configuration
 */
class ChatList {
	constructor() {
		this.messages = [];
		this.chatContent = document.querySelector('.chat_content');
		this.chatMessageInput = document.querySelector('.chat_message_input');
		this.chatPathInput = document.querySelector('.chat_path_input');
		this.settingsButton = document.querySelector('.settings_button');
		this.settingsPopup = document.querySelector('.settings_popup');
		this.closeButton = document.querySelector('#settings_popup .close_button');
		this.submitBtn = document.querySelector('.submit_btn');
		this.prefixText = document.querySelector('.prefix_text');
		this.clearContext = document.querySelector('.clear_context');
		this.improvePrompt = document.querySelector('.edit_button');
		this.pWr = document.querySelector('.p_wr');
		this.recordButton = document.querySelector('.record_btn');
		this.indexFilesBtn = document.querySelector('.index_files_btn');
		this.includeFilesBtn = document.querySelector('.include_files_btn');
		this.includeCloseBtn = document.querySelector('#includes_popup .close_button');
		this.mediaRecorder = null;
		this.audioChunks = [];
		this.requestInProgress = false;

		this.cRequest = new CRequest(this);
		this.filesList = new FilesList(this);
		this.settings = new CSettings(this);
		this.userInputHandler = new UserInputHandler(this);
		this.recordingManager = new RecordingManager(this);
		this.useDescriptions = document.querySelector('.use_descriptions');
		this.preparePlan = document.querySelector('.prepare_plan');
		this.checkAnswer = document.querySelector('.check_answer'); // New checkbox reference

		window.addEventListener('error', e => this.handleError(lang.errMsg, e));

		this.userInputHandler.setupEventListeners();
	}

	scrollToMessage(mesEl) {
		if (mesEl) {
			mesEl.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
		}
	}

	closeSettings() {
		this.settingsPopup.style.display = 'none';
		this.chatMessageInput.focus();
	}

	handleError(message, error = null) {
		const errorMessage = message + (error ? error.message : '');
		console.error(errorMessage);
		oPb.showSmMsg(lang.errMsg + errorMessage, 'error_msg', 5000);
		this.enableChatInput();
	}

	resetChatData() {
		this.messages = [];
		this.chatMessageInput.value = '';
		this.requestInProgress = false;
	}

	disableChatInput() {
		this.chatMessageInput.disabled = true;
		this.submitBtn.disabled = true;
	}

	enableChatInput() {
		this.chatMessageInput.disabled = false;
		this.submitBtn.disabled = false;
	}

	handleConfirmClick(btn, file, data) {
		btn.classList.add('active');
		const codeWrap = btn.parentElement;
		const hash = btn.dataset.id;
		this.cRequest.sendRequest('/saveFileContent', {
			path: this.filesList.projectPath,
			file_name: file.name,
			file_path: file.path,
			data: replaceTabWithFourSpaces(unescapeHtml(data))
		}, true)
			.then(response => {
				console.log(response);
			})
			.catch(error => this.handleError(lang.errFc, error));
	}

	handleCancelClick(btn, redactor, blockId, data, hash) {
		const codeWrap = getOneSelector(`#${blockId}`);
		codeWrap.remove();

		const models = redactor.getModel();
		const originalModel = models.original;
		const modifiedModel = models.modified;

		redactor.setModel({
			original: null,
			modified: null,
		});

		if (originalModel) {
			originalModel.dispose();
		}
		if (modifiedModel) {
			modifiedModel.dispose();
		}

		redactor.dispose(); // Уничтожаем редактор
		redactor = null;	// Удаляем ссылку
		delete data[hash];
	}

	async sendMessage(promptType = null) {
		if (!this.chatMessageInput.value) {
			this.handleError(lang.noTextSelected);
			return;
		}

		const msg = new Message('mid' + Date.now(), {
			className: 'user_message',
			data: await ResponseData.create(this, { data: {answer: this.chatMessageInput.value}}),
			author: 'user',
			chat: this,
			type: 'user_message'
		});
		msg.html.appendTo(this.chatContent);
		// msg.replaceMarkdownData();
		this.messages.push(msg);
		this.scrollToMessage(msg.html);

		const promptData = {
			prompt: this.chatMessageInput.value,
			prompt_prefix: this.prefixText.value ? this.prefixText.value + '\n\n' : '',
			clear_input: this.clearContext.checked,
			files_list: this.filesList.userFiles,
			use_descriptions: this.useDescriptions.checked,
			prepare_plan: this.preparePlan.checked,
			check_answer: this.checkAnswer.checked,
			image_file: null
		};

		this.cRequest.sendRequest(promptType === 'prompt_improve' ? '/sendImprovePrompt' : '/sendPrompt', promptData)
			.then(async response => {
				const msg = new Message('mid' + Date.now(), {
					className: 'model_response',
					data: await ResponseData.create(this, response),
					author: 'model',
					chat: this,
					type: promptType || 'prompt_w_files'
				});
				msg.html.appendTo(this.chatContent);
				msg.constructFiles();
				// msg.replaceParsedData();
				// msg.replaceUnknownData();
				// msg.replaceMarkdownData();
				this.messages.push(msg);
				this.chatMessageInput.value = '';
				this.scrollToMessage(msg.html);
			})
			.catch(error => this.handleError(lang.errFc, error));
	}

	indexProjectFiles() {
		const projectPath = this.chatPathInput.value;
		if (!projectPath) {
			this.handleError(lang.noPathProvided);
			return;
		}

		this.cRequest.sendRequest('/parseProjectFiles', {
			path: projectPath,
			exclude_dirs: this.filesList.excludedList // Ensure excludedList is included here
		})
			.then(response => console.log(response))
			.catch(error => this.handleError(lang.errFc, error));
	}

	includeFiles() {
		this.filesList.loadIncludesPopup();
	}
}