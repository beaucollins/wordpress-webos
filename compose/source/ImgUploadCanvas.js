enyo.kind({
	name: "ImgUploadCanvas", 
	kind: enyo.Control,
	nodeTag: "canvas",
	domAttributes: { style: "border: 2px solid #000; visibility:hidden" },
	 events: {
		 onImageLoaded:"",
	 },
	
	loadImage: function(imageURL) {
		// Fill in the canvas node property
		this.hasNode();

		var referenceToTheController = this; //this is the reference to the itself
		var canvas = this.node;

		var objImage = new Image();
		objImage.onload = function() {
			console.log("Inside onload");
			console.log("objImage w,h:" + objImage.width + "-" + objImage.height);
			canvas.width = objImage.width;
			canvas.height = objImage.height;
			console.log("canvas w,h" + canvas.width + "," + canvas.height);
			// Copy the image contents to the canvas
			var ctx = canvas.getContext("2d");
			ctx.drawImage(objImage, 0, 0);
			var imageData = canvas.toDataURL(); 
			console.log("img data " +imageData.substring(0,50));
			imageData = imageData.substring(22); 
			console.log("img data " +imageData.substring(0,50));
			referenceToTheController.doImageLoaded(imageData);
		}
		objImage.src = imageURL;
	},
});