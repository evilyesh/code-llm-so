/**
 * Manages recording functionality:
 * - Handles audio recording start and stop
 * - Sends recorded audio to server for transcription
 */
class RecordingManager {
	constructor(chatList) {
		this.chatList = chatList;
	}

	handleRecordButtonRelease() {
		if (this.chatList.mediaRecorder) {
			this.chatList.mediaRecorder.stop();
			this.chatList.mediaRecorder.onstop = () => {
				const audioBlob = new Blob(this.chatList.audioChunks, { type: 'audio/ogg; codecs=opus' });
				const formData = new FormData();
				formData.append('audio', audioBlob, 'recording.ogg');

				fetch('/recordAudio', {
					method: 'POST',
					body: formData
				})
					.then(response => response.json())
					.then(data => {
						console.log(data);
						this.chatList.chatMessageInput.value += data.transcription;
					})
					.catch(error => console.error('Error sending audio:', error));

				this.chatList.audioChunks = [];
				this.chatList.recordButton.removeClass('recording');
			};
		}
	}
}