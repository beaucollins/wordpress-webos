
enyo.kind({
  name:'wp.AccountSetup',
  kind:'VFlexBox',
  events:{
    onSelectBlogs:'',
    onCancel:''
  },
  published:{
    cancelable:false
  },
  components:[
    //     {kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", components: [
    //  {kind: "SpinnerLarge"}
    // ]},
    
    { kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'open' },
    { name:'blogFinder', kind:'wp.BlogDiscover', onSuccess:'showBlogList', onFailure:'apiFailure', onBadURL:'badURL' },
    // a place for the WordPress Logo
    { name:'header', kind:'Header', components:[
      { name:'title', flex:1, content:$L('Setup Blog')},
      { kind:'Button', caption:$L('Cancel'), className:'enyo-button-cancel', name:'cancel', onclick:'doCancel' },
      { kind:'Button', caption:$L('Set Up'), className:'enyo-button-blue', name:'finishSetup', onclick:'setupSelectedBlogs', showing:false }
    ] },
    { kind:'Pane', flex:1, components:[
      { name: 'blogTypeChooser', className:'blog-setup-buttons', components:[
        { kind: 'enyo.Button', onclick:"createNewBlog", caption: $L('Start a new blog at WordPress.com') },
        { kind: 'enyo.Button', onclick:"setupHostedBlog", caption: $L('Add blog hosted at WordPress.com') },
        { kind: 'enyo.Button', onclick:"setupBlog", caption: $L('Add self-hosted WordPress blog')}
      ]},
      { name:'setupForm', kind:'wp.AccountCredentials', className:'blog-setup-form', onCancel:'cancelSetup', onSetup:'performSetup' , selfHosted:false },
      { name:'blogList', kind:'wp.BlogSetupList', flex:1, onSelectionChanged:'bloglistSelectionChanged', onSelectBlogs:'notifySelected', onCancel:'cancelSetup' },
      { name: 'helpView', className:'blog-setup-buttons', components:[
          {content: $L("Please visit the FAQ to get answers to common questions. If you're still having trouble, post in the forums.")},
	      { kind: 'enyo.Button', onclick:"readTheFAQ", caption: $L('Read the FAQ') },
	      { kind: 'enyo.Button', onclick:"sendEmail", caption: $L('Send Support E-mail')},
	  ]},
    ]},
	{name: "errorPopup", kind: "Popup", showHideMode: "transition", openClassName: "scaleFadeIn", scrim: true, lazy:false,
		 modal: true, className: "fastAnimate transitioner", width: "400px", components: [
		{name: 'needHelpPane', kind: "wp.NeedHelpPrompt", onNeedHelp: "needHelp", onSubmit: "closePopup"}
	]},
  ],
  create:function(){
    this.inherited(arguments);
    this.cancelableChanged();
  },
  reset:function(){
    this.$.pane.selectView(this.$.blogTypeChooser);
    this.$.setupForm.reset();
    this.$.finishSetup.setShowing(false);
    if (this.$.blogList) this.$.blogList.reset();
  },
  createNewBlog:function(){
    //we're launching a browser window instead of staying in app
    this.$.palmService.call({target:'http://wordpress.com/signup?ref=webos'});
  },
  setupHostedBlog:function(){
    this.$.setupForm.setSelfHosted(false);
    this.$.pane.selectViewByName('setupForm');
  },
  setupBlog:function(){
    this.$.setupForm.setSelfHosted(true);
    this.$.pane.selectViewByName('setupForm');
  },
  cancelSetup:function(){
    this.$.pane.selectView(this.$.blogTypeChooser);
    this.$.setupForm.reset();
    // this.$.blogsPopup.close();
    this.$.blogFinder.cancel();
  },
  performSetup:function(sender){
    // this.$.scrim.show();
    self.username = sender.username;
    self.password = sender.password;
    this.$.blogFinder.discoverBlogs(sender.url, sender.username, sender.password);
  },
  // the blogs have been successfully returned from the API. If there's only one blog
  // then just set it up. Otherwise show the list of blogs to the user and let them
  // choose which blog(s) to set up.
  showBlogList:function(sender, blogs){
    if (blogs.length == 1) {
     if(!enyo.application.accountManager.blogExists(blogs[0]))
    	 this.doSelectBlogs(blogs, this.$.setupForm.username, this.$.setupForm.password);
     else
    	 this.doSelectBlogs(new Array(), this.$.setupForm.username, this.$.setupForm.password);
    }else{
      // this.$.scrim.hide();
      this.$.finishSetup.setShowing(true);
      //filter out existing blogs
      var filtered = new Array;
      for (var i=0; i < blogs.length; i++) {
        if(!enyo.application.accountManager.blogExists(blogs[i])) filtered.push(blogs[i])
      };
      this.$.blogList.setBlogs(filtered);
      this.$.pane.selectView(this.$.blogList);
    }
  },
  bloglistSelectionChanged:function(sender){
    var selected = sender.selectedBlogs();
    this.$.finishSetup.setDisabled((selected.length <= 0));
  },
  setupSelectedBlogs:function(sender){
    var blogs = this.$.blogList.selectedBlogs();
    console.log("Setup blogs", blogs);
    this.doSelectBlogs(blogs, this.$.setupForm.username, this.$.setupForm.password);
  },
  badURL:function(sender){
    this.log("Bad URL message");
    // this.$.scrim.hide();
    this.$.setupForm.toggleSignUpActivity();
  	var errorTitle = $L('Sorry, can\'t log in');
  	var errorMessage = $L('Please insert a valid blog URL and try again.');
  	this.$.needHelpPane.setErrorMessage(errorTitle, errorMessage);
  	this.$.errorPopup.openAtCenter();
  },
  apiFailure:function(sender, request, response){
    this.log('API Failure', request, response);
    // this.$.scrim.hide();
    this.$.setupForm.toggleSignUpActivity();
    
    var errorTitle = 'Error';
    var errorMessage = $L('Sorry, something went wrong. Please, try again.');	 
    if(response && response.faultString && response.faultString.length > 0) {
    	errorMessage = response.faultString;
    }
    //check the error code
    if(response && response.faultCode && response.faultCode == 403) {
    	 this.$.setupForm.updatePassword(this, null, '');
    	 errorTitle = $L('Sorry, can\'t log in');
    	 errorMessage = $L('Please update your credentials and try again.');
    }
    this.$.needHelpPane.setErrorMessage(errorTitle, errorMessage);
    this.$.errorPopup.openAtCenter();
  },
  cancelableChanged:function(){
    if (this.cancelable) {
      this.$.cancel.show();
    }else{
      this.$.cancel.hide();
    }
  },
  closePopup: function(inSender) {
	  this.$.errorPopup.close();
  },
  needHelp: function(inSender) {
	this.closePopup(inSender);
	this.$.pane.selectView(this.$.helpView);
  },
  readTheFAQ:function(){
	  enyo.application.launcher.readTheFAQ();
  },
  sendEmail:function(){
	  enyo.application.launcher.sendEmailToSupport();
  },
});

