(function () {
	var NAME = "audio_upload";

	function setProgress(progressElem, progress) {
		progressElem.setHtml(progress);
	}

	function makeComputer(dialog) {
		return function() {
			var fileLoader = dialog.fileLoader;
			var progress = Math.floor((fileLoader.uploaded / fileLoader.uploadTotal) * 100);
			if (Number.isNaN(progress)) {
				return;
			}
			setProgress(dialog.progressElem, progress + "%");
		};
	}

	// Return function to clean up after upload completed (successfully or not)
	function makeCleanup(dialog, progressText, listeners) {
		return function() {
			setProgress(dialog.progressElem, progressText);
			listeners.forEach(function (listener) {
				listener.removeListener();
			});
			dialog.fileLoader = null;
		};
	}

	CKEDITOR.dialog.add(NAME + "_dialog", function (editor) {
		var lang = editor.lang[NAME];

		return {
			title: lang.dialogTitle,
			minWidth: 400,
			minHeight: 200,

			onShow: function () {
				// Progress related listeners
				var dialog = this;
				
				var progressElem = dialog.getElement().getDocument().getById("audioUploadProgress");
				dialog.progressElem = progressElem;
				// Clear previous runs, if any
				setProgress(progressElem, "");

				this.uploadStartListener = editor.on("fileUploadRequest", function(evt) {
					setProgress(progressElem, "0%");
					
					var listeners = [];
					var fileLoader = evt.data.fileLoader;
					dialog.fileLoader = fileLoader;

					listeners.push(fileLoader.on("update", makeComputer(dialog)));
					// In these cases we want to clear the listeners list, makeSetter() will
					// do that for us
					// On error, clear the percentage
					listeners.push(fileLoader.on("abort", makeCleanup(dialog, "", listeners)));
					listeners.push(fileLoader.on("error", makeCleanup(dialog, "", listeners)));
					// After a successful upload, let people know it's done
					listeners.push(fileLoader.on("uploaded", makeCleanup(dialog, "OK", listeners)));
				});
			},

			onHide: function() {
				this.uploadStartListener && this.uploadStartListener.removeListener();
				// NOTE: Because the filebrowser plugin unconditionally binds the 'abort'
				// event of fileLoader to xhrUploadErrorHandler, which does an alert(),
				// this will result in "alert(undefined)". Cannot really be fixed without
				// altering CKEditor source
				this.fileLoader && this.fileLoader.abort();
			},

			onOk: function () {
				var dialog = this;
				var audio = editor.document.createElement('audio');

				audio.setAttribute("src", dialog.getValueOf("mainTab", "txtUrl"));
				audio.setAttribute("controls", true);

				editor.insertElement(audio);
			},

			contents: [{
				id: 'mainTab',
				elements: [{
						type: 'html',
						html: '<p style="font-size: 12px;">' +
						'&#9432; ' + lang.hintUploadOrChoose +
						'</p>',
					},
					_break(),
					{
						type: 'vbox',
						children: [{
								type: 'html',
								html: '<strong>' + lang.uploadLabel + '</strong>'
							},
							{
								type: "hbox",
								widths: ["50%", "35%", "15%"],
								// CKEditor offers no easy way to control vertical alignment
								// in hbox layouts ("align" does something different and useless),
								// so after the elements are loaded, we dynamically set their alignment
								// to be centered
								onLoad: function() {
									try {
										var tbody = this.getElement().getChildren().getItem(0);
										var tr = tbody.getChildren().getItem(0);
										var tds = tr.getChildren();
										for (var i = 0; i < tds.count(); ++i) {
											var td = tds.getItem(i);
											td.setStyles({"vertical-align": "middle"});
										}
									} catch (e) {
										// Do not propagate errors outside this handler
										// or CKEditor may not load the dialog
										console.error(e);
									}
								},
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
											target: 'mainTab:txtUrl',
											url: editor.config.filebrowserUploadAudioUrl
										},
										label: lang.uploadButton,
										'for': ['mainTab', 'upload'],
									},
									{
										type: 'html',
										html: '<span id="audioUploadProgress"></span>',
									}
								],
							},
						]
					},
					_break(),
					{
						type: 'html',
						html: '<strong>' + lang.choiceAlternative + '</strong>'
					},
					_break(),
					{
						type: 'vbox',
						children: [{
								type: 'html',
								html: '<strong>' + lang.chooseExistingLabel + '</strong>'
							},
							{
								type: 'button',
								id: 'browse',
								filebrowser: {
									action: 'Browse',
									target: 'mainTab:txtUrl',
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
