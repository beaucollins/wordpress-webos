
enyo.kind({
  name:'wp.PreferencesDialog',
  kind:'enyo.Toaster',
  scrim:true,
  events: {
    onDone:'',
    onAddBlog:'',
    onDeleteBlog:'',
    onUpdateBlog:''
  },
  published: {
    accounts: []
  },
  components:[
    { name:'blogFinder', kind:'wp.BlogDiscover', onSuccess:'checkBlogInList', onFailure:'apiFailure', onBadURL:'badURL' },
    { kind:'VFlexBox', className:'enyo-fit', components:[
      { kind:'Header', className:'enyo-toolbar-light', components:[
        { content:$L('Preferences') },
        { flex:1 },
        { kind:'Button', className:'enyo-blue-button', label:$L('Close'), onclick:'doDone' }
      ] },
      { kind:'Pane', flex:1, components:[
        { name:'accountsSettings', kind:"Scroller", flex:1, components:[
          { kind:'Control', className:'wp-preferences-padding', components:[
            { kind:'Group', caption:$L('Accounts'), components:[
              { name:'accountList', kind:'enyo.Repeater', onSetupRow:'getAccount', components:[
                { kind:'HFlexBox', components:[
                  { name:'accountName' }
                ]}
              ]}
            ] }, // Account Group
            { kind:'Button', caption:$L('Add Blog'), onclick:'doAddBlog' }
          ] }
        ] },
        { kind:'Scroller', flex:1, name:'accountFormView', components:[
          { kind:'Control', className:'wp-preferences-padding', components:[
            { name:'accountForm', kind:'wp.AccountCredentials', confirmLabel:$L('Save'), allowDelete:true, selfHosted:true, onCancel:'showList', onDelete:'removeBlog', onSetup:'confirmAccountChanges' }
          ] }
        ] },
        { name: 'helpView', className:'blog-setup-buttons', components:[
            {content: $L("Please visit the FAQ to get answers to common questions. If you're still having trouble, post in the forums.")},
  	      { kind: 'enyo.Button', onclick:"readTheFAQ", caption: $L('Read the FAQ') },
  	      { kind: 'enyo.Button', onclick:"sendEmail", caption: $L('Send Support E-mail')}
  	    ]},
      ] }
    ] },
    {name: "errorPopup", kind: "Popup", showHideMode: "transition", openClassName: "scaleFadeIn", scrim: true, lazy:false,
  		 modal: true, className: "fastAnimate transitioner", width: "400px", components: [
  		{ name: 'needHelpPane', kind: "wp.NeedHelpPrompt", onNeedHelp: "needHelp", onSubmit: "closePopup" }
  	]}
  ],
  confirmAccountChanges:function(sender){
    this.$.blogFinder.discoverBlogs(sender.url, sender.username, sender.password);
  },
  componentsReady:function(){
    this.accountsChanged();
  },
  accountsChanged:function(){
    this.$.accountList.build();
    if(this.$.accountList.hasNode()){
      this.$.accountList.render();
    }
  },
  showList:function(sender){
    this.selectedAccount = null;
    this.$.pane.selectView(this.$.accountsSettings);
  },
  getAccount:function(sender, index){
    var account;
    if (account = this.accounts[index]) {
      return { kind:'wp.AccountPreferenceListItem', className:'enyo-item', account:account, onclick:'showAccountPreferences' };
    };
  },
  showAccountPreferences:function(sender, event){
    this.selectedAccount = sender.account;
    this.$.pane.selectView(this.$.accountFormView);
    this.$.accountForm.setUrl(sender.account.account.url);
    this.$.accountForm.setUsername(sender.account.account.username);
    this.$.accountForm.setPassword(sender.account.password);
  },
  removeBlog:function(sender){
    this.doDeleteBlog(this.selectedAccount);
  },
  reset:function(){
    this.showList();
    this.$.accountForm.reset();
  },
  checkBlogInList:function(sender, blogs){
    var blog;
    var account = this.selectedAccount.account;
    this.selectedAccount.account.username = this.$.accountForm.username;
    this.selectedAccount.setPassword(this.$.accountForm.password);
    this.selectedAccount.account.xmlrpc = blogs[0].xmlrpc;
    this.doUpdateBlog(this.selectedAccount);
  },
  badURL:function(sender){
    this.log("Bad URL message");
    this.$.accountForm.toggleSignUpActivity();
  	var errorTitle = $L('Sorry, can\'t log in');
  	var errorMessage = $L('Please insert a valid blog URL and try again.');
  	this.$.needHelpPane.setErrorMessage(errorTitle, errorMessage);
  	this.$.errorPopup.openAtCenter();
  },
  apiFailure:function(sender, response, success){
    this.log('API Failure', response);
    // this.$.scrim.hide();
    this.$.accountForm.toggleSignUpActivity();
    
    var errorTitle = 'Error';
    var errorMessage = $L('Sorry, something went wrong. Please, try again.');	 
    if(response && response.faultString && response.faultString.length > 0) {
    	errorMessage = response.faultString;
    }
    //check the error code
    if(response && response.faultCode && response.faultCode == 403) {
    	 this.$.accountForm.updatePassword(this, null, '');
    	 errorTitle = $L('Sorry, can\'t log in');
    	 errorMessage = $L('Please update your credentials and try again.');
    }
    this.$.needHelpPane.setErrorMessage(errorTitle, errorMessage);
    this.$.errorPopup.openAtCenter();
  },
  closePopup:function(){
    this.$.errorPopup.close();
  },
  needHelp:function(){
    this.$.errorPopup.close();
    this.$.pane.selectView(this.$.helpView);
  },
  readTheFAQ:function(){
	  enyo.application.launcher.readTheFAQ();
  },
  sendEmail:function(){
	  enyo.application.launcher.sendEmailToSupport();
  }
});

enyo.kind({
  name:'wp.AccountPreferenceListItem',
  kind:'Item',
  layoutKind:'HFlexLayout',
  tapHighlight: true,
  published: {
    account:null
  },
  components: [
    { name:'blogTitle' }
  ],
  create:function(){
    this.inherited(arguments);
    this.accountChanged();
  },
  accountChanged:function(){
    this.$.blogTitle.setContent(this.account.account.displayName());
  }
})

;