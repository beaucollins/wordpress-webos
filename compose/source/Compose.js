 enyo.kind({
  name:'wp.Compose',
  kind:'Control',
  published:{
    showSettings:false,
    account:null
  },
  currentMediaFile : null,
  components:[
	{	name: "uploadMediaFile", 
		kind: "WebService", 
		method: "POST", 
    	handleAs:'text',
    	contentType:'text/xml',
    	onSuccess: "onUploadMediaFileSuccess", 
    	onFailure: "onUploadMediaFileFailure",
    },
    {name: "canvasUsedToUploadTheImage", kind: "ImgUploadCanvas", onImageLoaded:"sendFile"},	
    { name:'desktop', className:'desktop', components:[
      {name:'filePicker', kind: "FilePicker", fileType:["image"], allowMultiSelect:false, onPickFile: "handleResult"},
      {name: "errorDialog", kind: "Dialog", components: [
	     {name:"errorMessage", style: "padding: 12px", content: ""},
	     {kind: "Button", caption: "Close", onclick: "closeDialog"}
      ]},
      { name:'composer', className:'composer', kind:'VFlexBox', components:[
        { kind:'enyo.Header', components:[
          { content:'New Post', flex:1 },
         // {kind: "Button", caption: "Show FilePicker", onclick: "showFilePicker"},
          { name:'uploadButton', kind:'enyo.ActivityButton', caption:'New Media', onclick:'uploadMedia' },
          { name:'previewButton', kind:'enyo.Button', caption:'Preview', onclick:'showPreview' },
		  { name:'postButton', kind:'enyo.Button', toggling:true, caption:'Publish', onclick:'savePost' }
        ] },		
        { kind:'HFlexBox', flex:1, components:[
		{ name:'settings', kind:'VFlexBox', width:'300px', style:'background:#EEE;', showing:false, components:[
            { kind:'Scroller', flex:1, components:[
              { kind:'Item', components:[
                { kind:'Drawer', caption:'Status', open:false, components:[
                  { content:'Draft' },
                  { content:'Pending Review' },
                  { content:'Published' },
				  { content:'Private' }
                ] }
              ]},
              { kind:'Item', components:[
                { kind:'Drawer', caption:'Categories', open:false, components:[
                  { content:'One' },
                  { content:'Two' },
                  { content:'Three' }
                ] }
              ]},
			{ kind:'Item', components:[
                { kind:'Drawer', open:false, caption:'Tags', components:[
                  { kind:'Input', hint:'Separate tags with commas', inputType:'text' }
                ] }
              ] },
			{ kind:'Item', components:[
                { kind:'Drawer', open:false, caption:'Password', components:[
                  { kind:'Input', hint:'Password', inputType:'password' }
                ] }
              ] },
			{ kind:'Item', components:[
				{ kind:'Drawer', open:false, caption:'Publish Date', components:[
					{kind: "DatePicker", label: "Date", onChange: "pickerPick"}
				] }
            ]},
			{ kind:'Item', components:[
                { kind:'Drawer', open:false, caption:'Publish Time', components:[
                  {kind: "TimePicker", label: "Time", onChange: "pickerPick"}
                ] }
              ] },
			] }
          ]},
          { name:'main', kind:'VFlexBox', flex:1, components:[
            { name: 'titleField', kind:'enyo.Input', className:'enyo-item', hint:'Title' },
			{ name: 'contentWrapper', kind:'VFlexBox', flex:1, components:[
			{ kind:'Scroller', flex:1, components:[
          	{ kind: "HtmlContent", srcId: "tinyMCE", onLinkClick: "htmlContentLinkClick"},
          	] },
	        { name:'advanced', kind:'enyo.Button', toggling:true, caption:'Settings', onclick:'toggleSettings' }
			] },
		  ] }
        ]}
      ] }
    ] }
  ],
  create:function(){
    this.inherited(arguments);
    mediaFiles = new Array();
  },
  windowParamsChangeHandler: function() {
	 if(typeof(enyo.windowParams.account) != "undefined") {
		  this.account = enyo.windowParams.account;
		  console.log("new account set on the compose view");
	 } else {
		 this.account = null;
		  console.log("no account set on the compose view");
	 }
  },
  toggleSettings:function(sender){
    this.$.composer.addRemoveClass('expanded-mode', sender.depressed);
    this.setShowSettings(sender.depressed);
  },
  showSettingsChanged:function(){
    this.$.settings.setShowing(this.showSettings);
  },
  formatBtnClick:function(sender){
	if (sender.name == 'boldButton') {
		//this.$.boldButton.depressed = true;		
	}
  },
  keyTapped: function() {
	console.log('tap!');
  },
  showPreview:function() {
	  //launches a new window with the preview view
	  params = {'title' : this.$.titleField.value, 'content' : tinyMCE.get('txtEntry').getContent()};
	  options = {};
	  enyo.mixin(params, options);
	  enyo.windows.activate("Post Preview", "../postPreview.html", params);
  },
  //Handles the download image
  uploadMedia: function() {  
	  if(this.account == null) {
		  alert("Please select an account on the main view");
		  return;
	  }  
	  this.$.uploadButton.setActive(true);
	  this.$.uploadButton.setDisabled(true);
	  //The image attempting to be loaded is already on the device - an image reference returned by the file picker
	  //the file picker doesn't work on emulator/browser. it works on a real device.
	  
	  //The onPickFile event fires with a response from the file picker if/when the user chooses a file. 
	  //The response object is an array of objects indicating chosen files: [ { fullPath: // Absolute File Path. iconPath: // Absolute File Path with ExtractFS prefix. attachmentType: // File Type (image, document, audio, video) size: // File Size in Bytes. }, { ... }, ... ]
	  var newMediaObj = new MediaObject();
	  newMediaObj.setLocalURL('http://www.megabri.com/wp-content/uploads/2011/05/oktop.jpg');
	  currentMediaFile = newMediaObj;
	  this.$.canvasUsedToUploadTheImage.loadImage(newMediaObj.getLocalURL());
  }, 
  sendFile: function(sender, fileInfo) {
	  console.log("sendFile");
	  
	  if(fileInfo.error == true) {
		  this.$.uploadButton.setActive(false);
		  this.$.uploadButton.setDisabled(false);
		  return; //something went wrong while reading and encoding the file from memory
	  }
	  
	  var newMediaObj = currentMediaFile; 
	  newMediaObj.setHeight(fileInfo.height);
	  newMediaObj.setWidth(fileInfo.width);
	  newMediaObj.setFileName(fileInfo.fileName);
	  newMediaObj.setMimeType(fileInfo.fileType);
	  console.log("the media obj updated:");
	  console.log(newMediaObj);
	 
	  //  console.log("data encoded using Base64: "+ base64EncodedString);
	   var postdata = "<?xml version=\"1.0\"?>"
		+ "<methodCall><methodName>metaWeblog.newMediaObject</methodName>"
		+ "<params><param><value><string>1</string></value></param>"
		+ "<param><value><string>"+this.account.username+"</string></value></param>"
		+ "<param><value><string>"+ this.account.password+"</string></value></param>"
		+ "<param><value><struct>"
		+ "<member><name>type</name><value><string>"+newMediaObj.getMimeType()+"</string></value></member>"
		+ "<member><name>name</name><value><string>"+newMediaObj.getFileName()+"</string></value></member>"
		+ "<member><name>bits</name><value><base64>"
	    + fileInfo.encodedData
	    + "</base64></value></member></struct></value></param></params></methodCall>";
	  // console.log("the xml-rpc request = " + postdata);
	   this.$.uploadMediaFile.url =  this.account.xmlrpc;
	   this.$.uploadMediaFile.call({},postdata);
  },
  onUploadMediaFileSuccess: function(inSender, inResponse) {
	 // this.$.postResponse.setContent(inResponse);
	  this.$.uploadButton.setActive(false);
	  this.$.uploadButton.setDisabled(false);
	  console.log("upload success response text= " + inResponse);
	  var parser = new XMLRPCParser(inResponse);
	  var response = parser.toObject();
	  console.log(response);
	  
	  if(parser.fault) {
		  console.log("parser error");
	  } else {
		  currentMediaFile.setRemoteURL(response.url); //TODO check for shortcode here
		  var mediaHTML = currentMediaFile.getMediaHTML();
	  	  //this.$.contentField.setValue(this.$.contentField.getValue() + mediaHTML);
		  tinyMCE.get('txtEntry').setContent( tinyMCE.get('txtEntry').getContent() + mediaHTML );
	  }
	  
	  this.$.errorMessage.setContent('Img uploaded');
	  this.$.errorDialog.open();
	  currentMediaFile = null;
  },
  onUploadMediaFileFailure: function(inSender, inResponse) {
	  this.$.uploadButton.setActive(false);
	  this.$.uploadButton.setDisabled(false);
	  //this.$.postResponse.setContent(inResponse);
	  console.log("upload failure response = " + inResponse);
	  this.$.errorMessage.setContent('Something went wrong, please try later!');
	  this.$.errorDialog.open();
	  currentMediaFile = null;
  },
  showFilePicker: function(inSender, inEvent) {
	  this.$.filePicker.pickFile();
  },
  handleResult: function(inSender, msg) {
	  this.$.selectedFiles.setContent("Selected Files : "+enyo.json.stringify(msg));
  },
	//close the error dialog
  closeDialog: function() {
		this.$.errorDialog.close();
	},
});
 
 enyo.kind({
	 name: "MediaObject",
	 kind: enyo.Object, 
	 // declare 'published' properties
	 published: {
		 remoteURL : null,
		 localURL  : null, 
		 shortcode : null,
		 fileName  : null,
		 mimeType  : null,
		 width     : null,
		 height    : null,
		 remoteStatusNumber : 0,
		 progress : 0,
	 },
	 getMediaHTML : function() {
		 return "<br /><a href="+ this.remoteURL+"><img src="+  this.remoteURL+" class=\"alignnone size-full\" /></a>";
	 },
	 // these methods will be automatically generated:
	 //  getMyValue: function() ...
	 //  setMyValue: function(inValue) ...
	 /* optional method that is fired whenever setMyValue is called
	    myValueChanged: function(inOldValue) {
	        this.delta = this.myValue - inOldValue;
	    }*/
 }); 

 