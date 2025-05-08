/**
 * Manages file listing functionality:
 * - Displays file tree structure
 * - Handles file selection
 * - Manages included/excluded files
 * - Processes directory navigation
 */
class FilesList {
	constructor(chat) {
		this.chat = chat;
		this.projectPath = null;
		this._currentPath = null;
		this.list = {};
		this.userFiles = {};
		this.cRequest = this.chat.cRequest;
		this.fileListPopup = getOneSelector('.file_list_popup');
		this.fileListPopup._showed = false;
		this.selectedFileIndex = -1;
		this.currentPathLabel = getOneSelector('.current_path_text');
		this.chatMessageInput = getOneSelector('.chat_message_input');
		this.pWr = getOneSelector('.p_wr');
		this.includesPopup = getOneSelector('.includes_popup');
		this.includesPopup._showed = false;
		this.includedList = {};
		this.excludedList = {};
		this.projectRootList = {};

		this.pWr.addEventListener('keydown', e => {
			this.handleFileListPopupKeydown(e);
		});

		Object.defineProperty(this, 'currentPath', {
			get: function() {
				return this._currentPath;
			},
			set: function(value) {
				this._currentPath = value;
				this.showCurrentPath();
			}
		});
	}

	setPath(path) {
		this.projectPath = path;
		this.currentPath = path;
		this.chat.resetChatData();
		this.clearFilesList();
	}

	clearFilesList() {
		this.userFiles = {};
		this.includedList = {};
		this.excludedList = {};
		this.projectRootList = {};
		getOneSelector('.files_list').innerHTML = '';
	}

	showCurrentPath() {
		this.currentPathLabel.setTEXT(this.currentPath);
	}

	addFile(file) {
		if(this.userFiles[file.path]){
			return;
		}
		this.userFiles[file.path] = file;
		this.createFileLabel(file);
	}

	goToParentDirectory() {
		if (this.currentPath !== this.projectPath) {
			const parts = this.currentPath.split('/');
			parts.pop();
			const parentPath = parts.join('/');
			if (parentPath.startsWith(this.projectPath)) {
				this.currentPath = parentPath;
			} else {
				this.currentPath = this.projectPath;
			}
		}
	}

	createFileLabel(file) {
		let dir_section = getOneSelector('.files_list .files_dir[data-dir_path="' + file.relative_path.replace(file.name, '') + '"]');
		if (!dir_section) {
			dir_section = createEl('div');
			dir_section.className = 'files_dir';
			dir_section.dataset.dir_path = file.relative_path.replace(file.name, '');
			const dir_section_label = createEl('div');
			dir_section_label.className = 'dir_section_label';
			dir_section_label.textContent = createShortString(file.relative_path.replace(file.name, ''));
			dir_section.appendChild(dir_section_label);
			getOneSelector('.files_list').appendChild(dir_section);
		}
		const fileLabel = document.createElement('span');
		fileLabel.textContent = file.name;
		fileLabel.className = 'file_label';
		fileLabel.dataset.id = file.path;
		fileLabel.onclick = () => this.removeFileFromUserFiles(file);
		dir_section.appendChild(fileLabel);
	}

	removeFileFromUserFiles(file) {
		const file_element = getOneSelector('.files_list .file_label[data-id="' + file.path + '"]');
		const files_dir_wrapper = getOneSelector('.files_list .files_dir[data-dir_path="' + file.relative_path.replace(file.name, '') + '"]');
		file_element.remove();
		if (files_dir_wrapper.children.length === 1) {
			files_dir_wrapper.remove();
		}
		delete this.userFiles[file.path];
	}

	getFilesList() {
		this.cRequest.sendRequest('/getFilesList', {
			current_path: this.currentPath,
			project_path: this.projectPath
		}, true)
			.then(files => {
				this.list = files;
				this.displayFilesList();
			});
	}

	displayFilesList() {
		this.fileListPopup.innerHTML = '';
		this.selectedFileIndex = -1;
		this.list = this.list.filter(file => !this.excludedList[file.path]);
		this.list.forEach(file => {
			const div = createEl('div')
				.addClass(file.type === 'dir' ? 'directory' : 'file')
				.onClick(() => this.handleFileSelection(file))
				.addData('path', file.path)
				.addData('type', file.type)
				.setTEXT(file.name)
				.appendTo(this.fileListPopup);
		});
		this.showFileListPopup();
	}

