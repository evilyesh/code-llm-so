/**
 * Manages chat settings configuration:
 * - Loads settings from server
 * - Saves user preferences
 * - Handles settings changes
 */
class CSettings {
	constructor(chat) {
		this.chat = chat;
		this.settingsSelect = document.querySelector('.settings_popup .settings_select');
		this.selectedSettings = null;
		this.configList = [];
		this.cRequest = this.chat.cRequest;

		this.loadSettingsList();
		this.addEventListeners();
	}

	addEventListeners() {
		this.settingsSelect.addEventListener('change', (event) => this.handleSettingsChange(event));
	}

	loadSettingsList() {
		this.cRequest.sendRequest('/getSettingsList')
			.then(data => {
				this.configList = data;
				data.forEach(config => {
					const option = document.createElement('option');
					option.value = config.file_name;
					option.textContent = config.file_name;
					this.settingsSelect.appendChild(option);
				});
				// Automatically select "settings.json" if it's present
				const defaultSettingsIndex = data.findIndex(config => config.file_name === 'settings.json');
				if (defaultSettingsIndex !== -1) {
					this.settingsSelect.value = data[defaultSettingsIndex].file_name;
					this.settingsSelect.selectedIndex = defaultSettingsIndex;
					this.handleSettingsChange({ target: this.settingsSelect });
				} else if (data.length > 0) {
					// If "settings.json" is not found, select the first configuration
					this.settingsSelect.value = data[0].file_name;
					this.settingsSelect.selectedIndex = 0;
					this.handleSettingsChange({ target: this.settingsSelect });
				}
			})
			.catch(error => console.error('Error loading settings list:', error));
	}

	handleSettingsChange(event) {
		const selectedFile = event.target.value;
		this.selectedSettings = this.configList[event.target.selectedIndex];
		this.sendSelectedSettings(selectedFile);
		console.log('Selected settings file:', selectedFile);
		console.log('Selected settings:', this.selectedSettings);
	}

	sendSelectedSettings(selectedSettings) {
		this.cRequest.sendRequest('/setSelectedSettings', { selectedSettings: selectedSettings }, true)
			.then(response => {
				console.log('Selected settings saved on server:', response);
			})
			.catch(error => {
				console.error('Error sending selected settings:', error);
			});
	}
}