/**
 * IconGen
 *
 * @version    0.1
 * @author     Hiroshi Hoaki <rewish.org@gmail.com>
 * @copyright  (c) 2012 Rewish
 * @license    http://rewish.org/license/mit The MIT License
 * @link       http://rewish.github.com/IconGen/
 */
;(function(window) {
	var IconGen,
	    rimage = /image\/\w+/,
	    URL = window.URL || window.webkitURL;

	IconGen = function(canvas, options) {
		if (!(this instanceof IconGen)) {
			return new IconGen(canvas, options);
		}
		this.initialize.apply(this, arguments);
		return this;
	};

	IconGen.isSupport = typeof window.FileReader !== 'undefined';

	IconGen.enable = function() {
		if (!IconGen.isSupport) {
			return;
		}
		var body = document.body,
		    className = body.getAttribute('class');
		className = className.replace(/ig-nojs/g, '');
		if (className === '') {
			body.removeAttribute('class');
		} else {
			body.setAttribute('class', className);
		}
	};

	IconGen.defaultOptions = {
		suffix: '_ig',
		drawSize: 100,
		framePaths: null,
		mimeType: 'image/png',
		onReadFile: null,
		onFileTypeError: null,
		onRenderError: null,
		onRender: null,
		onRendered: null,
		onExit: null
	};

	IconGen.prototype.initialize = function(canvas, options) {
		if (!canvas) {
			throw new Error();
		}

		this.canvas  = canvas;
		this.context = this.canvas.getContext('2d');

		this.setOptions(options);
		this.setupReader();
		this.setupFrames();
	};

	IconGen.prototype.setOptions = function(options) {
		var key;
		if (typeof this.options !== 'object') {
			this.options = {};
			for (key in IconGen.defaultOptions) {
				this.options[key] = IconGen.defaultOptions[key];
			}
		}
		if (typeof options === 'object') {
			for (key in options) {
				this.options[key] = options[key];
			}
		}
	};

	IconGen.prototype.setDrawSize = function(drawSize) {
		this.options.drawSize = drawSize;
	};

	IconGen.prototype.setupReader = function() {
		var self = this;
		this.reader = new FileReader();
		this.reader.onload = function() {
			var image = new Image();
			image.onload = function() {
				self.image = this;
				self.render();
			};
			image.src = self.reader.result;
		};
	};

	IconGen.prototype.setupFrames = function() {
		if (!this.options.framePaths
				|| this.options.framePaths.length === 0) {
			return;
		}

		var framePaths = this.options.framePaths,
		    len = framePaths.length
		    i = 0;

		this.frames = new Array(len);

		for (; i < len; ++i) {
			this.frames[i] = new Image();
			if ('value' in this.options.framePaths[i]) {
				this.frames[i].src = this.options.framePaths[i].value;
			} else {
				this.frames[i].src = this.options.framePaths[i];
			}
		}

		this.frame = this.frames[0];
	};

	IconGen.prototype.readFile = function(file) {
		this.callback('onReadFile', file);

		if (!file || !rimage.test(file.type)) {
			this.callback('onFileTypeError');
			return;
		}
		this.fileName = file.name;
		this.reader.readAsDataURL(file);
	};

	IconGen.prototype.changeFrame = function(index) {
		this.frame = this.frames[index];

		if (this.image) {
			this.render();
		}
	};

	IconGen.prototype.render = function() {
		this.callback('onRender');

		if (!this.image) {
			this.callback('onRenderError');
		}

		var drawSize = this.options.drawSize,
		    drawInfo = this.getDrawInfo();

		this.canvas.width  = drawSize;
		this.canvas.height = drawSize;

		this.context.clearRect(0, 0, drawSize, drawSize);
		this.context.drawImage(this.image, drawInfo.x, drawInfo.y, drawInfo.width, drawInfo.height);

		if (this.frame) {
			this.context.drawImage(this.frame, 0, 0, drawSize, drawSize);
		}

		this.callback('onRendered', drawInfo);
	};

	IconGen.prototype.getDrawInfo = function() {
		var drawSize = this.options.drawSize,
			drawInfo = {
				width: drawSize,
				height: drawSize,
				x: 0,
				y: 0,
				scale: 0
			};

		if (this.image.width > this.image.height) {
			drawInfo.scale = drawSize / this.image.width;
		} else if (this.image.height > this.image.width) {
			drawInfo.scale = drawSize / this.image.height;
		}

		if (drawInfo.scale) {
			drawInfo.width  = Math.round(this.image.width * drawInfo.scale);
			drawInfo.height = Math.round(this.image.height * drawInfo.scale);
		}

		drawInfo.x = (drawSize - drawInfo.width) / 2;
		drawInfo.y = (drawSize - drawInfo.height) / 2;

		return drawInfo;
	};

	IconGen.prototype.getFileURL = function() {
		var dataURL = this.canvas.toDataURL(this.options.mimeType);
		if (URL && dataURLtoBlob) {
			return URL.createObjectURL(dataURLtoBlob(dataURL));
		}
		return dataURL;
	};

	IconGen.prototype.getFileName = function() {
		return this.fileName.replace(/\.\w+$/, this.options.suffix + '$&');
	};

	IconGen.prototype.exit = function() {
		this.image = null;
		this.callback('onExit');
	};

	IconGen.prototype.callback = function(name) {
		var fn = this.options[name],
		    args = [],
		    len = arguments.length,
			i = 1;

		for (; i < len; ++i) {
			args[args.length] = arguments[i];
		}

		if (fn && typeof fn === 'function') {
			fn.apply(this, args);
		}
	};

	window.IconGen = IconGen;
}(this));