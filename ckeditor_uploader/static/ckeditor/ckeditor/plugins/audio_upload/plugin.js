(function () {
	var NAME = "audio_upload";

	CKEDITOR.plugins.add(NAME, {
		lang: ['en'],

		init: function (editor) {
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
	};

	// v3
	if (CKEDITOR.skins) {
		en = {
			[NAME]: en
		};
	}

	CKEDITOR.plugins.setLang(NAME, 'en', en);

})();
