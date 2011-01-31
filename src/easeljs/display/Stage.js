/**
* Stage by Grant Skinner. Dec 5, 2010
* Visit www.gskinner.com/blog for documentation, updates and more free code.
*
*
* Copyright (c) 2010 Grant Skinner
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
**/

(function(window) {

/**
* Constructs a Stage object with the specified target canvas.
* @param canvas The canvas the stage will render to.
* @class A stage is the root level Container for a display list. Each time its tick method is called, it will render its display list to its target canvas.
* @augments Container
**/
function Stage(canvas) {
  this.initialize(canvas);
}
var p = Stage.prototype = new Container();

// public properties:
	/** Indicates whether the stage should automatically clear the canvas before each render. You can set this to false to manually control clearing (for generative art, or when pointing multiple stages at the same canvas for example). **/
	p.autoClear = true;
	/** The canvas the stage will render to. Multiple stages can share a single canvas, but you must disable autoClear for all but the first stage that will be ticked (or they will clear each other's render). **/
	p.canvas = null;
	p.mouseX = null;
	p.mouseY = null;
	p.mouseEventsEnabled = false;
	p.onMouseMove = null;
	p.onMouseUp = null;
	p.onMouseDown = null;
	
// private properties:
	/** @private **/
	p._tmpCanvas = null;
	p._activeMouseEvent = null;
	
// constructor:
	/** @private **/
	p.Container_initialize = p.initialize;
	/** @private **/
	p.initialize = function(canvas) {
		this.Container_initialize();
		this.canvas = canvas;
		this.mouseChildren = true;
		
		var o = this;
		if (window.addEventListener) {
			window.addEventListener("mouseup", function(e) { o._handleMouseUp(e); }, false);
		} else if (document.addEventListener) {
			document.addEventListener("mouseup", function(e) { o._handleMouseUp(e); }, false);
		}
		
		canvas.addEventListener("mousemove", function(e) { o._handleMouseMove(e); });
		canvas.addEventListener("mousedown", function(e) { o._handleMouseDown(e); });
	}
	
// public methods:
	/**
	* Each time the update method is called, the stage will tick any descendants exposing a tick method (ex. BitmapSequence) and render its entire display list to the canvas.
	**/
	p.update = function() {
		if (this.canvas == null) { return; }
		var ctx = this.canvas.getContext("2d");
		if (this.autoClear) { this.clear(); }
		this.updateContext(ctx);
		this.draw(ctx);
		this.revertContext();
	}
	
	/**
	* Calls the update method. Useful for adding stage as a listener to Ticker directly.
	**/
	p.tick = p.update;
	
	/**
	* Clears the target canvas. Useful if autoClear is set to false.
	**/
	p.clear = function() {
		if (this.canvas == null) { return; }
		this.canvas.getContext("2d").clearRect(0,0,this.canvas.width,this.canvas.height);
	}
	
	/**
	* Returns an array of all display objects under the specified canvas coordinates that are in this stage's display list. This routine ignores any display objects with mouseEnabled set to false (the default) or that are inside containers with mouseChildren set to false (the default). The array will be sorted in order of visual depth, with the top-most display object at index 0. This uses shape based hit detection, and can be an expensive operation to run, so it is best to use it carefully. For example, if testing for objects under the mouse, test on tick (instead of on mousemove), and only if the mouse's position has changed.
	* @param x The x coordinate to test.
	* @param y The y coordinate to test.
	**/
	p.getObjectsUnderPoint = function(x,y) {
		var arr = [];
		this._getObjectsUnderPoint(x,y,arr);
		return arr;
	}
	
	/**
	* Similar to getObjectsUnderPoint(), but returns only the top-most display object. This runs significantly faster than getObjectsUnderPoint(), but is still an expensive operation. See getObjectsUnderPoint() for more information.
	* @param x The x coordinate to test.
	* @param y The y coordinate to test.
	**/
	p.getObjectUnderPoint = function(x,y) {
		return this._getObjectsUnderPoint(x,y);
	}
	
	/**
	* Returns a data url that contains a Base64 encoded image of the contents of the stage. The returned data url can be 
	* specified as the src value of an image element.
	* @param mimeType The MIME type of the image format to be create. The default is "image/png". If an unknown MIME type
	* is passed in, or if the browser does not support the specified MIME type, the default value will be used.
	* @param backgroundColor The background color to be used for the generated image. The value can be any value HTML color
	* value, including HEX colors, rgb and rgba. The default value is a transparent background.
	* @returns a Base64 encoded image.
	* @type String
	**/	
	p.toImage = function(mimeType, backgroundColor) {
		if(!mimeType) {
			mimeType = "image/png";
		}

		var ctx = this.canvas.getContext('2d');
		var w = this.canvas.width;
		var h = this.canvas.height;

		var data;		

		if(backgroundColor) {
			
			//get the current ImageData for the canvas.
			data = ctx.getImageData(0, 0, w, h);
			
			//store the current globalCompositeOperation
			var compositeOperation = ctx.globalCompositeOperation;

			//set to draw behind current content
			ctx.globalCompositeOperation = "destination-over";

			//set background color
			ctx.fillStyle = backgroundColor;

			//draw background on entire canvas
			ctx.fillRect(0,0,w,h);
		}

		//get the image data from the canvas
		var imageData = this.canvas.toDataURL(mimeType);

		if(backgroundColor) {
			//clear the canvas
			ctx.clearRect (0,0,w,h);

			//restore it with original settings
			ctx.putImageData(data, 0,0);		

			//reset the globalCompositeOperation to what it was
			ctx.globalCompositeOperation = compositeOperation;
		}

		return imageData;
	}
	
	p.clone = function() {
		var o = new Stage(null);
		this.cloneProps(o);
		return o;
	}
		
	p.toString = function() {
		return "[Stage (name="+  this.name +")]";
	}
	
// private methods:
	/** @private **/
	p._Container_getObjectsUnderPoint = p._getObjectsUnderPoint;
	/** @private **/
	p._getObjectsUnderPoint = function(x,y,arr) {
		if (this._tmpCanvas == null) { this._tmpCanvas = document.createElement("canvas"); }
		this._tmpCanvas.width = this.canvas.width;
		this._tmpCanvas.height = this.canvas.height;
		
		var ctx = this._tmpCanvas.getContext("2d");
		
		this.updateContext(ctx,true);
		var results = this._Container_getObjectsUnderPoint(x,y,ctx,arr);
		this.revertContext();
		
		return results;
	}
	
	p._handleMouseMove = function(e) {
		if (!this.canvas) {
			this.mouseX = this.mouseY = null;
			return;
		}
		this.mouseX = e.pageX-this.canvas.offsetLeft;
		this.mouseY = e.pageY-this.canvas.offsetTop;
		
		var evt = new MouseEvent("onMouseMove", this.mouseX, this.mouseY);
		if (this.onMouseMove) { this.onMouseMove(evt); }
		if (this._activeMouseEvent && this._activeMouseEvent.onMouseMove) { this._activeMouseEvent.onMouseMove(evt); }
	}
	
	p._handleMouseUp = function(e) {
		var evt = new MouseEvent("onMouseUp", this.mouseX, this.mouseY);
		if (this.onMouseUp) { this.onMouseUp(evt); }
		if (this._activeMouseEvent && this._activeMouseEvent.onMouseUp) { this._activeMouseEvent.onMouseUp(evt); }
	}
	
	p._handleMouseDown = function(e) {
		if (this.onMouseDown) { this.onMouseDown(new MouseEvent("onMouseDown", this.mouseX, this.mouseY)); }
	}

window.Stage = Stage;
}(window));