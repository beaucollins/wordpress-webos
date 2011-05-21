enyo.kind({
  name:'WordPressLaunch',
  kind:'enyo.Component',
  components:[
    { kind:'PalmService', service:'palm://com.palm.power/timeout/', onFailure:'genericFailure', components:[
      { name:'setTimer', method:'set', onSuccess:'storeTimerKey', onSuccess:'timeoutSet' },
      { name:'clearTimer', method:'clear' }
    ] }
  ],
  create:function(){
    this.inherited(arguments);
    this.draftCount = 0 ;
  },
  startup:function(){
    var launcher = this;
    enyo.application.commentDashboard = new CommentDashboard();
    enyo.application.accountManager = new AccountManager();
    
    this.scheduleTimer();
    
    var paramString = window.PalmSystem && PalmSystem.launchParams || "{}";
		var params = enyo.json.from(paramString);
    
		enyo.application.accountManager.loadAccounts(function(){
		  launcher.relaunch(params);
		});
		
		
		
  },
  relaunch:function(params){
    console.log("Relaunch? " + enyo.json.to(params));
    if (params.action == 'checkComments') {
      console.log("Just check for comments!");
      return;
    }
    this.openWordPress();
  },
  openWordPress:function(){
    var basePath = enyo.fetchAppRootPath();
    console.log("Opening: " + basePath + 'wordpress/index.html' );
    enyo.windows.activate('wordpress', basePath + 'wordpress/index.html');		  
  },
  openDraft:function(params){
    var composeLabel = Math.round(Math.random() * 100); // just for fun
    var label = "draft-" + this.draftCount;
    enyo.windows.activate(label, "./compose/index.html", params);
    this.draftCount ++;
    
  },
  scheduleTimer:function(){
    this.$.setTimer.call({
      'key':'org.wordpress.webos.comment_timer',
      'in':'00:05:00', // 10 minutes, 5 minutes is the minimum and 24 hours is the maximum
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
  }
  
});