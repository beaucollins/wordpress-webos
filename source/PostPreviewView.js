enyo.kind({
  name:'wp.PostPreviewView',
  kind:'VFlexBox',
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
    //{ kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'open' },
	{name: "postPreviewService", kind: "WebService",
	    url: "",
        method: "POST",
        onSuccess: "onPreviewSuccess",
        onFailure: "onPreviewFailure"},
    { kind:'Scroller', flex:1, components:[
      {name: "postPreviewResponse", kind: "HtmlContent"}
    ] }
  ],
  openPostURL:function(){
	  if (this.post.permaLink && this.post.permaLink.trim() != "" ) {
		  console.log(this.account);
		  console.log(this.post);
		  var redirectURL = this.account.xmlrpc.replace("/xmlrpc.php", "/wp-login.php");
		  var postdata='log='+this.account.username+'&pwd='+this.account.password+'&redirect_to='+this.post.permaLink;
		  console.log(this.post.permaLink+" "+ redirectURL);
		  console.log(postdata);
		  this.$.postPreviewService.url = redirectURL;
		  this.$.postPreviewService.call({
			  handleAs: "text",
			  postBody: postdata, 
			  contentType: 'application/x-www-form-urlencoded'
		  });
	  }
  },
  onPreviewSuccess: function(inSender, inResponse) {
	  this.$.postPreviewResponse.setContent(inResponse);
	  console.log("success response = " + inResponse);
  },
  onPreviewFailure: function(inSender, inResponse) {
	  this.$.postPreviewResponse.setContent(inResponse);
	  console.log("failure response = " + inResponse);
  },
  windowParamsChangeHandler: function() {
	  this.$.postPreviewResponse.setContent("<h1>Loading Preview...</h1>");
	  this.account = enyo.windowParams.account;
	  this.post = enyo.windowParams.post;
	  this.openPostURL();
   }
});