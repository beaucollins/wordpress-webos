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
			console.log("image loaded");
			console.log("objImage w,h:" + this.width + "-" + this.height);
			canvas.width = this.width;
			canvas.height = this.height;
			console.log("canvas w,h" + canvas.width + "," + canvas.height);
			// Copy the image contents to the canvas
			var ctx = canvas.getContext("2d");
			ctx.drawImage(objImage, 0, 0);
			var imageData = canvas.toDataURL(); 
			console.log("img data " +imageData.substring(0,50));
			
			var mx = imageData.length;   
			var scc= String.fromCharCode;
			var i=0; var j=0; var k=0;
			for (var z = 0; z < mx && z < 50; z++) {
				if ( scc(imageData.charCodeAt(z)) == ':' )
					i = z;
				if ( scc(imageData.charCodeAt(z)) == ';' )
					j = z;
				if ( scc(imageData.charCodeAt(z)) == ',' )
					k = z;
			}
			
			if((i<j) && (j<k)) {
				var mimeType = imageData.substring(i+1,j); 
				console.log("mimeType : " + mimeType);
				imageData = imageData.substring(k+1); 
				console.log("img data : " +imageData.substring(0,50)); 
				
				//calculate the file name
				var fileName = "webos.jpg";
				var myTime = new Date();
				for (var z = 0; z < mimeType.length && z < 50; z++) {
					if ( scc(mimeType.charCodeAt(z)) == '/' ) {
						fileName = myTime.getMilliseconds() + "." + mimeType.substring(z+1);
						console.log("file name : " + fileName);
						break;
					}
				}
				
				var responseObj = {'error': false, 'encodedData': imageData, 'fileType': mimeType, 
						'fileName':fileName, 'height':canvas.height, 'width':canvas.width };
				referenceToTheController.doImageLoaded(responseObj);
			} else {
				var responseObj = {'error': true, 'errorMessage': "Something went wrong! Please, try again later."};
				referenceToTheController.doImageLoaded(responseObj);
			}
		}
		objImage.src = imageURL;
	},
});