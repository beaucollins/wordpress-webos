enyo.kind({
  name:'wp.PostPreviewView',
  kind: "enyo.Scroller",
  published: {
    account:null,
    post:null
  },
  events: { 
  },
  create:function(){
	 this.inherited(arguments);
  },
  components: [
    {kind: "ApplicationEvents", onWindowParamsChange: "windowParamsChangeHandler"},
    { name:'previewPasswordManager', kind:'wp.WordPressClient', onPasswordReady:'passwordReady', onPasswordInvalid:'passwordInvalid' },
    {name: "postPreviewResponse", kind: "HtmlContent"},
    {name: 'realPreview', kind:'WebView',  style :'background:none; position:absolute;top:0;right:0;left:0;bottom:0;', onLoadStopped:'loadStopped'}
  ],
  passwordReady:function(sender){
     console.log("We have the password now: " + sender.password);
     this.openPostURL(sender.password);
  },
  passwordInvalid:function(sender){
     console.log("The password was missing or the XML-RPC api received a 403 fault code");
  },
  openPostURL:function(password){
	  //TODO: check the connection to host here!!!
	  if (this.post.permaLink && this.post.permaLink.trim() != "" /* && password != null*/) {
		  this.$.postPreviewResponse.setShowing(false);
		  var loginURL = this.account.xmlrpc.replace("/xmlrpc.php", "/wp-login.php");
		 // var postdata='log='+this.account.username+'&pwd='+password+'&redirect_to='+this.post.permaLink;
		  var htmlForm = '<div style="background: #eee; position:absolute;top:0;right:0;left:0;bottom:0;">'
		  +'<img src="http://wordpress.com/i/loading/fresh-64.gif"/>'
		  +'<form method="post" action="'+loginURL+'" id="loginform" name="loginform" style="visibility:hidden">'
		  +'<input type="text" tabindex="10" size="20" value="'+this.account.username+'" class="input" id="user_login" name="log"></label>'
		  +'<input type="password" tabindex="20" size="20" value="'+password+'" class="input" id="user_pass" name="pwd"></label>'
		  +'<input type="submit" tabindex="100" value="Log In" class="button-primary" id="wp-submit" name="wp-submit">'
		  +'<input type="hidden" value="'+ this.post.permaLink +'" name="redirect_to">'
		  +'</form>'
		  +'<script type="text/javascript">document.forms[0].submit()</script>';
		  console.log(htmlForm);
		  //this.$.postPreviewResponse.setContent(htmlForm);
		  this.$.realPreview.setHTML('http://wordpress.com',htmlForm); //the wordpress.com domain is necessary because we are loading the loading gif from WP.com
	  } else {
		  //fallback to  local preview	    
		  var alert_msg = $L("Sorry, something went wrong during preview. A simple preview is shown below.");
		  this.prepareItemForLocalPreview(alert_msg);
	  }
  },
  loadlocalPreview:function(alert_msg, title, content, tags, categories, type){
	  this.$.realPreview.setShowing(false);
	  if (typeof(title) == "undefined" || enyo.string.trim(title) =="")
		  title = $L("(no title)");		  
	  
	  if (typeof(content) == "undefined" || enyo.string.trim(content) == "")
		  content = $L("No Description available for this") + ' ' + type;
	  
	  if(tags && enyo.string.trim(tags) != "") {
		  tags = $L('Tags') + ': ' + tags;
	  } else {
		  tags = "";
	  }
	  
	  if(categories && categories.length > 0) {
		  categories = $L('Categories') + ': ' + categories.join(', ');
	  } else {
		  categories ="";
	  }
	  
	  //TODO check the connection status here
	 // var alert_msg = "Sorry, no connection to host. A simple preview is shown below.";
	  
	  var content = '<div class="preview_page"><h5 id="preview_alert">'+alert_msg+'</h5>'+
	  '<h1>'+ title + '</h1>'+
	  '<div id="preview_content">' +
	  '<p>'+ content +'</p>' + 
	  '</div>';
	  if(tags != "" || categories !="")
		  content+='<div id="preview_meta">';
	  
	  if(tags != "")
		  content+='<p id="preview_tags">'+tags+'</p>';
	 
	  if(categories !="")
		  content+='<p id="preview_categories">'+categories+'</p>';
	  
	  if(tags != "" || categories !="")
		  content+='</div>';
	  
	  content+='</div>';
	  this.$.postPreviewResponse.setContent(content);
  },
  prepareItemForLocalPreview: function(message){
	  //fallback to  local preview	    
	  var alert_msg = message ? message : $L("Sorry, something went wrong during preview. A simple preview is shown below.");
	  var typeString = this.post._type === "Post" ? 'Post' : 'Page';
	  var tags = this.post._type === "Post" ? this.post.mt_keywords:'';
	  
	  var categoriesForPreview = new Array();
	  if(this.post && this.post.categories) {
		  categoriesForPreview = this.post.categories;
	  }
	  this.loadlocalPreview(alert_msg, this.post.title,  this.post.description + (this.post._type === "Post"? this.post.mt_text_more : this.post.text_more) , tags, categoriesForPreview, typeString);
  },
  windowParamsChangeHandler: function(inSender, inEvent) {
	  var p = inEvent.params;
	  this.log("PostPreview Parameters", p);
	  if(typeof(enyo.windowParams.post) == "undefined") { //called from the compose view when an item is modified or it is a new item
		  
		  var title = enyo.windowParams.title; 
		  var content = enyo.windowParams.content;
		  var tags = enyo.windowParams.tags;
		  var categories = enyo.windowParams.categories;
		  var typeString = enyo.windowParams.item_type; //decode the string in the future
		  var alert_msg = $L('Sorry, the') + ' ' + typeString + ' ' + $L('has changed, or it is not published. A simple preview is shown below.');
		  this.loadlocalPreview(alert_msg, title,content, tags, categories, typeString);
	  } else if (typeof(enyo.windowParams.account) == "undefined" || enyo.windowParams.account == null) { //called from the details panel
		  //preview of a draft post
		  this.post = enyo.windowParams.post;
		  var typeString = this.post._type === "Post" ? 'Post' : 'Page';
		  var alert_msg = $L('Sorry, the') + ' ' + typeString + ' ' + $L('has changed, or it is not published. A simple preview is shown below.');
		  this.prepareItemForLocalPreview(alert_msg);
	  } else {
		  this.account = enyo.windowParams.account;
		  this.post = enyo.windowParams.post;
		  this.$.previewPasswordManager.setAccount(this.account);
	  }
  },
});