enyo.kind({
  name:'wp.BlogSetupList',
  kind:'VFlexBox',
  published: {
    blogs:[]
  },
  events: {
    onSelectionChanged:''
  },
  components:[
    { name:'selection', kind:'wp.utils.SelectionList', onChange:'doSelectionChanged' },
    { kind:'VFlexBox', flex:1, className:'setup-screen', components:[
      { name:'scroller', kind:'enyo.Scroller', flex:1, components:[
        { name:'blogs', kind:'VirtualRepeater', flex:1, onSetupRow:'setupBlogRow', components:[
          { kind:'Item', layoutKind:'HFlexLayout', components:[
            { name:'blogName', flex:1, allowHtml:true },
            { kind:'CheckBox', checked:false, onclick:'blogToggled' }
          ]}
        ]},
      ]},
      // { name:'setup_selected', kind:'enyo.Button', caption:'Set Up', onclick:'setupSelected' }
      // { name:'cancel', kind:'enyo.Button', caption:'Cancel', onclick:'doCancel' }
    ]}
  ],
  create:function(){
    this.inherited(arguments);
    this.blogsChanged();
  },
  reset:function(){
    this.setBlogs([])
  },
  setupBlogRow:function(sender, index){
    var blog;
    // index = index % this.blogs.length;
    if (blog = this.blogs[index]) {
      this.count ++;
      var label = blog.blogName;
      if(label == ""){
        label = blog.url.replace(/^[^:]+:\/\//,'').replace(/\/$/,'')
      }
      this.$.blogName.setContent(label);
      return true; //this.count < 50 ? true : false;
    }
  },
  blogToggled:function(sender, event){
    if (sender.checked) {
      this.$.selection.select(event.rowIndex);
    }else{
      this.$.selection.deselect(event.rowIndex);
    }
  },
  blogsChanged:function(){
    this.count = 0;
    this.$.blogs.render();
    this.$.selection.clear();
  },
  selectedBlogs:function(){
    var selected = [];
    enyo.forEach(this.blogs, function(item, index){
      if (this.$.selection.isSelected(index)) {
        selected.push(item);
      };
    }, this);
    return selected;
  }
});

//* Returns the index of the element in _inArray_ that is equivalent (==) to _inElement_, or -1 if no element is found.
enyo.indexOfFix = function(inElement, inArray) {
	for (var i=0, e; i<inArray.length; i++) {
	  e=inArray[i]
		if (e == inElement) {
			return i;
		}
	}
	return -1;
};


enyo.kind({
  name:'wp.utils.SelectionList',
  kind: enyo.Component,
  events:{
    onChange:''
  },
  create:function(){
    this.inherited(arguments);
    this.selection = [];
  },
  select:function(item){
    if (enyo.indexOfFix(item, this.selection) == -1 ) {
      this.selection.push(item);
      this.doChange(this.selection);
    };
  },
  deselect:function(item){
    var index = enyo.indexOfFix(item, this.selection);
    if (index != -1) {
      this.selection.splice(index, 1);
      this.doChange(this.selection);
    };
  },
  clear:function(){
    this.selection = [];
    this.doChange(this.selection);
  },
  isSelected:function(item){
    return enyo.indexOfFix(item, this.selection) > -1;
  }
})

enyo.kind({
  name:'wp.AccountCredentials',
  kind:'Control',
  events: {
    onCancel:'',
    onSetup:'',
    onDelete:''
  },
  published: {
    url:null,
    username:null,
    password:null,
    cancelLabel: $L('Cancel'),
    confirmLabel: $L('Sign Up'),
    selfHosted:false,
    allowDelete:false
  },
  components: [
    { kind:'Control', className:'setup-screen', components:[
      { name:'site', kind:'RowGroup', caption:$L('Site'), components: [
        { name:'url', kind:'Input', autoCapitalize:'lowercase', hint:$L('URL'), changeOnInput:true, onchange:'updateUrl' }
      ] },
      { kind:'RowGroup', caption:'Account', components: [
        { name:'username', kind:'Input', autoCapitalize:'lowercase', hint:$L('Username'), changeOnInput:true, onchange:'updateUsername' },
        { name:'password', kind:'Input', hint:$L('Password'), changeOnInput:true, onchange:'updatePassword', inputType:'password' }
      ]},
      { name:'signup', kind:'enyo.ActivityButton', className:'enyo-gemstone', caption:$L('Sign Up'), onclick:'setupClicked', disabled:true },
      { name:'cancel', kind:'enyo.Button', caption:$L('Cancel'), onclick:'cleanup' },
      { name:'deleteControl', className:'wp-account-delete-control', components:[
        { kind:'Button', className:'enyo-red-button', caption:$L('Remove Blog'), onclick:'doDelete' }
      ]}
    ]}
  ],
  create:function(){
    this.inherited(arguments);
    this.urlChanged();
    this.usernameChanged();
    this.passwordChanged();
    this.selfHostedChanged();
    this.cancelLabelChanged();
    this.confirmLabelChanged();
    this.allowDeleteChanged();
  },
  reset:function(){
    this.setUrl('');
    this.setUsername('');
    this.setPassword('');
    this.$.signup.setActive(false);
  },
  setupClicked:function(){
    this.$.signup.setActive(true);
    this.$.signup.setDisabled(true);
    this.doSetup();
  },
  checkValid:function(){
    var invalid = this.isEmpty(this.$.url.getValue()) ||
                    this.isEmpty(this.$.username.getValue()) ||
                    this.isEmpty(this.$.password.getValue());
    this.$.signup.setActive(false);
    this.$.signup.setDisabled(invalid);
  },
  updateUrl:function(sender, event, url){
    this.url = url;
    this.checkValid();
  },
  updateUsername:function(sender, event, username){
    this.username = username;
    this.checkValid();
  },
  updatePassword:function(sender, event, password){
    this.password = password;
    this.checkValid();
  },
  urlChanged:function(){
    this.$.url.setValue(this.url);
  },
  usernameChanged:function(){
    this.$.username.setValue(this.username);
  },
  passwordChanged:function(){
    this.$.password.setValue(this.password);
  },
  selfHostedChanged:function(){
    if (this.selfHosted) {
      this.setUrl('');
      this.$.site.show();
    }else{
      this.setUrl('https://wordpress.com/xmlrpc.php');
      this.$.site.hide();
    }
  },
  cancelLabelChanged:function(){
    this.$.signup.setCaption(this.confirmLabel);
  },
  confirmLabelChanged:function(){
    this.$.cancel.setCaption(this.cancelLabel);
  },
  allowDeleteChanged:function(){
    this.$.deleteControl[this.allowDelete ? 'show' : 'hide' ]();
  },
  isEmpty:function(value){
    return !value || value && value.trim() == "";
  },
  cleanup:function(){
    this.setUrl("");
    this.setUsername("");
    this.setPassword("")
    this.doCancel();
  },
  toggleSignUpActivity: function(inSender) {
	    var a =  this.$.signup.getActive();
	    this.$.signup.setActive(!a);
	    this.$.signup.setDisabled(a);
	}
});

