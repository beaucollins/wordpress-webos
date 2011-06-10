enyo.kind({
  name:'WordPressLaunch',
  kind:'enyo.Control',
  components:[
    { kind:'PalmService', service:'palm://com.palm.power/timeout/', onFailure:'genericFailure', components:[
      { name:'setTimer', method:'set', onSuccess:'storeTimerKey', onSuccess:'timeoutSet' },
      { name:'clearTimer', method:'clear' }
    ] },
    { kind:'Comment'},
    { name:'palmAppOpener', kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'open' },
  ],
  create:function(){
    this.inherited(arguments);
    this.draftCount = 0 ;
  },
  startup:function(){
    var launcher = this;
    enyo.application.accountManager = new AccountManager();
    enyo.application.commentDashboard = this.createComponent({kind:'CommentDashboard', onTapComment:'displayComment'});
    
    this.scheduleTimer();
    
    var paramString = window.PalmSystem && PalmSystem.launchParams || "{}";
		var params = enyo.json.parse(paramString);	 
		enyo.application.accountManager.loadAccounts(function(){
		  launcher.relaunch(params);
		});
		
  },
  relaunch:function(params){
    if (params.action == 'checkComments') {
      this.checkForComments();
      return;
    }
    this.openWordPress();
  },
  openWordPress:function(params){
    var basePath = enyo.fetchAppRootPath();
    enyo.windows.activate(basePath + 'wordpress/index.html', 'wordpress', params);
  },
  openComposer:function(account, post){
    var wordpress = enyo.windows.fetchWindow('wordpress');
    var label = "post-" + post.id;
    var params = {
      wasLaunchedBy: wordpress,
      account: account.id,
      post: post.id
    }
    enyo.windows.activate("./compose/index.html", label, params);
  },
  openComposerWithNewItem:function(account, type){	
	var wordpress = enyo.windows.fetchWindow('wordpress');
    console.log("Launching the composer view new Item of the type: ", type);
    var label = "draft-" + this.draftCount;
    this.draftCount ++;
    var params = {
      wasLaunchedBy: wordpress,
      account: account.id,
      type: type
    }
    enyo.windows.activate("./compose/index.html", label, params);
  },
  scheduleTimer:function(){
    this.$.setTimer.call({
      'key':'org.wordpress.webos.comment_timer',
      'in':'00:10:00', // 10 minutes, 5 minutes is the minimum and 24 hours is the maximum
      'uri':'palm://com.palm.applicationManager/launch',
      'params': enyo.json.stringify({
        'id':'org.wordpress.webos',
        'params' : { 'action' : 'checkComments' }
      })
    })
  },
  timeoutSet:function(sender, response, request){
    console.log("Timeout is set: " + enyo.json.stringify(response));
  },
  genericFailure:function(sender, response){
    console.log("Error" + enyo.json.stringify(response));
  },
  checkForComments:function(){
    var windows = enyo.windows.getWindows();
    if (this.clients) {
      enyo.forEach(this.clients, function(client){
        client.destroy();
      });
    };
    this.clients = [];
    enyo.forEach(enyo.application.accountManager.accounts, function(account){
      // make a client and fire off the download requests, somehow we need to check if the wordpress
      // card is open and notify it when we've completed our updates
      var client = this.createComponent({
        kind:'wp.WordPressClient',
        account:account,
        onPasswordReady:'downloadComments',
        onPendingComments:'notifyPendingComments'
      });
      this.clients.push(client);
    }, this);
    this.scheduleTimer();
  },
  downloadComments:function(client){
    console.log("Download comments");
    client.downloadComments();
  },
  notifyPendingComments:function(sender){
    var wordpress = enyo.windows.fetchWindow('wordpress');
    if (wordpress) {
      // tell it we have updated comments
      console.log("Update your comment counts!");
      enyo.windows.setWindowParams(wordpress, {'action':'refreshComments'});
    };
  },
  draftSaved:function(){
    var wordpress = enyo.windows.fetchWindow('wordpress');
    if (wordpress) {
      // tell it we have updated comments
      enyo.windows.setWindowParams(wordpress, {'action':'refreshDrafts'});
    };
  },
  displayComment:function(sender, comment, account){
    console.log("Open to the comment!");
    this.openWordPress({action:'showComment', comment_id:comment.id, account_id:account.id});
  },
  readTheFAQ:function(){
    //we're launching a browser window instead of staying in app
    this.$.palmAppOpener.call({target:'http://ios.wordpress.org/faq/'});
  },
  sendEmailToSupport:function(){
    this.$.palmAppOpener.call({
    	id: "com.palm.app.email",
        params: {
            summary: "WordPress for webOS Help Request",
            text: $L("Hello, \n (Write here the URL of your blog and the error message.)"),
            recipients: [{
                type:"email",
                role:1,
                value:"support@wordpress.com",
                contactDisplay:"WordPress for webOS"
            }]
        }
    });
  },
});