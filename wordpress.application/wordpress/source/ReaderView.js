enyo.kind({
  name:'wp.ReaderView',
  kind: 'Control',
  published: {
    account:null,
  },
  events: { 
  },
  create:function(){
	 this.inherited(arguments);
  },
  components: [
    {kind: "ApplicationEvents", onWindowParamsChange: "windowParamsChangeHandler"},
    { name:'readerWebService', kind:'WebService', handleAs:'html', onSuccess:'logoutSuccess', onFailure:'logoutFailure'},
    { name:'previewPasswordManager', kind:'wp.WordPressClient', onPasswordReady:'passwordReady', onPasswordInvalid:'passwordInvalid' },
    { kind:'enyo.Header', components:[
        {kind: "Button", name:"backBtn", className: "enyo-button-affirmative", caption: "Back", onclick: "goBack", flex: 1},
        {kind: "Button",  name:"forwardBtn", className: "enyo-button-affirmative", caption: "Forward", onclick: "goForward", flex: 1}
     ]},
    {name: 'realPreview', kind:'WebView', /*url: "http://wordpress.com/reader/mobile/",*/ style:"height:100%", }
  ],
  goBack: function() {
	this.$.realPreview.goBack();
  },
  goForward: function() {
	this.$.realPreview.goForward();
  },
  passwordReady:function(sender){
     //console.log("We have the password now: " + sender.password);
     this.oldopenPostURL(sender.password);
  },
  passwordInvalid:function(sender){
     console.log("The password was missing or the XML-RPC api received a 403 fault code");
  },
  oldopenPostURL:function(password){
	  //TODO: check the connection to host here!!!
	 var loginURL = "http://wordpress.com/wp-login.php";
	 //var readerURL = "http://wordpress.com/subs/";
	 var readerURL = "http://wordpress.com/reader/mobile/";

	  var htmlForm = '<div style="background: #eee; position:absolute;top:0;right:0;left:0;bottom:0;">'
	  +'<img src="http://wordpress.com/i/loading/fresh-64.gif"/>'
	  +'<form method="post" action="'+loginURL+'" id="loginform" name="loginform" style="visibility:hidden">'
	  +'<input type="text" tabindex="10" size="20" value="'+this.account.username+'" class="input" id="user_login" name="log"></label>'
	  +'<input type="password" tabindex="20" size="20" value="'+password+'" class="input" id="user_pass" name="pwd"></label>'
	  +'<input type="submit" tabindex="100" value="Log In" class="button-primary" id="wp-submit" name="wp-submit">'
	  +'<input type="hidden" value="'+ readerURL +'" name="redirect_to">'
	  +'</form>'
	  +'<script type="text/javascript">document.forms[0].submit()</script>';
	  console.log(htmlForm);
	  this.$.realPreview.setHTML('',htmlForm); //the wordpress.com domain is necessary because we are loading the loading gif from WP.com
  },
  windowParamsChangeHandler: function(inSender, inEvent) {
	  var p = inEvent.params;
	  console.log("PostPreview Parameters", p);
	  if (typeof(enyo.windowParams.account) == "undefined" || enyo.windowParams.account == null) { 
		 
	  } else {
		  this.account = enyo.windowParams.account;
		  this.$.previewPasswordManager.setAccount(this.account);
	  }
  },
});