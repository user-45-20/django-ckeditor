(function () {
	var NAME = "audio_upload";

	CKEDITOR.plugins.add(NAME, {
		lang: ['en'],

		isSupportedEnvironment: function(editor) {
			return (
				!!editor.config.filebrowserUploadAudioUrl &&
				!!editor.config.filebrowserBrowseAudiosUrl
			);
		},

		init: function (editor) {
			if (!this.isSupportedEnvironment(editor)) {
				return;
			}

			var lang = editor.lang[NAME];

			var dialogName = NAME + "_dialog";
			CKEDITOR.dialog.add(dialogName, this.path + 'dialogs/' + NAME + '.js');

			editor.addCommand(NAME, new CKEDITOR.dialogCommand(dialogName, {
				allowedContent: 'audio[src,controls]'
			}));
			editor.ui.addButton(NAME, {
				label: lang.toolbar,
				command: NAME,
				icon: this.path + 'images/icon-audio.png'
			});
		},
	});


	var en = {
		toolbar: 'Audio',
		dialogTitle: 'Insert audio',
		uploadButton: "Upload file",
		url: "URL",
		noFileChosen: "Please specify an audio file – upload a new one or choose an existing one.",
		hintUploadOrChoose: "You can either <strong>upload</strong> a new audio file or " +
		"<strong>choose an existing one</strong> on the server.",
		chooseExistingLabel: "Choose existing",
		uploadLabel: "Upload",
		choiceAlternative: "OR",
	};

	// v3
	if (CKEDITOR.skins) {
		en = {
			[NAME]: en
		};
	}

	CKEDITOR.plugins.setLang(NAME, 'en', en);

})();
