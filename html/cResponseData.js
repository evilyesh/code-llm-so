/**
 * Processes server responses and prepares data for chat messages:
 * - Handles file content updates
 * - Parses structured data from responses
 * - Manages unknown data chunks
 */
class ResponseData {
	constructor(chat, response) {
		this.chat = chat;
		this.response = response;
		this.userFiles = chat.filesList.userFiles;
		this.newFiles = {};
		this.parsedData = {};
		this.unknownData = {};
		this.codeData = {};
		this.parsedResponse = '';
		this.type = 'prompt';
		this.thoughts = '';
		this.final_check = false;
	}

	static async create(chat, response) {
		const instance = new ResponseData(
			chat,
			response
		);
		await instance.parseResponse();
		return instance;
	}

	updateUserFilesContent(files_data) {
		for (const fileName in files_data) {
			this.userFiles[fileName].content = files_data[fileName];
		}
	}

	async parseResponse() {
		let data = this.response.data;

		console.log(data);

		if (typeof data === 'undefined' || !data) {
			throw new Error('Data is empty!');
		}

		const answer = data.answer;
		const final_check = data.final_check;

		console.log(data.files);

		let received_files = {};
		if(data.files){
			data.files.forEach(item => {
				received_files[item.path] = item;
			});
		}

		console.log(received_files);


		// data = replaceFourSpacesWithTab(data);
		for (const file of Object.values(this.userFiles)) {
			file.data = '';
			file.reasoning = '';
			file.language = '';
			file.thoughts = '';
			if(received_files[file.relative_path]){
				file.data = received_files[file.relative_path].content
				file.reasoning = received_files[file.relative_path].reasoning
				file.language = received_files[file.relative_path].language
				file.thoughts = received_files[file.relative_path].thoughts
				delete received_files[file.relative_path];
			}
		}

		this.newFiles = received_files;

		// for (const file of Object.values(this.userFiles)) {
		// 	let regex = new RegExp('#\\s*' + escapeRegExp(file.relative_path) + pattern, 'g');
		// 	let match = regex.exec(data);
		//
		// 	if(match){
		// 		const uuid = '---f' + simpleHash(match[2]) + '---';
		// 		this.parsedData[uuid] = { file: file, data: match[2] };
		// 		file.data = match[2];
		// 		data = data.replace(match[0], uuid);
		// 	}
		// }

		if (Object.keys(this.userFiles).length) {
			const filesData = await this.getFilesContent();
			this.updateUserFilesContent(filesData);
		}

		if (this.response.thoughts) {
			this.thoughts = this.response.thoughts;
		}
		if (this.response.final_check) {
			this.final_check = this.response.final_check;
		}

		this.parsedResponse = answer;
		console.log(this);
		console.log(this.parsedResponse);

	}

	async getFilesContent() {
		return await this.chat.cRequest.sendRequest('/getFilesContent', {
			files: this.chat.filesList.userFiles,
			path: this.chat.filesList.projectPath
		}, true);
	}
}