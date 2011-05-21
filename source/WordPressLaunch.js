enyo.kind({
  name:'WordPressLaunch',
  kind:'enyo.Object',
  create:function(){
    this.inherited(arguments);
    this.draftCount = 0 ;
  },
  startup:function(){
    var launcher = this;
    enyo.application.commentDashboard = new CommentDashboard();
    enyo.application.accountManager = new AccountManager();
    		
		enyo.application.accountManager.loadAccounts(function(){
      launcher.openWordPress();
		});
		
  },
  relaunch:function(params){
    console.log("Relaunch? " + enyo.json.to(params));
    this.openWordPress();
  },
  openWordPress:function(){
    var basePath = enyo.fetchAppRootPath();
    
    enyo.windows.activate('wordpress', basePath + 'wordpress/index.html');		  
  },
  openDraft:function(params){
    var composeLabel = Math.round(Math.random() * 100); // just for fun
    var label = "draft-" + this.draftCount;
    enyo.windows.activate(label, "./compose/index.html", params);
    this.draftCount ++;
    
  }
});