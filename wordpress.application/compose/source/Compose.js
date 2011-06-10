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
	isInList:false,
	enterCtr:0,
    post:null
  },
  wasLaunchedBy : null, //reference to the window that opened this composer card
  currentMediaFile : null, //@protected
  accountCategories : null,
  categoriesChanged : false, //true when the user click on categories
  components:[
  { kind:'FilePicker', fileType:'image', onPickFile:'uploadPickedFile' },
  { name:'client', kind:'wp.WordPressClient', onPasswordReady:'clientReady', onUploadComplete:'uploadComplete', onUploadFailed:'uploadFailed',   onNewPost:'savePostSuccess', onUpdatePost:'savePostSuccess',
	  onNewPage:'savePostSuccess', onUpdatePage:'savePostSuccess', onSaveDraft:'saveDraftSuccess', onSaveDraftPage:'saveDraftSuccess'},
	{	name: "uploadMediaFile", 
		kind: "WebService", 
		method: "POST", 
    	handleAs:'text',
    	contentType:'text/xml',
    	onSuccess: "onUploadMediaFileSuccess", 
    	onFailure: "onUploadMediaFileFailure",
    },
    {kind: "ApplicationEvents", onWindowParamsChange: "windowParamsChangeHandler"},
    {name: "canvasUsedToUploadTheImage", kind: "ImgUploadCanvas", onImageLoaded:"sendFile"},
	{kind: "Dialog", components: [
		{content: "Insert a Link"},
		{kind: "VFlexBox", components: [
			{ kind:'Input', name:'linkURL', hint: $L('Link URL'), onfocus: 'addHTTPToLink', inputType:'text' },
        	{ kind:'Input', name:'linkName', hint: $L('Link name (optional)'), inputType:'text' },
			{kind: "Button", name: 'linkOKBtn', caption: $L("OK"), onclick: "linkOKClick"}
		]}
	]},	
    { name:'desktop', className:'desktop', components:[
      {name:'filePicker', kind: "FilePicker", fileType:["image"], allowMultiSelect:false, onPickFile: "handleResult"},
      {name: "errorDialog", kind: "Dialog", components: [
	     {name:"errorMessage", style: "padding: 12px", content: ""},
	     {kind: "Button", caption: $L("Close"), onclick: "closeDialog"}
      ]},
      { name:'composer', className:'composer', kind:'VFlexBox', components:[
        { kind:'enyo.Header', components:[
          { name:'headerLabelField', content:$L('New Post'), flex:1 },
          { name:'attachButton', kind:'enyo.Button', caption:$L('Attach File'), onclick:'uploadTest' },
          { name:'previewButton', kind:'enyo.Button', caption:$L('Preview'), onclick:'showPreview' },
          { name:'draftButton', kind:'enyo.Button', caption:$L('Save Draft'), onclick:'savePost' },
		  { kind: 'Spinner', className: 'wp-compose-spinner' },
		  { name:'postButton', kind:'enyo.Button', caption:$L('Publish'), onclick:'savePost' }
        ] },		
        { kind:'HFlexBox', flex:1, components:[
          { name:'main', kind:'VFlexBox', flex:1, components:[
            { name: 'titleField', kind:'enyo.Input', className:'enyo-item', hint:$L('Title') },
			{ name: 'contentWrapper', kind:'VFlexBox', flex:1, components:[
			//{ name:'uploadButton', kind:'enyo.ActivityButton', caption:'Upload Test', onclick:'uploadMedia' },
			{ kind: "HtmlContent", srcId: "toolbarButtons", onLinkClick: "htmlContentLinkClick"},
			{ name: 'contentScroller', kind:'Scroller', autoHorizontal: false, horizontal: false, flex:1, components:[
			{ name: 'contentField', kind: 'enyo.RichText', changeOnInput: true, onkeypress: 'keyTapped', onchange: "contentFieldTextChange"},
			]},
	        { name:'advanced', kind:'enyo.Button', toggling:true, caption:$L('Settings'), onclick:'toggleSettings' },
			] },
		  ] },
		{ name:'settings', kind:'VFlexBox', width:'300px', style:'background:#EEE;', showing:false, components:[
            { kind:'Scroller', flex:1, components:[
              { kind:'Item', components:[
                {name: 'statusSelector', kind: "ListSelector", label: $L("Status"), value: 1, onChange: "itemChanged", items: [
					{caption: $L("Publish"), value: 1},
					{caption: $L("Draft"), value: 2},
					{caption: $L("Pending Review"), value: 3},
					{caption: $L("Private"), value: 4},
				]}
              ]},
              {kind: "DividerDrawer", caption: $L("Categories"), open: false, components: [
				{name:'categoriesVirtualRepeterField', kind: "VirtualRepeater", onSetupRow: "getCategoryItem", components: [
					{kind: "Item", layoutKind: "HFlexLayout", components: [
						{name: "categoryCheckbox", kind: "CheckBox", checked: false, onChange: "categoryCheckboxClicked"},
						{name: "categoryLabel"}
					]}
                ]}                                                                                       
	    	  ]},
			{ kind:'Item', components:[
                { name:'tagsFieldDrawer', kind:'Drawer', open:false, caption:$L('Tags'), onclick: 'tagsClick', components:[
                  { kind:'Input', name:'tagsField', hint:$L('Separate tags with commas'), inputType:'text' }
                ] }
              ] },
			{ kind:'Item', components:[
                { kind:'Drawer', open:false, caption:$L('Password'), onclick: 'passwordClick', components:[
                  { name: 'passwordField', kind:'Input', hint:$L('Password'), inputType:'password' }
                ] }
              ] },
			{ kind:'Item', components:[
				{ kind:'Drawer', open:false, caption:$L('Publish Date'), components:[
					{kind: "DatePicker", label: $L("Date"), onChange: "datetimePickerPick"},
					{kind: "TimePicker", label: $L("Time"), onChange: "datetimePickerPick"}
				] }
            ]}
			] }
          ]},
        ]}
      ] }
    ] }
  ],
  create:function(){
    this.inherited(arguments);
    mediaFiles = new Array();
    this.accountChanged();
    this.postChanged();
    showWebOsImageFilePickerFunctionBind = enyo.bind(this, "showImageFilePicker"); //js clousure. showWebOsImageFilePickerFunctionBind is declared globally and is used to access a function inside this obj
    showWebOsVideoFilePickerFunctionBind = enyo.bind(this, "showVideoFilePicker");
	formatBtnClickFunctionBind = enyo.bind(this, "formatBtnClick");
	linkBtnClickFunctionBind = enyo.bind(this, "linkHelper");
  },
  isAPost:function() {
		/*  console.log("is a Post type", this.post._type instanceof enyo.application.models.Post );
	  console.log("is a Page type", this.post._type instanceof enyo.application.models.Page );
	  */
	  if (this.post && this.post._type === "Page")
		  return false;
	  else 
		  return true;
  },
  contentFieldTextChange : function(inSender, inEvent) {
	  this.categoriesChanged = true;
  },
  datetimePickerPick: function(inSender) {
	  this.categoriesChanged = true;
	  var referenceDate = this.$.datePicker.getValue();
	  var bTime = this.$.timePicker.getValue();
	  var h = bTime.getHours();
	  var m = bTime.getMinutes();
	  referenceDate.setHours(h);
	  referenceDate.setMinutes(m);
	  this.log("new date", referenceDate.getDate(), referenceDate.toUTCString());	
  },
  postChangedByUser :function(){

	  if(this.categoriesChanged == true)
		  return true;
	  
	  if( this.post.title != this.$.titleField.getValue())
		  return true;

	  var statusIndex = this.$.statusSelector.getValue();
	  var status = 'publish';
	  if (statusIndex == 2)
		  status = 'draft';
	  else if (statusIndex == 3)
		  status = 'pending'
	  else if (statusIndex == 4)
		  status = 'private';
	  
	  var statusVariableName = this.isAPost() ? 'post_status' : 'page_status';
	  if(this.post[statusVariableName] != status)
		  return true;

	  if(this.isAPost() && this.post.mt_keywords != this.$.tagsField.getValue())
		  return true;		

	  if(this.post.wp_password !=  this.$.passwordField.getValue())
		  return true;			

	  return false;  
  },
  keyTapped:function(inSender, inEvent){
	//this keycode nonsense is here because the enyo.RichText field will not insert a new bullet in a list when tapping the enter key.
	if (inEvent.keyCode == 13 && this.isInList) {
		this.setEnterCtr(this.enterCtr + 1);
		if (this.enterCtr == 2) {
			document.execCommand('outdent', false, null);
			this.setEnterCtr(0);
			this.setIsInList(false);
		}
		else {
			document.execCommand('inserthtml', false, '<li>');
		}
		console.log(this.enterCtr);
	}
	else 
	 this.setEnterCtr(0);
},
  toggleSettings:function(sender){
    this.$.composer.addRemoveClass('expanded-mode', sender.depressed);
    this.setShowSettings(sender.depressed);
  },
  showSettingsChanged:function(){
    this.$.settings.setShowing(this.showSettings);
  },
  formatBtnClick:function(type){
	
	if (type == 'insertorderedlist' || type == 'insertunorderedlist') {
		console.log('list: ' + this.isInList);
		this.setIsInList(!this.isInList);
	}
	
	if (type == 'indent') {
		var el = document.getElementById('blockquoteButton');
		var curClass = el.className;
		if (curClass.search('btnActive') > -1) {
			document.execCommand('outdent', false, null);
		}
		else {
			document.execCommand(type, false, null);
		}
		
	}
	else if (type == 'more') {
		document.execCommand('inserthtml', false, '<!--more--><div class="more"></div><br>');
	}
	else {
		document.execCommand(type, false, null);
	}
	
	this.$.contentField.forceFocus();
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
  updateCategoriesField:function(newCategoriesObj) {
	 //console.log("Data for the categories:", newCategoriesObj);	
	 if(newCategoriesObj == null) {
		 this.accountCategories = null; 
		 this.$.categoriesVirtualRepeterField.render();
	 } else {
		 this.accountCategories = newCategoriesObj;
		 this.$.categoriesVirtualRepeterField.render();
	 }
  },
  getCategoryItem: function(inSender, inIndex) {
	  if (this.accountCategories != null && inIndex < this.accountCategories.length) {  
		  var currentCategory = this.accountCategories[inIndex];
		  this.$.categoryLabel.setContent(currentCategory.categoryName);
		  if(this.post && this.post.categories) {
			  for(var i= 0; i < this.post.categories.length; i++) {
				  if(currentCategory.categoryName == this.post.categories[i]) {
					  this.$.categoryCheckbox.setChecked(true);
					  break;
				  }
			  }
		  }
		  return true;
	  } 
  },
  categoryCheckboxClicked: function(inSender) {
	  var index = this.$.categoriesVirtualRepeterField.fetchRowIndex();
	  this.log("The user clicked on category index: " + index);

	  //get the category name
	  var catName = this.accountCategories[index].categoryName;
	  this.log("The user clicked on category name: " + catName);

	  if(this.post.categories == null)
		  this.post.categories = new Array();

	  var checked = inSender.getChecked();

	  if(checked) {
		  this.post.categories.push(catName);
		  this.log("selected the category", catName);
	  } else {		  
		  for(var i= 0; i < this.post.categories.length; i++) {
			  if(catName == this.post.categories[i]) {
				  this.post.categories.splice(i,1);
				  this.log("deselected the category", catName);
				  this.log("new categories array",this.post.categories );
				  break;
			  }
		  }
	  }
	  this.categoriesChanged = true;
  },
  savePost:function(inSender){
    // set up the post object
	this.$.spinner.show();
    this.post.title = this.$.titleField.getValue();
	//get rid of the more div if it's there, only need it on the app side
	var content = this.$.contentField.getHtml();
	content = content.replace('<div class="more"></div><br>', '');
    this.post.description = content;

	var statusIndex = this.$.statusSelector.getValue();
	var status = 'publish';
	if (statusIndex == 2)
		status = 'draft';
	else if (statusIndex == 3)
		status = 'pending'
	else if (statusIndex == 4)
		status = 'private';

	var statusVariableName = this.isAPost() ? 'post_status' : 'page_status';
	this.post[statusVariableName] = status;
	
	if(this.isAPost())
		this.post.mt_keywords = this.$.tagsField.getValue();
			
	var postPassword = this.$.passwordField.getValue();	
	this.post.wp_password = postPassword; //always set the post password otherwise you can't remove post password
	
	var referenceDate = this.$.datePicker.getValue();
	var bTime = this.$.timePicker.getValue();
	var h = bTime.getHours();
	var m = bTime.getMinutes();
	referenceDate.setHours(h);
	referenceDate.setMinutes(m);
	this.log("Item date", referenceDate.getDate(), referenceDate.toUTCString());	
	this.post.date_created_gmt = referenceDate;

	this.log("calling the xmlrpc client...");
	if (inSender.name == 'postButton') {
		// save the post via the client
		if(this.isAPost())
			this.$.client.savePost(this.post);
		else
			this.$.client.savePage(this.post);
	} 
	else {
		if(this.isAPost())
			this.$.client.saveDraft(this.post);
		else
			this.$.client.saveDraftPage(this.post);
	}
  },
  savePostSuccess:function(sender, post, account){
	  this.$.spinner.hide();
	  if(post._type === "Page")
		  enyo.windows.addBannerMessage($L("Page saved successfully"), "{}");
	  else
		  enyo.windows.addBannerMessage($L("Post saved successfully"), "{}");
	 
	  this.log("Item saved", post, account);
	  //sending a notification to the opener window
	  if (this.wasLaunchedBy) { 
		  if(this.isAPost())
			  enyo.windows.setWindowParams(this.wasLaunchedBy, {action: "refreshPosts"});
		  else
			  enyo.windows.setWindowParams(this.wasLaunchedBy, {action: "refreshPages"});
	  }
	  window.close();
  },
  saveDraftSuccess:function(sender, post, account){
    console.log("Draft was saved", post, account);
    
    //sending a notification to the opener window
	if (this.wasLaunchedBy) {
		enyo.windows.setWindowParams(this.wasLaunchedBy, {action: "refreshDrafts"});
	}
      
    window.close(); //to close this window
  },
  showPreview:function() {  
	  var isChangedOrFreshlyCreatedDraft = false;
	  
	  var itemIDName = this.isAPost() ? 'postid' : 'page_id';

	  if(typeof (this.post[itemIDName]) == undefined || this.post[itemIDName] == '') {
		  console.log("this is a new post/page");
		  isChangedOrFreshlyCreatedDraft = true;
	  }
	  	  
	  if(this.postChangedByUser()) {
		  console.log("this post/page changed");
		  isChangedOrFreshlyCreatedDraft = true;
	  }
	  
	  //we can starts the classic preview
	  if(isChangedOrFreshlyCreatedDraft == false) {
		  //launches a new window with the preview view
		  console.log("Launching Preview");
		  params = {'account': this.account, 'post': this.post};
		  enyo.windows.activate("../wordpress/postPreview.html", "Post Preview", params);
		  return;
	  }
	  
	  var categoriesForPreview = new Array();
	  if(this.post && this.post.categories) {
		  categoriesForPreview = this.post.categories;
	  }
	  //launches a new window with the preview view
	  params = {'title' : this.$.titleField.getValue(), 'content' :  this.$.contentField.getValue(), 
			  'tags': this.isAPost() ? this.$.tagsField.getValue() :'', 'categories': categoriesForPreview, 'item_type': this.isAPost() ? 'Post' : 'Page'};
	 // options = {};
	 // enyo.mixin(params, options);
	  enyo.windows.activate("../wordpress/postPreview.html", "Post Preview", params);
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
	  	  this.$.contentField.setValue(this.$.contentField.getValue() + mediaHTML);
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
	  this.$.errorMessage.setContent($L('Sorry, something went wrong, please try again later.'));
	  this.$.errorDialog.open();
	  currentMediaFile = null;
  },
  showImageFilePicker: function(inSender, inEvent) {
	 //alert("Hey baby, the Image File Picker doesn't work.");
	 //this.$.filePicker.fileType=["image"];
	 //  this.$.filePicker.pickFile();
  },
  showVideoFilePicker: function(inSender, inEvent) {
	 //alert("Hey baby, the Video File Picker doesn't work.");
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
	  console.log("Account Changed:", this.account);
	  this.$.client.setAccount(this.account);
	  var that = this;
	  //update the categories field
	  if(this.account != null) {		  
		  this.account.categories
		  .order('categoryName', true)
		  .list(function(categories){
			  that.updateCategoriesField(categories);
		  });
	  } else {
		  that.updateCategoriesField(null); 
	  }
  },
  // this is where fields should be populated with data from the post to be edited
  postChanged:function(){
	  console.log("Post Changed", this.post);
	  if (this.post) {
		  // set up the post object
		  this.$.titleField.setValue(this.post.title);
		  //add the special more div
		  
		  var textMoreVariableName = this.isAPost() ? 'mt_text_more' : 'text_more';
		  if (this.post[textMoreVariableName] != '')
			  this.$.contentField.setValue(this.post.description + '<!--more--><div class="more"></div><br>' + this.post[textMoreVariableName]);
		  else
			  this.$.contentField.setValue(this.post.description);
		  
		  var statusVariableName = this.isAPost() ? 'post_status' : 'page_status';
		  if (this.post[statusVariableName] == 'publish')
			  this.$.statusSelector.setValue(1)
		  else
		  if (this.post[statusVariableName] == 'draft')
			  this.$.statusSelector.setValue(2);
		  else
		  if (this.post[statusVariableName] == 'pending')
			  this.$.statusSelector.setValue(3);
		  else
		  if (this.post[statusVariableName] == 'private')
			  this.$.statusSelector.setValue(4);
		  else
		  this.$.statusSelector.setValue(1); //set the status to publish for new post
		  
		  if (!this.isAPost()) { //this is a page
			  //this.$.tagsField.setValue("");
			  this.$.tagsFieldDrawer.setShowing(false);
		  } else {
			  this.$.tagsField.setValue(this.post.mt_keywords);
		  }
		  
		  this.$.passwordField.setValue(this.post.wp_password);
		  
		  if(this.post.date_created_gmt) {
			  this.$.datePicker.setValue(this.post.date_created_gmt);
			  this.$.timePicker.setValue(this.post.date_created_gmt);
		  }
	  } 
  },
  clientReady:function(sender){
	  //password has been set from the Key Manager now
	  console.log("Compose Client is ready");
  },
  windowParamsChangeHandler: function(inSender, event) {
	this.log("Compose windowParamsChangeHandler");
	this.wasLaunchedBy = event.params.wasLaunchedBy;
	var account_id = event.params.account;
    var post_id = event.params.post; //one between post_id and type should be defined
    var itemType = event.params.type;
    var composer = this;
    
    var load_account = function(){
      enyo.application.models.Account.load(account_id, function(account){
        composer.setAccount(account)
      })
    }
        
    if (post_id) {
      enyo.application.models.Post.load(post_id, function(post){
        console.log("Found a post? ", post);
        if (post) {
          composer.setPost(post);
          post.fetch('account', function(account){
        	  composer.setAccount(account);
          })
        }else{
          load_account();
          composer.setPost(new enyo.application.models.Post({mt_allow_pings:null,mt_allow_comments:null}));
        }
        //upgrade the Header Fields
        composer.$.headerLabelField.setContent(composer.isAPost() ? $L("Edit Post") : $L("Edit Page"));
      });
      
    } else {
      console.log("new item on compose view");
      load_account();
      if(itemType == 'Post') {
    	  console.log("Creating a new Post");
    	  composer.setPost(new enyo.application.models.Post({mt_allow_pings:null,mt_allow_comments:null}));
      } else {
    	  console.log("Creating a new Page");
    	  composer.setPost(new enyo.application.models.Page({mt_allow_pings:null,mt_allow_comments:null}));
      }
    
    //upgrade the Header Fiels
      this.$.headerLabelField.setContent(this.isAPost() ? $L("New Post") : $L("New Page"));
    }
  },
	tagsClick:function(sender){
		this.$.tagsField.forceFocus();
	},
	passwordClick:function(sender){
		this.$.passwordField.forceFocus();
	},
	pickFile:function(sender){
	  this.$.filePicker.pickFile();
	},
	
  // if an upload was successfull
	uploadComplete:function(sender, response){
	  console.log("Upload Complete");
	  console.log(enyo.json.stringify(response));
	},
	
	uploadFailed:function(sender, response){
	  console.log("Upload failed");
	  console.log(enyo.json.stringify(response));
	},
	// files is an array but there's currently only ever one file picked
	uploadPickedFile:function(sender, files){
	  
	  var file = files[0];
    // file has these properties
	  //   {
    //  fullPath: // Absolute File Path.
    //  iconPath: // Absolute File Path with ExtractFS prefix.
    //  attachmentType: // File Type (image, document, audio, video)
    //  size: // File Size in Bytes.
    // }
    
	  
	  this.$.client.uploadFile(file.fullPath);
	},
	uploadTest:function(sender){
	  // we're just going to use one of the wallpapers
	  this.$.client.uploadFile("/media/internal/wallpapers/03.jpg");
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

 