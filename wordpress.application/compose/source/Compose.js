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
  accountCategories : null,
  categoriesChanged : false, //true when the user click on categories
  components:[
  { kind:'FilePicker', fileType:'image', onPickFile:'uploadPickedFile' },
  { name:'wpclient', kind:'wp.WordPressClient', onPasswordReady:'clientReady', onUploadComplete:'uploadComplete', onUploadFailed:'uploadFailed',   onNewPost:'savePostSuccess', onUpdatePost:'savePostSuccess',
	  onNewPage:'savePostSuccess', onUpdatePage:'savePostSuccess', onSaveDraft:'saveDraftSuccess', onSaveDraftPage:'saveDraftSuccess',
      onFailure:'connectionError', onBadURL:'connectionError',},
	{	name: "uploadMediaFile", 
		kind: "WebService",  
		method: "POST", 
    	handleAs:'text',
    	contentType:'text/xml',
    	onSuccess: "onUploadMediaFileSuccess", 
    	onFailure: "onUploadMediaFileFailure",
    },
    {kind: "ApplicationEvents", onWindowParamsChange: "windowParamsChangeHandler"},
	{kind: "Dialog", components: [
		{content: "Insert a Link"},
		{kind: "VFlexBox", components: [
			{ kind:'Input', name:'linkURL', hint: $L('Link URL'), onfocus: 'addHTTPToLink', inputType:'text' },
        	{ kind:'Input', name:'linkName', hint: $L('Link name (optional)'), inputType:'text' },
			{kind: "Button", name: 'linkOKBtn', caption: $L("OK"), onclick: "linkOKClick"}
		]}
	]},	
	//Global errors handling interface components
    {name: "globalErrorPopup", kind: "Popup",  lazy:false, scrim: true, 
    	dismissWithClick:false, modal: true, width: "400px", components: [
		{name: 'globalNeedHelpPane', kind: "wp.NeedHelpPrompt", onNeedHelp: "needHelp", onSubmit: "closeGlobalErrorPopup"}
	]},
    { name: 'globalHelpView', scrim:true, className:'wp-compose-error-detail-dialog ', kind:'enyo.Toaster', components:[
      {content: $L("Please visit the FAQ to get answers to common questions. If you're still having trouble, post in the forums.")},
      { kind: 'enyo.Button', onclick:"readTheFAQ", caption: $L('Read the FAQ') },
      { kind: 'enyo.Button', onclick:"sendEmail", caption: $L('Send Support E-mail')},
    ]},
    //main view
    { name:'desktop', className:'desktop', components:[
      { name:'composer', className:'composer', kind:'VFlexBox', components:[
        { kind:'enyo.Header', components:[
          { name:'headerLabelField', content:$L('New Post'), flex:1 },
          // { name:'attachButton', kind:'enyo.Button', caption:$L('Upload Test'), onclick:'uploadTest' },
          { name:'previewButton', kind:'enyo.Button', caption:$L('Preview'), onclick:'showPreview' },
          { name:'draftButton', kind:'enyo.Button', caption:$L('Save Draft'), onclick:'savePost' },
		  { kind: 'Spinner', className: 'wp-compose-spinner' },
		  { name:'postButton', kind:'enyo.Button', caption:$L('Publish'), onclick:'savePost' }
        ] },		
        { kind:'HFlexBox', flex:1, components:[
          { name:'main', kind:'VFlexBox', flex:1, components:[
            { name: 'titleField', kind:'enyo.Input', className:'enyo-item', hint:$L('Title') },
			{ name: 'contentWrapper', kind:'VFlexBox', flex:1, components:[
			{ kind: "HtmlContent", srcId: "toolbarButtons", onLinkClick: "htmlContentLinkClick"},
			{ name: 'contentScroller', kind:'Scroller', autoHorizontal: false, horizontal: false, flex:1, components:[
			{ name: 'contentField', kind: 'enyo.RichText', changeOnInput: true, onkeypress: 'keyTapped', onchange: "contentFieldTextChange"},
			]},
			{ name:'uploadTray', kind:'enyo.Control' },
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
      ] } //'composer' close tag
    ] }, //'desktop' close tag
  ],
  create:function(){
    this.inherited(arguments);
    this.uploads = new Array();
    mediaFiles = new Array();
    this.accountChanged();
    this.postChanged();
	showWebOsImageFilePickerFunctionBind = enyo.bind(this, "showImageFilePicker");
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
			this.$.wpclient.savePost(this.post);
		else
			this.$.wpclient.savePage(this.post);
	} 
	else {
		if(this.isAPost())
			this.$.wpclient.saveDraft(this.post);
		else
			this.$.wpclient.saveDraftPage(this.post);
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
  accountChanged:function(){
	  this.log("Account Changed:", this.account);
	  this.$.wpclient.setAccount(this.account);
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
  cloneItem:function(item){
	  
	  if(item.local_modifications && item.local_modifications == 'true') {
		  this.log("Item already modified");
		  return item;
	  } 

	  if(item._type === "Post") {
		  this.log("new draft Post stored");
		  var post = item;
		  //make a local copy of the post
		  var p = new enyo.application.models.Post();
		  // clone the post - DO NOT USE for element in post
		  p.postid = post.postid;
		  p.title = post.title;
		  p.categories = post.categories;
		  p.custom_fields = post.custom_fields;
		  p.date_created_gmt = post.date_created_gmt;
		  p.description = post.description;
		  p.link = post.link;
		  p.mt_allow_comments = post.mt_allow_comments;
		  p.mt_allow_pings = post.mt_allow_pings;
		  p.mt_excerpt = post.mt_excerpt;
		  p.mt_keywords = post.mt_keywords;
		  p.mt_text_more = post.mt_text_more;
		  p.permaLink = post.permaLink;
		  p.post_status = post.post_status;
		  p.userid = post.userid;
		  p.wp_author_display_name = post.wp_author_display_name;
		  p.wp_author_id = post.wp_author_id;
		  p.wp_password = post.wp_password;
		  p.wp_post_form = post.wp_post_form;
		  p.wp_slug = post.wp_slug;
		  p.local_modifications = 'true';
		  return p;
	  } else {
		  this.log("new draft Page stored");
		  var page = item;
		  //make a local copy of the page
		  var p = new enyo.application.models.Page();
		  // clone the page - DO NOT USE for element in page
		  p.categories = page.categories;
		  p.custom_fields = page.custom_fields;
		  p.date_created_gmt = page.date_created_gmt;
		  p.dateCreated = page.dateCreated;
		  p.description = page.description;
		  p.excerpt = page.excerpt;
		  p.link = page.link;
		  p.mt_allow_comments = page.mt_allow_comments;
		  p.mt_allow_pings = page.mt_allow_pings;
		  p.page_id = page.page_id;
		  p.page_status = page.page_status;
		  p.permaLink = page.permaLink;
		  p.text_more = page.text_more;
		  p.title = page.title;
		  p.userid = page.userid;		  
		  p.wp_author = page.wp_author;
		  p.wp_author_id = page.wp_author_id;
		  p.wp_page_order = page.wp_page_order;
		  p.wp_page_parent_id = page.wp_page_parent_id;
		  p.wp_page_parent_title = page.wp_page_parent_title;
		  p.wp_page_template = page.wp_page_template;
		  p.wp_password = page.wp_password;
		  p.wp_slug = page.wp_slug;
		  p.local_modifications = 'true';
		  return p;
	  }

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
        composer.setAccount(account);
      })
    }
        
    if (post_id) {
      enyo.application.models.Post.load(post_id, function(post){
        console.log("Found a post? ", post);
        if (post) {
          var p = composer.cloneItem(post); //clone the post obj
          composer.setPost(p);
          post.fetch('account', function(account){
        	  composer.setAccount(account);
          });
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
  showImageFilePicker:function(sender){
	  this.$.filePicker.onPickFile = 'uploadPickedFile';
	  this.$.filePicker.pickFile();
  },
  uploadPickedFile:function(sender, files){
	  this.log("Time to upload the file");
	  this.$.spinner.show();
	  //this.$.attachButton.setDisabled(true);
	  var file = files[0]; // files is an array but there's currently only ever one file picked
	  this.log(enyo.json.stringify(file));

	  /*
		 file has these properties
		   {
		  fullPath: // Absolute File Path.
		  iconPath: // Absolute File Path with ExtractFS prefix.
		  attachmentType: // File Type (image, document, audio, video)
		  size: // File Size in Bytes.
		 }
	   */		

	  var uploadThumb = this.createComponent({kind:'UploadThumbnail', file:file});
	  uploadThumb.setParentNode(this.$.uploadTray.node);
	  this.$.wpclient.uploadFile(file.fullPath);
	  this.log("Sent the file off to the client");
  },
  // if an upload was successfull
  uploadComplete:function(sender, response){
	  this.$.spinner.hide();
	  //this.$.attachButton.setDisabled(false);
	  this.log("Upload Complete");
	  this.log(enyo.json.stringify(response));
	  //{"file":"11.jpg","url":"http://www.eritreo.it/validator/wp-content/uploads/2011/06/11.jpg","type":""}
	  
	  var mediaHTML = "<br /><a href="+ response.url+"><img src="+  response.url+" class=\"alignnone size-full\" /></a>";
	  this.$.contentField.setValue(this.$.contentField.getValue() + mediaHTML );
  },
  uploadFailed:function(sender, response){
	  this.$.spinner.hide();
	  this.$.attachButton.setDisabled(false);
	  this.log("Upload failed");
	  this.log(enyo.json.stringify(response));
	  var errorTitle = 'Error';
	  var errorMessage = $L('Sorry, something went wrong. Please, try again.');	 
	  enyo.windows.addBannerMessage(errorTitle+" - "+errorMessage,"{}");
  },
  uploadTest:function(sender){
	  // we're just going to use one of the wallpapers
	  console.log("upload test");
	  this.uploadPickedFile(sender, [{
		  fullPath: "/media/internal/wallpapers/03.jpg",
		  iconPath: "/media/",
		  attachmentType: 'image'
	  }]);
  },
  connectionError:function(sender, response, request){
	  this.log("connectionError", response, request);

	  if(sender.account) //don't think this check is necessary but better to be safe
	  	var blogName =  sender.account.blogName;
	  var errorTitle = blogName + ' Error';
	  var errorMessage = $L('Sorry, something went wrong. Please, try again.');	 
	  if(response && response.faultString && response.faultString.length > 0) {
		  errorMessage = response.faultString;
	  }

	  this.log("error: ", errorTitle, errorMessage);
	  this.$.spinner.hide();
      this.$.globalNeedHelpPane.setErrorMessage(errorTitle, errorMessage);
	  this.$.globalErrorPopup.openAtCenter();
	//  enyo.windows.addBannerMessage(errorTitle+" - "+errorMessage,"{}");
  },
  closeGlobalErrorPopup: function(inSender) {
	  this.log("closeGlobalErrorPopup: ");
	//  this.isOnErrorPopupShown = false;
	  this.$.globalErrorPopup.close();
	  this.$.globalErrorPopup.close();
  },
  needHelp: function(inSender) {
	  this.$.globalErrorPopup.close();
	 // this.isOnErrorPopupShown = false;
	  this.$.globalHelpView.openAtCenter();
  },
  readTheFAQ:function(){
	  //this.isOnErrorPopupShown = false;
	  enyo.application.launcher.readTheFAQ();
  },
  sendEmail:function(){
	//  this.isOnErrorPopupShown = false;
	  enyo.application.launcher.sendEmailToSupport();
  },
});

enyo.kind({
  name: 'UploadThumbnail',
  kind: enyo.Control,
  published: {
    file: null,
    uploading: false
  },
  components: [
    { kind:'Image' },
    { kind:'Spinner' }
  ],
  ready:function(){
    this.fileChanged();
  },
  fileChanged:function(){
    if(this.file){
      this.$.image.setSrc(this.file.iconPath);
    }
  },
  uploadingChanged:function(){
    if (this.uploading) {
      this.$.spinner.show();
    }else{
      this.$.spinner.hide();
    }
  }
}); 