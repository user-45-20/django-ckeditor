(function () {
	var NAME = "video_upload";

	function commitSize(videoElement, styles) {
		var value = this.getValue();

		videoElement.setAttribute(this.id, value);
		styles[this.id] = value + "px";
	}

	function setupValue(videoNode) {
		switch (this.id) {
			case "txtUrl":
				this.setValue(videoNode.getAttribute("src"));
				break;
			case "width":
			case "height":
				var valStr = videoNode.getStyle(this.id);
				var parsed = parseInt(valStr, 10);
				if (valStr.trim().length && !Number.isNaN(parsed)) {
					this.setValue(parsed);
				}
				break;
		}
	}

	function setProgress(progressElem, progress) {
		progressElem.setHtml(progress);
	}

	function makeComputer(progressElem, fileLoader) {
		return function() {
			var progress = Math.floor((fileLoader.uploaded / fileLoader.uploadTotal) * 100);
			if (Number.isNaN(progress)) {
				return;
			}
			setProgress(progressElem, progress + "%");
		};
	}

	// Return function that sets the progress to the specified value
	// and deregisters listeners
	function makeSetter(progressElem, progress, listeners) {
		return function() {
			setProgress(progressElem, progress);
			listeners.forEach(function (listener) {
				listener.removeListener();
			});
		};
	}

	CKEDITOR.dialog.add(NAME + "_dialog", function (editor) {
		var lang = editor.lang[NAME];

		return {
			title: lang.dialogTitle,
			minWidth: 400,
			minHeight: 200,

			onShow: function () {
				var data = this.customData;
				if (data && typeof data.is === "function" && data.is("video")) {
					this.videoElement = data;
					this.setupContent(data);
				}
				
				// Progress related listeners
				var dialog = this;
				
				var progressElem = dialog.getElement().getDocument().getById("videoUploadProgress");
				// Clear previous runs, if any
				setProgress(progressElem, "");

				this.uploadStartListener = editor.on("fileUploadRequest", function(evt) {
					setProgress(progressElem, "0%");
					
					var listeners = [];
					var fileLoader = evt.data.fileLoader;

					listeners.push(fileLoader.on("update", makeComputer(progressElem, fileLoader)));
					// In these cases we want to clear the listeners list, makeSetter() will
					// do that for us
					// On error, clear the percentage
					listeners.push(fileLoader.on("abort", makeSetter(progressElem, "", listeners)));
					listeners.push(fileLoader.on("error", makeSetter(progressElem, "", listeners)));
					// After a successful upload, let people know it's done
					listeners.push(fileLoader.on("uploaded", makeSetter(progressElem, "OK", listeners)));
				});
			},

			onHide: function() {
				this.uploadStartListener && this.uploadStartListener.removeListener();
			},

			onOk: function () {
				var dialog = this;
				var video = this.videoElement || editor.document.createElement('video');

				// Don't cause a reload if nothing changed
				var srcValue = dialog.getValueOf("upload", "txtUrl");
				if (video.getAttribute("src") !== srcValue) {
					video.setAttribute("src", srcValue);
				}
				video.setAttribute("controls", true);
				var width = dialog.getValueOf("upload", "width").trim();
				var widthNum = Number(width);
				var height = dialog.getValueOf("upload", "height").trim();
				var heightNum = Number(height);

				var styles = {};
				var shouldSet = false;
				if (width !== "" && !Number.isNaN(widthNum)) {
					shouldSet = true;
					styles.width = widthNum + "px";
				}
				if (height !== "" && !Number.isNaN(heightNum)) {
					shouldSet = true;
					styles.height = heightNum + "px";
				}
				if (shouldSet) {
					video.setStyles(styles);
				}

				if (!this.videoElement) {
					editor.insertElement(video);
				}
			},

			contents: [{
				id: 'upload',
				elements: [{
						type: 'html',
						html: '<p style="font-size: 12px;">' +
							'&#9432; You can either <strong>upload</strong> a new video file or ' +
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
											input.$.accept = '.mp4';
										},
									},
									{
										type: 'fileButton',
										id: 'uploadButton',
										filebrowser: {
											action: 'QuickUpload',
											target: 'upload:txtUrl',
											url: editor.config.filebrowserUploadVideoUrl,
										},
										label: lang.uploadButton,
										'for': ['upload', 'upload'],
									},
									{
										type: 'html',
										html: '<span id="videoUploadProgress"></span>',
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
									url: editor.config.filebrowserBrowseVideosUrl || editor.config.filebrowserBrowseUrl
								},
								label: editor.lang.common.browseServer
							},
						]
					},
					_break(),
					{
						type: 'vbox',
						children: [{
								type: 'html',
								html: '<h3>Size (optional)</h3>'
							},
							{
								type: 'hbox',
								widths: ['50%', '50%'],
								children: [{
										type: 'text',
										id: 'width',
										label: editor.lang.common.width,
										validate: CKEDITOR.dialog.validate.number(lang.invalidWidth),
										commit: commitSize,
										setup: setupValue,
									},
									{
										type: 'text',
										id: 'height',
										label: editor.lang.common.height,
										validate: CKEDITOR.dialog.validate.number(lang.invalidHeight),
										commit: commitSize,
										setup: setupValue,
									},
								]
							},
						]
					},
					{
						id: 'txtUrl',
						validate: CKEDITOR.dialog.validate.notEmpty(lang.noFileChosen),
						setup: setupValue,
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