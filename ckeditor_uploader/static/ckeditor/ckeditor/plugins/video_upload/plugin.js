(function () {

	var NAME = "video_upload";

	CKEDITOR.plugins.add(NAME, {
		lang: ['en'],

		isSupportedEnvironment: function(editor) {
			return (
				!!editor.config.filebrowserUploadVideoUrl &&
				!!editor.config.filebrowserBrowseVideosUrl
			);
		},

		init: function (editor) {
			if (!this.isSupportedEnvironment(editor)) {
				return;
			}

			var lang = editor.lang[NAME];

			var dialogName = NAME + "_dialog";
			CKEDITOR.dialog.add(dialogName, this.path + 'dialogs/' + NAME + '.js');

			editor.on('contentDom', function () {

				var editable = editor.editable();

				editable.attachListener(editable, 'click', function (evt) {
					var ckDomEvt = evt.data;
					var target = ckDomEvt.getTarget();
					if (target && target.is("video") && (ckDomEvt.getKeystroke() & CKEDITOR.SHIFT)) {
						ckDomEvt.preventDefault();
						editor.execCommand(NAME, target);
					}
				});
			});

			editor.addCommand(NAME, {
				allowedContent: 'video[src,controls]{width,height}',
				exec: function (editor, data) {
					editor.openDialog(dialogName, function (dialog) {
						// Cannot pass custom data to openDialog(), so we do this instead
						// this callback is executed before onShow() in dialog, so the data
						// will be available there
						dialog.customData = data;
					});
				},
				canUndo: false,
				editorFocus: 1,
			});
			editor.ui.addButton(NAME, {
				label: lang.toolbar,
				command: NAME,
				icon: this.path + 'images/icon-video.png'
			});
		},

	}); // plugins.add


	var en = {
		toolbar: 'Video',
		dialogTitle: 'Insert or edit video',
		uploadButton: "Upload file",
		url: "URL",
		noFileChosen: "Please specify a video file – upload a new one or choose an existing one.",
		invalidWidth: "Invalid width value specified",
		invalidHeight: "Invalid height value specified",
		hintUploadOrChoose: "You can either <strong>upload</strong> a new video file or " +
		"<strong>choose an existing one</strong> on the server.",
		chooseExistingLabel: "Choose existing",
		uploadLabel: "Upload",
		sizeLabel: "Size (optional)",
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
