enyo.kind({
  name: 'wp.Stats',
  kind: 'VFlexBox',
  published: {
    account:null
  },
  components: [
    // { name:'statsService', kind:'StatsService', onApiReady:'statsServiceReady'},
    { name:'statsPasswordManager', kind:'wp.WordPressClient', onPasswordReady:'passwordReady', onPasswordInvalid:'passwordInvalid' },
    { name:'statsWebService', kind:'WebService', handleAs:'html', onSuccess:'loginSuccess', onFailure:'loginFailure'},
    { name:'statsPane', kind:'Pane',flex:1, components:[
      { name:'statsSpinner', kind:'enyo.SpinnerLarge'},
	  { name: 'scroller', kind:'Scroller', flex:1, components:[
      { name:'statsWebView', allowHtml:'true' }
	  ]},
    ]},
	{ kind:'enyo.Toolbar', className:'enyo-toolbar-light', components:[
      { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'},      
      { kind:'Button', name: 'refresh', content:'Refresh', onclick:'refreshStats'}
    ] }
  ],
  create:function(){
    this.inherited(arguments);
    this.$.statsSpinner.show();
  },
  accountChanged:function(){
    if (this.account == null) {
      return;
    }; 
    console.log("Account changed for stats");
    console.log(this.account.password);
    this.openPostURL(this.account.password);
    // this.$.statsPane.selectView(this.$.statsSpinner);
    // this.$.statsPasswordManager.setAccount(this.account);
  },
  passwordReady:function(sender){
     if (this.account == null) {
       return;
     };
     this.openPostURL(sender.password);
  },
  passwordInvalid:function(sender){
     console.log("The password was missing or the XML-RPC api received a 403 fault code");
  },
  resizeChart:function(sender){
	this.loadChartData();
  },
  loadChartData:function(){
	jQuery('#stat-chart').load( this.account.account.xmlrpc.replace('/xmlrpc.php','/wp-includes/charts/flot-stats-data.php'), {
      "height":210,
      "page":"stats",
      "chart_type":"stats-data",
      "target":"stat-chart",
      "blog":this.account.account.blogid,
      "unit":1
    });
  },
  refreshStats:function(sender){
     this.$.statsSpinner.show();
	 this.$.statsWebView.setContent('');
	 this.openPostURL(this.account.password);
  },
  openPostURL:function(password){
	  //TODO: check the connection to host here!!!
	  if (password != null) {
		  var loginURL = this.account.account.xmlrpc.replace("/xmlrpc.php", "/wp-login.php");
		  var statsURL = this.account.account.xmlrpc.replace("/xmlrpc.php", "/wp-admin/admin.php?page=stats&noheader=1");
		  this.$.statsWebService.setUrl(loginURL);
		  this.$.statsWebService.setMethod('POST');
		  this.$.statsWebService.call({log:this.account.account.username, pwd:password, redirect_to:statsURL});
	  }
  },
  loginSuccess:function(sender, response, request){
	this.$.statsSpinner.hide();
    this.$.statsWebView.setContent(response);
	jQuery("head").append($("<link rel='stylesheet' href='../css/stats-styles.css' type='text/css' media='screen' />"));
    this.loadChartData();
	jQuery.getScript( '../lib/stats-tabs.js' );
    this.$.statsPane.selectView(this.$.statsWebView);
  },
  loginFailure:function(sender, response, request){
    console.log('Login failure');
  },
});
