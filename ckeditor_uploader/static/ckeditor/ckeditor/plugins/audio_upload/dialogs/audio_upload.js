(function () {
	var NAME = "audio_upload";

	CKEDITOR.dialog.add(NAME + "_dialog", function (editor) {
		var lang = editor.lang[NAME];

		return {
			title: lang.dialogTitle,
			minWidth: 400,
			minHeight: 200,

			onOk: function () {
				var dialog = this;
				var audio = editor.document.createElement('audio');

				audio.setAttribute("src", dialog.getValueOf("upload", "txtUrl"));
				audio.setAttribute("controls", true);

				editor.insertElement(audio);
			},

			contents: [{
				id: 'upload',
				elements: [{
						type: 'html',
						html: '<p style="font-size: 12px;">' +
							'&#9432; You can either <strong>upload</strong> a new audio file or ' +
							'<strong>choose an existing one</strong> on the server.' +
							'</p>',
					},
					_break(),
					{
						type: 'vbox',
						children: [{
								type: 'html',
								html: '<strong>Upload</strong>'
							},
							{
								type: "hbox",
								widths: ["50%", "50%"],
								children: [{
										type: 'file',
										id: 'upload',
										size: 38,
										onClick: function () {
											var input = this.getInputElement();
											input.$.accept = '.mp3,.wav,.ogg,.flac';
										}
									},
									{
										type: 'fileButton',
										id: 'uploadButton',
										filebrowser: {
											action: 'QuickUpload',
											target: 'upload:txtUrl',
											url: editor.config.filebrowserUploadAudioUrl
										},
										label: lang.uploadButton,
										'for': ['upload', 'upload']
									}
								],
							},
						]
					},
					_break(),
					{
						type: 'html',
						html: '<strong>OR</strong>'
					},
					_break(),
					{
						type: 'vbox',
						children: [{
								type: 'html',
								html: '<strong>Choose existing</strong>'
							},
							{
								type: 'button',
								id: 'browse',
								filebrowser: {
									action: 'Browse',
									target: 'upload:txtUrl',
									url: editor.config.filebrowserBrowseAudiosUrl
								},
								label: editor.lang.common.browseServer
							},
						]
					},
					_break(),
					{
						id: 'txtUrl',
						validate: CKEDITOR.dialog.validate.notEmpty(lang.noFileChosen),
						label: lang.url,
						type: 'text',
						style: 'user-select: none',
					},
				]
			}],
		};
	});

	function _break() {
		return {
			type: 'html',
			html: '<p height="50px;"></p>'
		};
	}
})();
