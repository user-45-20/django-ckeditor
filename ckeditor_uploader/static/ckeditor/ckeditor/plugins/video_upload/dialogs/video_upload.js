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
					console.warn(styles);
					video.setStyles(styles);
				}

				if (!this.videoElement) {
					editor.insertElement(video);
				}
			},

			contents: [{
				id: 'upload',
				filebrowser: 'uploadButton',
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
								widths: ["50%", "50%"],
								children: [{
										type: 'file',
										id: 'upload',
										size: 38
									},
									{
										type: 'fileButton',
										id: 'uploadButton',
										filebrowser: 'upload:txtUrl',
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