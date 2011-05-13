enyo.kind({
  name:'wp.Compose',
  kind:'Control',
  published:{
    showSettings:false,
    account:null
  },
  components:[
	{	name: "uploadMediaFile", 
		kind: "WebService", 
		method: "POST", 
    	handleAs:'text',
    	contentType:'text/xml',
    	onSuccess: "onUploadMediaFileSuccess", 
    	onFailure: "onUploadMediaFileFailure"
    },
    {name: "canvasUsedToUploadTheImage", kind: "ImgUploadCanvas", onImageLoaded:"sendFile"},	
    { name:'desktop', className:'desktop', components:[
      { name:'composer', className:'composer', kind:'VFlexBox', components:[
        { kind:'enyo.Header', components:[
          { content:'New Post', flex:1 },
          { name:'uploadButton', kind:'enyo.ActivityButton', caption:'New Media', onclick:'uploadMedia' },
          { name:'previewButton', kind:'enyo.Button', caption:'Preview', onclick:'showPreview' },
		  { name:'postButton', kind:'enyo.Button', toggling:true, caption:'Publish', onclick:'savePost' }
        ] },		
        { kind:'HFlexBox', flex:1, components:[
          { name:'main', kind:'VFlexBox', flex:1, components:[
            { name: 'titleField', kind:'enyo.Input', className:'enyo-item', hint:'Title' },
			{ name: 'contentWrapper', kind:'VFlexBox', flex:1, components:[
			{ name: 'richTextButtons', kind:'HFlexBox', components:[
				{ name: 'boldButton', className:'wp-formatBtn', toggling:true, kind:'enyo.Button', caption:'<strong>b</strong>', onclick:'formatBtnClick' },
				{ name: 'emButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'<em>i</em>', onclick:'formatBtnClick' },
				{ name: 'linkButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'<u style="color: #21759b">link</u>', onclick:'formatBtnClick' },
				{ name: 'quoteButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'b-quote', onclick:'formatBtnClick' },
				{ name: 'ulButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'ul', onclick:'formatBtnClick' },
				{ name: 'olButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'ol', onclick:'formatBtnClick' },
				{ name: 'liButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'li', onclick:'formatBtnClick' },
				{ name: 'codeButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'code', onclick:'formatBtnClick' },
				{ name: 'moreButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'more', onclick:'formatBtnClick' },		
	          ] },
			{ kind:'Scroller', flex:1, components:[
            { name: 'contentField', kind:'enyo.RichText', flex:1, changeOnInput: true, oninput: 'keyTapped', hint:'Write Here' }
          	] },
	        { name:'advanced', kind:'enyo.Button', toggling:true, caption:'Settings', onclick:'toggleSettings' }
			] },
		  ] },
          { name:'settings', kind:'VFlexBox', width:'300px', style:'background:#EEE;', showing:false, components:[
            { kind:'Scroller', flex:1, components:[
              { kind:'Item', layoutKind:'HFlexLayout', components:[
                { flex:1, content:"Published" },
                { kind:'ToggleButton' }
              ] },
              { kind:'Item', components:[
                { kind:'Drawer', open:false, caption:'Password', components:[
                  { kind:'Input', hint:'Password', inputType:'password' }
                ] }
              ] },
              { kind:'Item', components:[
                { kind:'Drawer', caption:'Categories', open:false, components:[
                  { content:'One' },
                  { content:'Two' },
                  { content:'Three' }
                ] }
              ]}
            ]}
          ]}
        ]}
      ] }
    ] }
  ],
  create:function(){
    this.inherited(arguments);
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
	  params = {'title' : this.$.titleField.value, 'content' : this.$.contentField.value};
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
	  //The image attempting to be loaded is already on the device - an image reference returned by the file picker
	  //the file picker doesn't work on emulator/browser. it works on a real device.
	  
	  // The onPickFile event fires with a response from the file picker if/when the user chooses a file. 
	  //The response object is an array of objects indicating chosen files: [ { fullPath: // Absolute File Path. iconPath: // Absolute File Path with ExtractFS prefix. attachmentType: // File Type (image, document, audio, video) size: // File Size in Bytes. }, { ... }, ... ]
	  var url = 'http://www.megabri.com/wp-content/uploads/2011/05/oktop.jpg';
	  this.$.canvasUsedToUploadTheImage.loadImage(url);
  }, 
  sendFile: function(sender, base64EncodedImg) {
	  console.log("sendFile");
	  
	  if(base64EncodedImg.error == true) {
		  this.$.uploadButton.setActive(false);
		  return; //something went wrong
	  }
	  
	  var mimeType = base64EncodedImg.fileType;
	  var fileName =  base64EncodedImg.fileName;
	//  console.log("data encoded using Base64: "+ base64EncodedString);
	   var postdata = "<?xml version=\"1.0\"?>"
		+ "<methodCall><methodName>metaWeblog.newMediaObject</methodName>"
		+ "<params><param><value><string>1</string></value></param>"
		+ "<param><value><string>"+this.account.username+"</string></value></param>"
		+ "<param><value><string>"+ this.account.password+"</string></value></param>"
		+ "<param><value><struct>"
		+ "<member><name>type</name><value><string>"+mimeType+"</string></value></member>"
		+ "<member><name>name</name><value><string>"+fileName+"</string></value></member>"
		+ "<member><name>bits</name><value><base64>"
	    + base64EncodedImg.encodedData
	    + "</base64></value></member></struct></value></param></params></methodCall>";
	  // console.log("the xml-rpc request = " + postdata);
	   this.$.uploadMediaFile.url =  this.account.xmlrpc;
	   this.$.uploadMediaFile.call({},postdata);
  },
  onUploadMediaFileSuccess: function(inSender, inResponse) {
	 // this.$.postResponse.setContent(inResponse);
	  this.$.uploadButton.setActive(false);
	  console.log("upload success response text= " + inResponse);
	  var parser = new XMLRPCParser(inResponse);
	  var response = parser.toObject();
	  console.log(response);
	  if(parser.fault) {
		  console.log("parser error");
	  
	  } else {
		  var mediaHTML = "<br /><a href="+ response.url+"><img src="+ response.url+" class=\"alignnone size-full\" /></a>";
	  	  this.$.contentField.setValue(this.$.contentField.getValue() + mediaHTML);
	  }
  },
  onUploadMediaFileFailure: function(inSender, inResponse) {
	  this.$.uploadButton.setActive(false);
	  //this.$.postResponse.setContent(inResponse);
	  console.log("upload failure response = " + inResponse);
  },
});