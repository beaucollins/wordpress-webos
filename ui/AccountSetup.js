enyo.kind({
  name:'AccountSetup',
  kind: 'enyo.Control',
  layoutKind: 'VFlexLayout',
  components: [
    { name:'http_client', kind:'enyo.WebService', handleAs:'text', onSuccess:'discoverEndpoint' },
    { name:'wp_client', kind:'WordPressService', onSuccess:'gotBlogList', onFailure:'gotBlogListFailure' },
    { name:'pane', kind:'Pane', flex:1, onSelectView: 'prepareView', components:[
      {
        flex: 1,
        kind: 'Scroller',
        components: [
          {
            kind: 'RowGroup',
            caption: 'Website',
            components: [
              { name:'address', kind: 'FancyInput', hint:'Web address' }
            ]
          },
          {
            kind: 'RowGroup',
            caption: 'Account',
            components: [
              { name:'username', kind: 'FancyInput', hint:'Username' },
              { name:'password', kind: 'FancyInput', hint:'Password', inputType:'password' }
            ]
          },
          { kind:'Button', caption: 'Sign Up', onclick:'findAccount' }
        
        ]
      },
      {
        name: 'list',
        kind: 'VirtualList',
        flex:1,
        onSetupRow:'setupRow',
        components: [
          {kind: 'Item', layoutKind: 'HFlexLayout', components: [
            { name: 'blogName', flex:1 },
            { kind: 'CheckBox' }
          ]}
        ]
      }
    ]}
  ],
  findAccount:function(inSender, inEvent){
    // TODO: put up a scrim
    var username = this.username = this.$.username.getValue();
    var password = this.password = this.$.password.getValue();
    var address = this.$.address.getValue();
    var url;
    
    // first let's normalize the URL
    if ((/^[a-z0-9]+$/i).test(address)) {
      // if the address is just a username (no "." anywhere) then turn it into a wordpress.com url
      url = 'http://' + address + '.wordpress.com';
    }else if (!(/^http(s)?:\/\//i).test(address)) {
      url = 'http://' + address;
    };
    
    if ((/\/xmlrpc\.php$/i).test(url)) {
      //skip auto-discover go straight to get blogs
      this.getBlogList(url, username, password);
    }else{
      //attempt to auto-discover the xml endpoint by parsing the HTML for the site
      this.$.http_client.setUrl(url);
      this.$.http_client.call();
    }
    
  },
  getBlogList:function(url, username, password){
    this.$.wp_client.setUrl(url);
    this.$.wp_client.callMethod({ methodName: 'wp.getUsersBlogs', methodParams: [username, password] })
  },
  gotBlogList:function(sender, response, request){
    if (request.fault) {
      // TODO: Show alert popup style message with details
    }else{
      // TODO: More than one blog then show list of blogs to choose from
      if (response.length > 1) {
        this.data = response;
        this.$.pane.selectViewByName('list');
        this.$.list.refresh();
      };
      // TODO: Single blog listed, save it and notify up the chain
    }
  },
  discoverEndpoint:function(sender, response, request){
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
    parser.parse(response, handler);
    if (edit_url) {
      this.getBlogList(edit_url.replace(/\?rsd$/i,''), this.username, this.password);
    };
  },
  setupRow:function(inSender, index){
    var record = this.data[index];
    if (record) {
      this.log(enyo.json.to(record));
      this.$.blogName.setContent(record.blogName);
      return true;
    };
  },
  prepareView:function(inSender, view, previousView){
    if (view == this.$.list) {
      this.$.list.refresh();
    };
  },
  backHandler:function(inSender, e){
    this.$.pane.back(e);
  }
});