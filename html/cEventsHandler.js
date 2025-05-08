/**
 * Handles all user input events and UI interactions:
 * - Path input changes
 * - Message input handling
 * - File list navigation
 * - Recording management
 */
class UserInputHandler {
	constructor(chatList) {
		this.chatList = chatList;
	}

	setupEventListeners() {
		this.chatList.chatPathInput.addEventListener('change', e => {
			this.chatList.filesList.setPath(e.target.value);
		});

		this.chatList.chatPathInput.addEventListener('keyup', e => {
			if (e.key === 'Enter') {
				this.chatList.filesList.setPath(e.target.value);
				this.chatList.closeSettings();
			}
		});

		this.chatList.chatMessageInput.addEventListener('keyup', async e => {
			if (e.key === 'Escape') {
				this.chatList.filesList.closeFileListPopup();
			}
			if (e.key === '/') {
				const inputValue = e.target.value;
				if (inputValue.includes('./')) {
					this.chatList.filesList.getFilesList();
				}
				if (inputValue.includes('../')) {
					this.chatList.filesList.goToParentDirectory();
					this.chatList.filesList.getFilesList();
				}
			}
			if (e.key === 'Enter' && e.ctrlKey) {
				await this.chatList.sendMessage();
			}
			if (e.key === 'w' && e.ctrlKey) {
				this.selectCurrentWord(this.chatList.chatMessageInput);
			}
		});

		this.chatList.submitBtn.addEventListener('click', async e => {
			e.preventDefault();
			e.stopPropagation();
			await this.chatList.sendMessage();
		});

		this.chatList.settingsButton.addEventListener('click', () => {
			this.chatList.settingsPopup.style.display = 'block';
		});

		this.chatList.closeButton.addEventListener('click', () => {
			this.chatList.closeSettings();
		});

		this.chatList.pWr.addEventListener('click', e => {
			if (this.chatList.settingsPopup.style.display !== 'none') {
				this.chatList.closeSettings();
			}
		});

		this.chatList.improvePrompt.addEventListener('click', async e => {
			await this.chatList.sendMessage('prompt_improve');
		});

		this.chatList.recordButton.addEventListener('mousedown', () => {
			this.chatList.recordButton.addClass('recording');
			navigator.mediaDevices.getUserMedia({ audio: true })
				.then(stream => {
					this.chatList.mediaRecorder = new MediaRecorder(stream);
					this.chatList.mediaRecorder.ondataavailable = event => {
						this.chatList.audioChunks.push(event.data);
					};
					this.chatList.mediaRecorder.start();
				})
				.catch(err => console.error('Error accessing microphone:', err));
		});

		this.chatList.recordButton.addEventListener('mouseup', () => {
			this.chatList.recordingManager.handleRecordButtonRelease();
		});

		this.chatList.recordButton.addEventListener('mouseleave', () => {
			this.chatList.recordingManager.handleRecordButtonRelease();
		});

		this.chatList.indexFilesBtn.addEventListener('click', () => {
			this.chatList.indexProjectFiles();
		});

		this.chatList.includeFilesBtn.addEventListener('click', () => {
			this.chatList.includeFiles();
		});

		this.chatList.includeCloseBtn.addEventListener('click', () => {
			this.chatList.filesList.closeIncludesPopup();
		});

		// // Event listener for screenshot button
		// this.chatList.screenshotBtn.addEventListener('click', async (e) => {
		// 	try {
		// 		const clipboardItems = await navigator.clipboard.read();
		// 		for (const item of clipboardItems) {
		// 			const imageType = item.types.find(type => type.startsWith('image/'));
		// 			if (imageType) {
		// 				const blob = await item.getType(imageType);
		// 				const reader = new FileReader();
		// 				reader.onload = () => {
		// 					this.chatList.currentImage = reader.result;
		// 					oPb.showSmMsg("Скриншот загружен!", 'success_msg', 2000);
		// 				};
		// 				reader.readAsDataURL(blob);
		// 				return;
		// 			}
		// 		}
		// 		oPb.showSmMsg("В буфере нет изображения", 'warning_msg', 2000);
		// 	} catch (error) {
		// 		this.chatList.handleError("Ошибка при вставке: " + error.message);
		// 	}
		// });
	}

	selectCurrentWord(textarea) {
		const caretPos = textarea.selectionStart;
		const text = textarea.value;
		const left = text.slice(0, caretPos).match(/\b\w*$/);
		const right = text.slice(caretPos).match(/^\w*/);
		const word = left[0] + right[0];
		if (word) {
			textarea.setSelectionRange(caretPos - left[0].length, caretPos + right[0].length);
		}
	}
}