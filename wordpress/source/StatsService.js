/*

Wrapper for WordPress.com Stats API built on top of BasicService

*/
enyo.kind({
  name:'StatsService',
  kind:'WebService',
  requestKind: 'StatsService.Request',
  url:'https://stats.wordpress.com/csv.php',
  components:[
      { name:'statsPasswordManager', kind:'wp.WordPressClient', onPasswordReady:'passwordReady', onPasswordInvalid:'passwordInvalid' },
      { name:'apiKeyDiscover', kind:'StatsApiKeyService' },
  ],
  published:{
      account:null,
      callParams:[]
  },
  passwordReady:function(sender){
      console.log("We have the password now: " + sender.password);
  },
  passwordInvalid:function(sender){
      console.log("The password was missing or the XML-RPC api received a 403 fault code");
      // perhaps prompt for the password
  },
  hasApiKey:function() {
    return (this.account.apiKey != null);
  },
  getApiKey:function() {
    if (this.hasApiKey()) {
        return this.account.apiKey;
    } else {
        this.$.apiKeyDiscover.setUsername(this.account.account.username);
        this.$.apiKeyDiscover.setPassword(this.account.account.password);
        this.$.apiKeyDiscover.call({},{onSuccess:'gotApiKey'});
    }
  },
  gotApiKey:function(sender, response, request) {
      this.account.apiKey = response.userinfo.apikey;
      this.owner.setAccount(this.account);
  },
  makeRequestProps:function(inProps){
    var props = this.inherited(arguments);
    // we need to force our params here
    props.callParams = this.callParams;
    return enyo.mixin(props);
    ;
  },
  callStats:function(params, options){
      params.api_key = this.account.apiKey;
      params.format = 'json';
      params.blog_id = this.account.account.blogid;
      this.callParams = params;
      this.call({}, options);
  }
});

enyo.kind({
    name:'StatsService.Request',
    kind:'WebService.Request',
    call: function(){
      // turn this.params into XML string
      this.params = this.callParams;
      this.inherited(arguments);
    },
    setResponse: function(inXHR){
  	  this.inherited(arguments);
  	  if (inXHR.status == 200) {
  	      try {
      		  this.response = JSON.parse(inXHR.responseText);  	          

      		  if (this.params.summarize) {
      		      var rsp = this.response;
          		  var headers = rsp.shift();
          		  var result = [];
          		  for (var i = rsp.length - 1; i >= 0; i--){
          		      result[i] = {};
          		      for (var j = headers.length - 1; j >= 0; j--){
          		        result[i][headers[j]] = rsp[i][j];
          		      };
          		  };
          		  this.response = result;
          		  this.response = this.response.sort(function(a,b) {
          		      return b['views'] - a['views'];
          		  });
    	      }  		      
  	      } catch(err) {
	          console.log('err:' + err);
  		      if (-1 != inXHR.responseText.indexOf('Error: api_key does not belong to an administrator of blog')) {
  		          console.log('stats no admin');
  		          this.response = null;
  		          // FIXME: Show error dialog
                  // alert("You need to be an administrator of the blog to be able to see stats");
  		      }
  	      }
  	  };
    }
});


enyo.kind({
    name:'StatsApiKeyService',
    kind:'WebService',
    url:'https://public-api.wordpress.com/get-user-blogs/1.0?f=json'
});
