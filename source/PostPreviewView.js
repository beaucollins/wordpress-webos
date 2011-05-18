enyo.kind({
  name:'wp.PostPreviewView',
  kind:'enyo.Scroller',
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
	{name:"loadingScrim",  kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", components: [
		{name: "loadingSpinner", kind: "SpinnerLarge"},
	]},
    {name: "postPreviewResponse", kind: "HtmlContent"}
  ],
  openPostURL:function(){
	  this.showScrim(true);
	  //TODO: check the connection to host here!!!
	  if (this.post.permaLink && this.post.permaLink.trim() != "" ) {
		  var loginURL = this.account.xmlrpc.replace("/xmlrpc.php", "/wp-login.php");
		  var postdata='log='+this.account.username+'&pwd='+this.account.password+'&redirect_to='+this.post.permaLink;
		  var htmlForm ='<form method="post" action="'+loginURL+'" id="loginform" name="loginform" style="visibility:hidden">'
		  +'<input type="text" tabindex="10" size="20" value="'+this.account.username+'" class="input" id="user_login" name="log"></label>'
		  +'<input type="password" tabindex="20" size="20" value="'+this.account.password+'" class="input" id="user_pass" name="pwd"></label>'
		  +'<input type="submit" tabindex="100" value="Log In" class="button-primary" id="wp-submit" name="wp-submit">'
		  +'<input type="hidden" value="'+ this.post.permaLink +'" name="redirect_to">'
		  +'</form>';
		  this.$.postPreviewResponse.setContent(htmlForm);
		  loginform.submit();
	  } else {
		//fallback to  local preview	    
		  var alert_msg = "Sorry, something went wrong during preview. A simple preview is shown below.";
		  this.loadlocalPreview(alert_msg, this.post.title,  this.post.description, this.post.mt_keywords, this.post.categories); 
	  }
  },
  loadlocalPreview:function(alert_msg, title, content, tags, categories){
	  this.showScrim(true);
	  if (typeof(title) == "undefined" || enyo.string.trim(title) =="")
		  title = "(no title)";		  
	  
	  if (typeof(content) == "undefined" || enyo.string.trim(content) == "")
		  content = "No Description available for this Post";
	  
	  if(tags && enyo.string.trim(tags) != "") {
		  tags ='Tags: '+ tags;
	  } else {
		  tags = "";
	  }
	  
	  if(categories && categories.length > 0) {
		  categories ='Categories: '+ this.post.categories.join(', ');
	  } else {
		  categories ="";
	  }
	  
	  //TODO check the connection status here
	 // var alert_msg = "Sorry, no connection to host. A simple preview is shown below.";
	  
	  var content = '<div class="preview_page"><h5 id="preview_alert">'+alert_msg+'</h5>'+
	  '<h1>'+ title + '</h1>'+
	  '<div id="preview_content">' +
	  '<p>'+ content +'</p>' + 
	  '</div> <div id="preview_meta"><p id="preview_tags">'+tags+'</p>' +
	  '<p id="preview_categories">'+categories+'</p>' +
	  '</div></div>';
	  this.showScrim(false);
	  this.$.postPreviewResponse.setContent(content);
  },
  windowParamsChangeHandler: function(inSender, inEvent) {
	  if(typeof(enyo.windowParams.account) == "undefined") {
		  //load local preview	  
		  var title = enyo.windowParams.title; 
		  var content = enyo.windowParams.content;
		  var tags = "";
		  var categories = "";
		  var alert_msg = "Sorry, the post has changed, or it is not published. A simple preview is shown below.";
		  this.loadlocalPreview(alert_msg, title,content, tags, categories);
	  } else {
		  //load remote preview
		  this.account = enyo.windowParams.account;
		  this.post = enyo.windowParams.post;
		  this.openPostURL();
	  }
  },
  showScrim: function(inShowing) {
	this.$.loadingScrim.setShowing(inShowing);
	this.$.loadingSpinner.setShowing(inShowing);
  },
});