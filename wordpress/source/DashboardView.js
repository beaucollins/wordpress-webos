enyo.kind({
  name:'wp.DashboardView',
  kind: "enyo.Scroller",
  published: {
    account:null
  },
  events: { 
  },
  create:function(){
	 this.inherited(arguments);
  },
  components: [
    { name:'dashboardPasswordManager', kind:'wp.WordPressClient', onPasswordReady:'passwordReady', onPasswordInvalid:'passwordInvalid' },
    {name: 'realPreview', kind:'WebView', style :'background:none; position:absolute;top:0;right:0;left:0;bottom:0;', onLoadStopped:'loadStopped'}
  ],
  accountChanged:function(){
	  this.log("accountChanged");
	  if (this.account == null) {
		  return;
	  };
	  this.$.dashboardPasswordManager.setAccount(this.account);
  },
  passwordReady:function(sender){
     console.log("We have the password now: " + sender.password);
     this.openPostURL(sender.password);
  },
  passwordInvalid:function(sender){
     console.log("The password was missing or the XML-RPC api received a 403 fault code");
     this.$.realPreview.setHTML('file://iamnothere.html',"The password was missing or the XML-RPC api received a 403 fault code");
  },
  openPostURL:function(password){
	  var loginURL = this.account.account.xmlrpc.replace("/xmlrpc.php", "/wp-login.php");
	  var redirectURL = this.account.account.xmlrpc.replace("/xmlrpc.php", "/wp-admin/");
	  var htmlForm ='<div style="background:white; position:absolute;top:0;right:0;left:0;bottom:0;">'
	  +'<img src="http://wordpress.com/i/loading/fresh-64.gif"/>'
	  +'<form method="post" action="'+loginURL+'" id="loginform" name="loginform" style="visibility:hidden">'
	  +'<input type="text" tabindex="10" size="20" value="'+this.account.account.username+'" class="input" id="user_login" name="log"></label>'
	  +'<input type="password" tabindex="20" size="20" value="'+password+'" class="input" id="user_pass" name="pwd"></label>'
	  +'<input type="submit" tabindex="100" value="Log In" class="button-primary" id="wp-submit" name="wp-submit">'
	  +'<input type="hidden" value="'+ redirectURL +'" name="redirect_to">'
	  +'</form>'
	  +'<script type="text/javascript">document.forms[0].submit()</script>'
	  +'</div>';
	  this.$.realPreview.setHTML('http://wordpress.com', htmlForm); //the wordpress.com domain is necessary because we are loading the loading gif from WP.com
  },
  windowParamsChangeHandler: function(inSender, inEvent) {
	  var p = inEvent.params;
	  console.log("DashboardView input Parameters", p);
	  this.setAccount(enyo.windowParams.account);
  },
  loadStopped:function() {
	this.log('URL: ' + this.$.realPreview.url);
  },
});