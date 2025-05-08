/**
 * Initializes the main chat class.
 * Ensures the chat is ready when the page loads.
 */

oPb.docReady(() => {
	require.config({ paths: { 'vs': '/vendor/microsoft/monako-editor/node_modules/monaco-editor/min/vs' }});
	require(['vs/editor/editor.main'], () => {
		window.MonacoEnvironment = {
			getWorkerUrl: function (moduleId, label) {
				return `${window.location.origin}/vendor/microsoft/monako-editor/node_modules/monaco-editor/min/vs/base/worker/workerMain.js`;
			}
		};
		window.monaco = monaco;
	});

	document.getElementById('loading-animation').style.display = 'none';
	chat = new ChatList();  // for debug
});