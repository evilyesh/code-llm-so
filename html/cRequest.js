/**
 * Handles HTTP requests to the server:
 * - Sends POST requests
 * - Manages loading states
 * - Processes response errors
 */
class CRequest {
	constructor(chat) {
		this.chat = chat;
		this.path = '';
		this.loadingAnimation = document.querySelector('#loading-animation');
	}

	sendRequest(path, data, hidden = false) {
		const url = path;
		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		};

		this.loadingAnimation.style.display = 'block';
		if (!hidden) {
			this.chat.disableChatInput();
		}

		return fetch(url, options)
			.then(response => {
				if (!response.ok) {
					return response.json().then(errorData => {
						throw new Error(errorData.error || 'Network response was not ok ' + response.statusText);
					});
				}
				return response.json();
			})
			.catch(error => {
				this.loadingAnimation.style.display = 'none';
				if (!hidden) {
					this.chat.enableChatInput();
				}
				this.chat.handleError('There was a problem with the fetch operation:', error);
			})
			.finally(() => {
				this.loadingAnimation.style.display = 'none';
				if (!hidden) {
					this.chat.enableChatInput();
				}
			});
	}
}