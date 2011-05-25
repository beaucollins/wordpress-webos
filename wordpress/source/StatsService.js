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
  events: {
    onApiReady:'',
  },
  accountChanged: function() {
    console.log('StatsService accountChanged');
    this.$.statsPasswordManager.setAccount(this.account);
  }, 
  passwordReady:function(sender){
    console.log("We have the password now: " + sender.password);
    this.password = sender.password;
    console.log("account.password = " + this.account.password);
    console.log("account.account.password = " + this.account.account.password);
    this.getApiKey();
  },
  passwordInvalid:function(sender){
    console.log("The password was missing or the XML-RPC api received a 403 fault code");
    // perhaps prompt for the password
  },
  getApiKey:function() {
    if (this.apiKey) {
        return this.apiKey;
    } else {
        // this.$.apiKeyDiscover.setUsername(this.account.account.username);
        // this.$.apiKeyDiscover.setPassword(this.password);
        this.$.apiKeyDiscover.call({
          headers:{
            'Authorization' : "Basic " + enyo.string.toBase64(this.account.account.username, this.account.password)
          }
        },{onSuccess:'gotApiKey'});
    }
  },
  gotApiKey:function(sender, response, request) {
    console.log('Got API key: ' + response.userinfo.apikey);
    this.apiKey = response.userinfo.apikey;
    this.doApiReady();
  },
  makeRequestProps:function(inProps){
    var props = this.inherited(arguments);
    // we need to force our params here
    props.callParams = this.callParams;
    return enyo.mixin(props);
  },
  callStats:function(params, options){
      params.api_key = this.apiKey;
      params.format = 'json';
      params.blog_id = this.account.account.blogid;
      this.callParams = params;
      console.log('Calling stats');
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
