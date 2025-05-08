/**
 * Manages chat messages and their content:
 * - Creates message objects
 * - Parses server responses
 * - Renders messages in chat interface
 */
class Message {
	constructor(id = null, {
		className = 'message',
		data = null,
		author = null,
		chat = null,
		clearContext = false,
		autoAnswer = false,
		type = 'string'
	} = {}) {
		this.id = id || 'mid' + Date.now();
		this.className = className;
		this.data = data;
		this.author = author;
		this.html = null;
		this.chat = chat;
		this.type = type;

		this.constructMessageHtml();
	}

	constructMessageHtml() {
		this.html = createEl('div').addClass(this.className);

		if (this.data?.type === 'prompt') {
			this.addCheckResult();
		}

		if (this.data?.thoughts) {
			this.addThoughtsSection();
		}

		this.html.append(nl2br(this.data.parsedResponse));
	}

	addCheckResult() {
		const checkResult = createEl('div').addClass('check-section');
		checkResult.setHTML(`Check result: ${this.data.final_check}`);
		this.html.append(checkResult);
	}

	addThoughtsSection() {
		const thoughtsSection = createEl('div').addClass('thoughts-section');
		const thoughtsToggle = createEl('button').addClass('thoughts-toggle').setTEXT('Show Thoughts');
		const thoughtsContent = createEl('div').addClass('thoughts-content').setHTML(nl2br(this.data.thoughts));
		thoughtsContent.style.display = 'none';

		thoughtsToggle.onClick(e => {
			thoughtsContent.style.display = thoughtsContent.style.display === 'none' ? 'block' : 'none';
			thoughtsToggle.setTEXT(thoughtsContent.style.display === 'block' ? 'Hide Thoughts' : 'Show Thoughts');
		});

		thoughtsSection.append(thoughtsToggle, thoughtsContent);
		this.html.append(thoughtsSection);
	}

	constructFiles() {
		if (this.data?.type === 'prompt') {
			this.handleUserFiles();
			this.handleNewFiles();
		}
	}

	handleUserFiles() {
		if (Object.entries(this.data.userFiles).length) {
			Object.values(this.data.userFiles).forEach(file => this.replaceFileData(file));
		}
	}

	handleNewFiles() {
		if (Object.entries(this.data.newFiles).length) {
			Object.values(this.data.newFiles).forEach(file => this.replaceNewData(file));
		}
	}

	replaceFileData(file) {
		console.log(file);

		const hash = `${file.name} ${Date.now()}`;
		const message_block = this.createMessageBlock(hash, file);

		const code_wrap = createEl('div').addClass('code_wrap').setId(`cw-${hash}`);
		const redactor = this.renderDiff(
			file.content || '',
			file.data || '',
			code_wrap,
			file.code_type || file.language || 'plaintext'
		);

		this.setupConfirmButton(message_block, code_wrap, file, redactor);

		return message_block;
	}

	createMessageBlock(hash, file) {
		const message_block = createEl('div').addClass('message_block');
		const file_text = createEl('div').addClass('file_text').setHTML(`${file.thoughts}<br />${file.reasoning}`);
		const file_name = createEl('div').addClass('file_name').setTEXT(file.relative_path);

		message_block.append(file_name, file_text);
		this.html.append(message_block);

		return message_block;
	}

	setupConfirmButton(message_block, code_wrap, file, redactor) {
		message_block.append(code_wrap);

		const confirm_btn = createEl('button')
			.addClass('confirm')
			.addData('id', `cw-${hash}`)
			.setTEXT('Confirm');

		message_block.append(confirm_btn);

		confirm_btn.onClick(e => {
			this.chat.handleConfirmClick(confirm_btn, file, redactor.getModel().modified.getValue());
		});
	}

	replaceNewData(file) {
		const hash = `${file.path} ${Date.now()}`;
		const message_block = this.createNewMessageBlock(hash, file);

		const code_wrap = createEl('div').addClass('code_wrap').setId(`cw-${hash}`);
		const redactor = this.renderEditor(
			file.content || '',
			code_wrap,
			file.language
		);

		this.setupSaveButton(message_block, code_wrap, file, redactor);

		return message_block;
	}

	createNewMessageBlock(hash, file) {
		const message_block = createEl('div').addClass('message_block');
		const reasoning = createEl('div').addClass('reasoning').setHTML(file.reasoning);

		message_block.append(reasoning);
		this.html.append(message_block);

		return message_block;
	}

	setupSaveButton(message_block, code_wrap, file, redactor) {
		message_block.append(code_wrap);

		const save_as = createEl('button')
			.addClass('save_as')
			.addData('id', `cw-${hash}`)
			.setTEXT('Save as');

		message_block.append(save_as);
		save_as.onClick(e => {
			this.saveEditorDataToFile(redactor.getValue(), `unknown_data_${hash}.txt`);
		});
	}

	replaceMarkdownData() {
		if (this.data?.codeData) {
			Object.entries(this.data.codeData).forEach(([hash, data]) => {
				this.renderMarkdownBlock(hash, data);
			});
		}
	}

	renderMarkdownBlock(hash, data) {
		const message_block = this.html.getOneSelector(`#${hash}`);
		const markdown_wrap = createEl('div').addClass('markdown_wrap');
		const title_wrap = data.file_type 
			? createEl('div').addClass('title_wrap').setTEXT(data.file_type)
			: null;

		const pre_wrap = createEl('pre');
		const code_wrap = createEl('code').setHTML(data.data);

		if (title_wrap) pre_wrap.append(title_wrap);
		pre_wrap.append(code_wrap);
		markdown_wrap.append(pre_wrap);
		message_block.append(markdown_wrap);
	}

	renderDiff(init_text, new_text, element, code_type) {
		const diffEditor = window.monaco.editor.createDiffEditor(element, {
			originalEditable: false,
			readOnly: false,
			theme: 'vs-dark',
			scrollbar: {
				alwaysConsumeMouseWheel: false
			}
		});

		const originalModel = window.monaco.editor.createModel(init_text, code_type);
		const modifiedModel = window.monaco.editor.createModel(new_text, code_type);

		diffEditor.setModel({
			original: originalModel,
			modified: modifiedModel
		});

		return diffEditor;
	}

	renderEditor(text, element, code_type) {
		return window.monaco.editor.create(element, {
			value: text,  
			language: code_type,  
			theme: 'vs-dark',  
			readOnly: false,  
			scrollbar: {
				alwaysConsumeMouseWheel: false  
			}
		});
	}

	saveEditorDataToFile(content, filename) {
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
}