	handleFileListPopupKeydown(event) {
		if (!this.fileListPopup._showed) return;

		event.stopPropagation();
		event.preventDefault();
		const fileListItems = this.fileListPopup.getManySelector('div');
		if (fileListItems.length === 0) return;

		if (event.key === 'ArrowUp') {
			if (this.selectedFileIndex > 0) {
				fileListItems[this.selectedFileIndex].removeClass('selected');
				this.selectedFileIndex--;
			} else {
				this.selectedFileIndex = fileListItems.length - 1;
			}
		} else if (event.key === 'ArrowDown') {
			if (this.selectedFileIndex !== -1 && this.selectedFileIndex < fileListItems.length - 1) {
				fileListItems[this.selectedFileIndex].removeClass('selected');
				this.selectedFileIndex++;
			} else {
				this.selectedFileIndex = 0;
			}
		} else if (event.key === 'Enter') {
			this.handleFileSelection(this.list[this.selectedFileIndex]);
		} else if (event.key === 'Escape') {
			this.closeFileListPopup();
		}

		if(typeof fileListItems[this.selectedFileIndex] !== 'undefined'){
			fileListItems[this.selectedFileIndex].addClass('selected');
			fileListItems[this.selectedFileIndex].scrollIntoView();
		}
	}

	handleFileSelection(file) {
		if (file.type === 'dir') {
			this.currentPath = file.path;
			this.getFilesList();
			this.chatMessageInput.value = this.chatMessageInput.value.replace('../', '');
		} else {
			this.addFile(file);
			this.closeFileListPopup();
			this.chatMessageInput.value = this.chatMessageInput.value.replace('./', file.name);
			this.selectText(this.chatMessageInput, file.name);
		}
	}

	closeFileListPopup() {
		this.fileListPopup.style.display = 'none';
		this.fileListPopup._showed = false;
	}

	showFileListPopup() {
		this.fileListPopup.style.display = 'block';
		this.fileListPopup._showed = true;
	}

	selectText(textareaElement, textToSelect) {
		const text = textareaElement.value;
		const startIndex = text.indexOf(textToSelect);

		if (startIndex !== -1) {
			const endIndex = startIndex + textToSelect.length;
			textareaElement.focus();
			textareaElement.setSelectionRange(startIndex, endIndex);
		}
	}

	loadIncludesPopup() {
		this.cRequest.sendRequest('/getFilesList', {
			current_path: this.projectPath,
			project_path: this.projectPath
		}, true)
			.then(files => {
				this.updateProjectRootList(files);
				const includes_list = this.includesPopup.getOneSelector('.includes_list');
				includes_list.innerHTML = '';
				for (const path in this.projectRootList) {
					const file = this.projectRootList[path];
					const div = createEl('div').appendTo(includes_list);

					const checkbox = createEl('input')
						.addData('path', file.path);
					checkbox.type = 'checkbox';
					checkbox.storedObjectFile = file;

					if (this.includedList[file.path]) {
						checkbox.checked = true;
					}

					checkbox.addEventListener('change', () => this.handleCheckboxChange(checkbox, file));

					const label = createEl('label')
						.addClass(file.type === 'dir' ? 'directory' : 'file')
						.setTEXT(file.name)
						.appendTo(div);
					label.prepend(checkbox);
				}
				this.showIncludesPopup();
			});
	}

	handleCheckboxChange(checkbox, file) {
		if (checkbox.checked) {
			if (!this.includedList[file.path]) {
				this.includedList[file.path] = file;
			}
		} else {
			if (this.includedList[file.path]) {
				delete this.includedList[file.path];
			}
		}
		this.excludeFiles();
	}

	excludeFiles() {
		Object.values(this.projectRootList).forEach(file => {
			if(this.includedList[file.path]){
				delete this.excludedList[file.path];
			}else{
				this.excludedList[file.path] = file;
			}
		});
	}

	closeIncludesPopup() {
		this.includesPopup.style.display = 'none';
		this.includesPopup._showed = false;
	}

	showIncludesPopup() {
		this.includesPopup.style.display = 'block';
		this.includesPopup._showed = true;
	}

	updateProjectRootList(files) {
		const newFilesSet = new Set(files.map(file => file.path));
		const currentFilesSet = new Set(Object.keys(this.projectRootList));

		files.forEach(file => {
			if (!currentFilesSet.has(file.path)) {
				this.projectRootList[file.path] = file;
			}
		});

		for (const path in this.projectRootList) {
			if (!newFilesSet.has(path)) {
				delete this.projectRootList[path];
			}
		}
	}
}