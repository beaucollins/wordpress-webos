/*

Wrapper for WordPress.com Stats API built on top of BasicService

*/

enyo.kind({
  name:'StatsService',
  kind:'WebService',
  requestKind: 'StatsService.Request',
  url:'https://stats.wordpress.com/csv.php',
  published:{
      blog:null,
      callParams:[]
  },
  makeRequestProps:function(inProps){
    var props = this.inherited(arguments);
    // we need to force our params here
    props.callParams = this.callParams;
    return enyo.mixin(props);
    ;
  },
  callStats:function(params, options){
      alert("Need stats API key");
      return;
      params.api_key = '';
      params.format = 'json';
      params.blog_id = this.blog;
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
  	  };
    }
});