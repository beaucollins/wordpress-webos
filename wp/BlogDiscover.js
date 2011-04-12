enyo.kind({
  name:'wp.BlogDiscover',
  kind:'enyo.Component',
  events: {
    onSuccess:"",
    onFailure:""
  },
  components:[
    { name:'xmlrpc_service', kind:'XMLRPCService', methodName:'wp.getUsersBlogs', onSuccess:'gotBlogs', onFailure:'endpointError' }
  ],
  create:function(){
    this.inherited(arguments);
  },
  discoverBlogs:function(url, username, password){
    console.log(url, username, password);
    this.$.xmlrpc_service.setUrl(url);
    this.$.xmlrpc_service.callMethod({ methodParams:[username, password] })
  },
  gotBlogs:function(sender, response, request){
    this.doSuccess(response);
  },
  endpointError:function(sender, response, request){
    console.log("Error", sender, response, request);
  }
  
});