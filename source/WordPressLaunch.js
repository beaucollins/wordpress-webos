enyo.kind({
  name:'WordPressLaunch',
  kind:'enyo.Control',
  components:[
    { kind:'PalmService', service:'palm://com.palm.power/timeout/', onFailure:'genericFailure', components:[
      { name:'setTimer', method:'set', onSuccess:'storeTimerKey', onSuccess:'timeoutSet' },
      { name:'clearTimer', method:'clear' }
    ] },
    { kind:'Comment'}
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
		var params = enyo.json.from(paramString);
    
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
    enyo.windows.activate('wordpress', basePath + 'wordpress/index.html', params);
  },
  openComposer:function(account, post){
    var label = "post-" + post.id;
    var params = {
      account: account.id,
      post: post.id
    }
    enyo.windows.activate(label, "./compose/index.html", params);
  },
  openComposerWithNewItem:function(account, type){
    console.log("launching the composer view with new ", type);
    var label = "draft-" + this.draftCount;
    this.draftCount ++;
    var params = {
      account: account.id,
      type: type
    }
    enyo.windows.activate(label, "./compose/index.html", params);
  },
  scheduleTimer:function(){
    this.$.setTimer.call({
      'key':'org.wordpress.webos.comment_timer',
      'in':'00:10:00', // 10 minutes, 5 minutes is the minimum and 24 hours is the maximum
      'uri':'palm://com.palm.applicationManager/launch',
      'params': enyo.json.to({
        'id':'org.wordpress.webos',
        'params' : { 'action' : 'checkComments' }
      })
    })
  },
  timeoutSet:function(sender, response, request){
    console.log("Timeout is set: " + enyo.json.to(response));
  },
  genericFailure:function(sender, response){
    console.log("Error" + enyo.json.to(response));
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
  }
  
});