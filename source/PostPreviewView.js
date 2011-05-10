enyo.kind({
  name:'wp.PostPreviewView',
  kind:'enyo.Scroller',
  published: {
    //account:null,
    //post:null
  },
  events: { 
  },
  create:function(){
	 this.inherited(arguments);
  },
  components: [
    //{ kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'open' },
	{name: "postPreviewService", kind: "WebService",
        method: "POST",
        handleAs: "text",
        contentType: 'application/x-www-form-urlencoded',
        onSuccess: "onPreviewSuccess",
        onFailure: "onPreviewFailure"},
      {name: "postPreviewResponse", kind: "HtmlContent"}
  ],
  openPostURL:function(){
	  if (this.post.permaLink && this.post.permaLink.trim() != "" ) {
		  console.log(this.account);
		  console.log(this.post);
		  var loginURL = this.account.xmlrpc.replace("/xmlrpc.php", "/wp-login.php");
		  var postdata='log='+this.account.username+'&pwd='+this.account.password+'&redirect_to='+this.post.permaLink;
		  console.log("post permalink: "+ this.post.permaLink+"  login URL: "+ loginURL);
		  console.log("login info: " +postdata);
		  this.$.postPreviewService.url = loginURL;
		  this.$.postPreviewService.call({
			  postBody: postdata
		  });
	  }
  },
  loadlocalPreview:function(alert_msg, title, content, tags, categories){
	  var content = '<div class="preview_page"><h5 id="preview_alert">'+alert_msg+'</h5>'+
	  '<h1>'+ title + '</h1>'+
	  '<div id="preview_content">' +
	  '<p>'+ content +'</p>' + 
	  '</div> <div id="preview_meta"><p id="preview_tags">'+tags+'</p>' +
	  '<p id="preview_categories">'+categories+'</p>' +
	  '</div></div>';
	  this.$.postPreviewResponse.setContent(content);
  },
  onPreviewSuccess: function(inSender, inResponse) {
	  this.$.postPreviewResponse.setContent(inResponse);
	  console.log("success response = " + inResponse);
  },
  onPreviewFailure: function(inSender, inResponse) {
	  console.log("failure response = " + inResponse);
	  //fallback to  local preview	  
	  
	  var title = this.post.title;
	  if (typeof(title) == "undefined" || enyo.string.trim(title) =="")
		  title = "(no title)";		  
	  
	  var content = this.post.description;
	  if (typeof(content) == "undefined" || enyo.string.trim(content) == "")
		  content = "No Description available for this Post";
	  
	  var tags = this.post.mt_keywords;
	  var categories = this.post.categories;
	  var alert_msg = "Sorry, no connection to host. A simple preview is shown below.";
	  
	  this.loadlocalPreview(alert_msg, title,content, tags, categories); 
  },
  windowParamsChangeHandler: function() {
	  if(typeof(enyo.windowParams.account) == "undefined") {
		  //load local preview	  
		  var title = enyo.windowParams.title;
		  if (typeof(title) == "undefined" || enyo.string.trim(title) =="")
			  title = "(no title)";		  
		  var content = enyo.windowParams.content;
		  if (typeof(content) == "undefined" || enyo.string.trim(content) == "")
			  content = "No Description available for this Post";
		  var tags = "";
		  var categories = "";
		  var alert_msg = "Sorry, the post has changed, or it is not published. A simple preview is shown below.";
		  this.loadlocalPreview(alert_msg, title,content, tags, categories);
	  } else {
		  //load remote preview
		  this.$.postPreviewResponse.setContent("<h1>Loading Preview...</h1>");
		  this.account = enyo.windowParams.account;
		  this.post = enyo.windowParams.post;
		  this.openPostURL();
	  }
  }
});