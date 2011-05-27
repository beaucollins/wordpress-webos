enyo.kind({
  name: 'wp.Stats',
  kind: 'VFlexBox',
  published: {
    account:null
  },
  components: [
    // { name:'statsService', kind:'StatsService', onApiReady:'statsServiceReady'},
    { name:'statsPasswordManager', kind:'wp.WordPressClient', onPasswordReady:'passwordReady', onPasswordInvalid:'passwordInvalid' },
    { name:'statsWebView', kind:'wp.StatsWebView', onLoadStopped:'loadStopped', flex:1 }
  ],
  accountChanged:function(){
    if (this.account == null) {
      return;
    };
    
    this.$.statsPasswordManager.setAccount(this.account);
  },
  passwordReady:function(sender){
     console.log("We have the password now: " + sender.password);
     if (this.account == null) {
       return;
     };
     this.openPostURL(sender.password);
  },
  passwordInvalid:function(sender){
     console.log("The password was missing or the XML-RPC api received a 403 fault code");
  },
  openPostURL:function(password){
	  //TODO: check the connection to host here!!!
	  if (password != null) {
	    console.log(this.account.account.username);
		  var loginURL = this.account.account.xmlrpc.replace("/xmlrpc.php", "/wp-login.php");
		  var statsURL = this.account.account.xmlrpc.replace("/xmlrpc.php", "/wp-admin/admin.php?page=stats");
		 // var postdata='log='+this.account.username+'&pwd='+password+'&redirect_to='+this.post.permaLink;
		  var htmlForm ='<h1>Login</h1><form method="post" action="'+loginURL+'" id="loginform" name="loginform" style="visibility:visible">'
		  +'<input type="text" tabindex="10" size="20" value="'+this.account.account.username+'" class="input" id="user_login" name="log">'
		  +'<input type="password" tabindex="20" size="20" value="'+password+'" class="input" id="user_pass" name="pwd">'
		  +'<input type="submit" tabindex="100" value="Log In" class="button-primary" id="wp-submit" name="wp-submit">'
		  +'<input type="hidden" value="'+ statsURL +'" name="redirect_to">'
		  +'</form>'
		  +'<script type="text/javascript">document.forms[0].submit()</script>';
		  console.log(htmlForm);
		  this.$.statsWebView.setHTML('file://stats.html',htmlForm);
      // loginform.submit();
	  }
  },
  loadStopped:function() {
    console.log('URL: ' + this.$.statsWebView.url);
  },
});
