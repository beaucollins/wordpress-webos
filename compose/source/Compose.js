var showWebOsImageFilePickerFunctionBind = null; //this variable is used to show the webOS filePicker when the user tap on the Image btn on the editor toolbar
var showWebOsVideoFilePickerFunctionBind = null;

enyo.kind({
  name:'wp.Compose',
  kind:'Control',
  published:{
    showSettings:false,
    account:null,
	selectionStart:0,
	selectionEnd:0,
	startNode:null,
	endNode:null,
    post:null
  },
  currentMediaFile : null, //@protected
  postCategorieObjs :[true,false,true,false,true,false,true,false,false,false,false],
  components:[
  { name:'client', kind:'wp.WordPressClient', onPasswordReady:'clientReady', onSavePost:'savePostSuccess' },
	{	name: "uploadMediaFile", 
		kind: "WebService", 
		method: "POST", 
    	handleAs:'text',
    	contentType:'text/xml',
    	onSuccess: "onUploadMediaFileSuccess", 
    	onFailure: "onUploadMediaFileFailure",
    },
    {name: "canvasUsedToUploadTheImage", kind: "ImgUploadCanvas", onImageLoaded:"sendFile"},
	{kind: "Dialog", components: [
		{content: "Insert a Link"},
		{kind: "VFlexBox", components: [
			{ kind:'Input', name:'linkURL', hint: 'Link URL', onfocus: 'addHTTPToLink', inputType:'text' },
        	{ kind:'Input', name:'linkName', hint: 'Link name (optional)', inputType:'text' },
			{kind: "Button", name: 'linkOKBtn', caption: "OK", onclick: "linkOKClick"}
		]}
	]},	
    { name:'desktop', className:'desktop', components:[
      {name:'filePicker', kind: "FilePicker", fileType:["image"], allowMultiSelect:false, onPickFile: "handleResult"},
      {name: "errorDialog", kind: "Dialog", components: [
	     {name:"errorMessage", style: "padding: 12px", content: ""},
	     {kind: "Button", caption: "Close", onclick: "closeDialog"}
      ]},
      { name:'composer', className:'composer', kind:'VFlexBox', components:[
        { kind:'enyo.Header', components:[
          { content:'New Post', flex:1 },
          { name:'previewButton', kind:'enyo.Button', caption:'Preview', onclick:'showPreview' },
          { name:'draftButton', kind:'enyo.Button', caption:'Save Draft', onclick:'savePost' },
		  { name:'postButton', kind:'enyo.Button', caption:'Publish', onclick:'savePost' }
        ] },		
        { kind:'HFlexBox', flex:1, components:[
		{ name:'settings', kind:'VFlexBox', width:'300px', style:'background:#EEE;', showing:false, components:[
            { kind:'Scroller', flex:1, components:[
              { kind:'Item', components:[
                {name: 'statusSelector', kind: "ListSelector", label: "Status", value: 1, onChange: "itemChanged", items: [
					{caption: "Publish", value: 1},
					{caption: "Draft", value: 2},
					{caption: "Pending Review", value: 3},
					{caption: "Private", value: 4},
				]}
              ]},
              {kind: "DividerDrawer", caption: "Categories", open: false, components: [
				{name:'categoriesVirtualRepeterField', kind: "VirtualRepeater", onGetItem: "getCategoryItem", components: [
					{kind: "Item", layoutKind: "HFlexLayout", components: [
						{name: "categoryCheckbox", kind: "CheckBox", checked: false, onChange: "categoryCheckboxClicked"},
						{name: "categoryLabel", content: "Get kids to school"}
					]}
                ]}                                                                                       
	    	  ]},
			{ kind:'Item', components:[
                { kind:'Drawer', open:false, caption:'Tags', components:[
                  { kind:'Input', name:'tagsField', hint:'Separate tags with commas', inputType:'text' }
                ] }
              ] },
			{ kind:'Item', components:[
                { kind:'Drawer', open:false, caption:'Password', components:[
                  { name: 'passwordField', kind:'Input', hint:'Password', inputType:'password' }
                ] }
              ] },
			{ kind:'Item', components:[
				{ kind:'Drawer', open:false, caption:'Publish Date', components:[
					{kind: "DatePicker", label: "Date", onChange: "pickerPick"},
					{kind: "TimePicker", label: "Time", onChange: "pickerPick"}
				] }
            ]}
			] }
          ]},
          { name:'main', kind:'VFlexBox', flex:1, components:[
            { name: 'titleField', kind:'enyo.Input', className:'enyo-item', hint:'Title' },
			{ name: 'contentWrapper', kind:'VFlexBox', flex:1, components:[
			{ name:'uploadButton', kind:'enyo.ActivityButton', caption:'Upload Test', onclick:'uploadMedia' },
			{ kind: "HtmlContent", srcId: "toolbarButtons", onLinkClick: "htmlContentLinkClick"},
			{ name: 'contentScroller', kind:'Scroller', autoHorizontal: false, horizontal: false, flex:1, components:[
			{ name: 'contentField', kind: 'enyo.RichText' },
			]},
	        { name:'advanced', kind:'enyo.Button', toggling:true, caption:'Settings', onclick:'toggleSettings' },
			] },
		  ] }
        ]}
      ] }
    ] }
  ],
  create:function(){
    this.inherited(arguments);
    mediaFiles = new Array();
    this.accountChanged();
    showWebOsImageFilePickerFunctionBind = enyo.bind(this, "showImageFilePicker"); //js clousure. showWebOsImageFilePickerFunctionBind is declared globally and is used to access a function inside this obj
    showWebOsVideoFilePickerFunctionBind = enyo.bind(this, "showVideoFilePicker");
	formatBtnClickFunctionBind = enyo.bind(this, "formatBtnClick");
	linkBtnClickFunctionBind = enyo.bind(this, "linkHelper");
  },
  windowParamsChangeHandler: function(inSender, inEvent) {
	 var p = inEvent.params;
	 if(typeof(p.account) != "undefined") {
		  this.account = p.account;
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
  formatBtnClick:function(type){
	
	if (type == 'indent') {
		var el = document.getElementById('blockquoteButton');
		var curClass = el.className;
		if (curClass.search('btnActive') > -1) {
			console.log('made it here ' + el.className);
			document.execCommand('outdent', false, null);
		}
		else {
			document.execCommand(type, false, null);
		}
		
	}
	else {
		document.execCommand(type, false, null);
	}
	
  },
  linkHelper:function(){
	//get the cursor position for l8r
	var selObj = window.getSelection();
	var selRange = selObj.getRangeAt(0);
	selectionStart = selRange.startOffset;
	selectionEnd = selRange.endOffset;
	startNode = selRange.startContainer;
	endNode = selRange.endContainer;
	
	console.log('start: ' + selectionStart + ' selection end: ' + selectionEnd);
	
	this.$.dialog.open();

  },
  addHTTPToLink:function(){
	if (this.$.linkURL.getValue() == '') {
		this.$.linkURL.setValue('http://');
	}
  },
  linkOKClick:function(){
		// close dialog
		this.$.dialog.close();
		
		// process confirmation
		var url = this.$.linkURL.getValue();
		var linkName = this.$.linkName.getValue();
		compose_contentField_input
		var inputElement = document.getElementById('compose_contentField_input');
		range = document.createRange();
		range.selectNodeContents(inputElement);
		range.setStart(startNode, selectionStart);
		range.setEnd(endNode, selectionEnd);
		selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		
		if (url != '' && url != 'http://') {
			if (linkName != '') {
				document.execCommand('inserthtml', false, '<a href="' + url + '">' + linkName + '</a>');
			}
			else {
				document.execCommand('createlink', false, url);
			}
		}
		
  },
  getCategoryItem: function(inSender, inIndex) {
	  if (inIndex < this.postCategorieObjs.length) {
		  this.$.categoryCheckbox.setChecked(this.postCategorieObjs[inIndex]);
		  this.$.categoryLabel.setContent("category " + inIndex);
		  return true;
	  } 
  },
  categoryCheckboxClicked: function(inSender) {
	  var index = this.$.categoriesVirtualRepeterField.fetchRowIndex();
	  this.log("The user clicked on item number: " + index);
	  //this.log(inSender);
	  this.postCategorieObjs[index] = inSender.getChecked();
	  this.log(this.postCategorieObjs);
  },
  savePost:function(inSender){
    // if the composer was given a post model, we'll just use that
    // otherwise let's instantiate a new post
    var post = this.post ? this.post : new enyo.application.models.Post();
    
    // set up the post object
    post.title = this.$.titleField.getValue();
    post.description = this.$.contentField.getValue();

	var statusIndex = this.$.statusSelector.getValue();
	var status = 'publish';
	if (statusIndex == 2)
		status = 'draft';
	else if (statusIndex == 3)
		status = 'pending'
	else if (statusIndex == 4)
		status = 'private';
		
	post.post_status = status;

	var tags = this.$.tagsField.getValue()
	if (tags != '')
		post.mt_keywords = tags;
		
	var postPassword = this.$.passwordField.getValue();
	if (postPassword != '')
		post.wp_password = postPassword;
    
	if (inSender.name == 'postButton') {
		// save the post via the client
	    this.$.client.savePost(post);
	}
	else {
		// save the post as a local draft
		this.$.client.saveDraft(post);
	}
  },
  savePostSuccess:function(sender, post, account){
    enyo.windows.addBannerMessage("Post saved successfully", "{}");
    console.log("Post was saved", post, account);
  },
  saveDraftSuccess:function(sender, post, account){
    console.log("Draft was saved", post, account);
  },
  showPreview:function() {
	  var categories = new Array();
	  for(var i = 0; i< this.postCategorieObjs.length; i++) {
		  if( this.postCategorieObjs[i] == true)
			  categories.push("category-"+i);
	  }
	  
	  //launches a new window with the preview view
	  params = {'title' : this.$.titleField.getValue(), 'content' :  this.$.contentField.getValue(), 
			  'tags': this.$.tagsField.getValue(), 'categories': categories};
	  options = {};
	  enyo.mixin(params, options);
	  enyo.windows.activate("Post Preview", "../wordpress/postPreview.html", params);
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
  showImageFilePicker: function(inSender, inEvent) {
	 alert("Hey baby, the Image File Picker doesn't work.");
	 //this.$.filePicker.fileType=["image"];
	 //  this.$.filePicker.pickFile();
  },
  showVideoFilePicker: function(inSender, inEvent) {
	 alert("Hey baby, the Video File Picker doesn't work.");
	 //this.$.filePicker.fileType=["video"];
	//  this.$.filePicker.pickFile();
  },
  handleResult: function(inSender, msg) {
	  //TODO: call the upload function here
	  //this.$.selectedFiles.setContent("Selected Files : "+enyo.json.stringify(msg));
  },
	//close the error dialog
  closeDialog: function() {
		this.$.errorDialog.close();
	},
	accountChanged:function(){
	  console.log("Client:", this.account);
	  this.$.client.setAccount(this.account);
	},
	clientReady:function(sender){
	  //password has been set from the Key Manager now
	  console.log("Client is ready");
	}
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

 