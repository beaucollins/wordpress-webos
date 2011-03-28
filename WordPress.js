/*
 WordPress application root
*/
enyo.kind({
  name: 'enyo.WordPress',
  kind: 'enyo.Control',
  components:[
    { name:'xmlrpc_client', kind:'XMLRPCService', url:'http://beau.local/wp3.0/xmlrpc.php', onSuccess:"gotBlogs", onFailure:"gotBlogsError" }
  ],
  ready:function(){
    this.$.xmlrpc_client.callMethod('wp.getUsersBlogs', ['admin', 'ref0rrest']);
  },
  gotBlogs:function(client, response, request){
    if (request.fault) {
      throw(response.faultString);
    }else{
      console.log(response);
    }
  },
  gotBlogsError:function(){
    console.log("error", arguments);
  }
});