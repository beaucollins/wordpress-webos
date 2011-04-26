/*
Give it a url, username and apssword and it will find the XMLRPC endpoint and then give
you a the blog list.

Otherwise it will fire onFailure with a reason why

Possible errors:
  - couldn't find XMLRPC enpoint
  - XMLRPC api not enabled in WordPress admin
  - invalid username/password
  


*/ 
enyo.kind({
  name:'wp.BlogDiscover',
  kind:'enyo.Component',
  events: {
    onSuccess:"",
    onFailure:"",
    onBadURL:""
  },
  components:[
    { name:'xmlrpc_service', kind:'XMLRPCService', methodName:'wp.getUsersBlogs', onSuccess:'gotBlogs', onFault:'apiFault', onFailure:'doBadURL' },
    { kind:'wp.EndpointDiscover', onSuccess:'foundEndpoint', onFailure:'doBadURL' }
  ],
  create:function(){
    this.inherited(arguments);
  },
  discoverBlogs:function(url, username, password){
    //first normalize the url
    this.url = url;
    this.username = username;
    this.password = password;
    var normalized_url = this.normalizeUrl(url);
    this.$.xmlrpc_service.callMethod({ methodParams:[username, password] }, { url:normalized_url, onFailure:'initialEndpointFailure'});
  },
  // apiFault, either bad username/pass or API disabled, we're done here
  apiFault:function(sender, request, response){
    this.doFailure(request, response)
  },
  initialEndpointFailure:function(sender, response, request){
    this.log("Failed first XMLRPC call, attempt endpoint discovery");
    this.$.endpointDiscover.discover(this.url, request.xhr.responseText);
    // basic request for URL and parse out the link rel=EditURI
  },
  gotBlogs:function(sender, response, request){
    this.doSuccess(response, this.username, this.password);
  },
  normalizeUrl:function(url){
    // make sure it has a protocol
    if(!(/^https?:\/\//i).test(url)) url = 'http://' + url;
    // add the /xmlrpc.php
    if (!(/\/xmlrpc\.php$/i).test(url)) url = url + '/xmlrpc.php';
    
    return url;
    
  },
  foundEndpoint:function(sender, endpoint){
    this.$.xmlrpc_service.callMethod({ methodParams:[this.username, this.password] }, { url:endpoint });
  }
  
});

enyo.kind({
  name:'wp.EndpointDiscover',
  kind:'enyo.Component',
  published: {
    url:false
  },
  events: {
    onSuccess:"",
    onFailure:""
  },
  components:[
    { kind:'enyo.WebService', handleAs:'text', onSuccess:'praseEditURIFromResponse', onFailure:'doFailure'}
  ],
  discover:function(url, initialHTML){
    // use the published property if no url
    url = url || this.url;
    if (!url) throw("EndpointDiscover requries a valid url");
    if (initialHTML) {
      var edit_url;
      if (edit_url = this.parseEditURI(initialHTML)) {
        this.$.webService.call({}, { handleAs:"xml", url:edit_url, onSuccess:'parseEndpoint' });
        return;
      }
    };
    
    this.$.webService.call({},{url:url});
    
  },
  praseEditURIFromResponse:function(sender, response, request){
    var edit_url = this.parseEditURI(response);
    if (edit_url) {
      this.$.webService.call({}, { handleAs:"xml", url:edit_url, onSuccess:'parseEndpoint' })
    }else{
      this.doFailure();
    }
  },
  parseEditURI:function(html){
    // console.log("Parsing html", html);
    var edit_url;
    var parser = new SimpleHtmlParser
    var handler = (function(){
      return {
        startElement: function (sTagName, oAttrs) {
          var correct_element = false;
          var element_href = "";
          if (sTagName == 'link') {
            enyo.forEach(oAttrs, function(attr){
              if (attr.name == 'rel' && attr.value == 'EditURI') {
                correct_element = true;
              };
              if (attr.name == 'href') {
                element_href = attr.value
              };
            });
            if (correct_element) {
              edit_url = element_href;
            };
          };
        },
        endElement:  function (sTagName) {},
        characters:  function (s) {},
        comment:     function (s) {}
      }
    })()
    parser.parse(html, handler);
    return edit_url;
  },
  parseEndpoint:function(sender, response, request){
    var api, node = response.querySelector('api[name=WordPress]');
    if (node) {
      if(api = node.getAttribute('apiLink')){
        this.doSuccess(api);
      }
    }
    this.doFailure();
  }
  
})