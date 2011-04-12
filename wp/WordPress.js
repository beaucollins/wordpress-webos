/*
 WordPress application root
*/
enyo.kind({
  name: 'wp.WordPress',
  kind: 'Pane',
  published: {
    accounts:[]
  },
  components: [
    { name: 'xmlrpc_client', kind:'XMLRPCService' },
    // Key Manager System Service
    { name: 'keystore', kind:'PalmService', service:'palm://com.palm.keymanager/', onFailure:'failedKeystore', components: [ { name:'store', method:'store', onSuccess:'newKey' }] },
    // Db8 Account Store
    { name:'account', kind:'DbService', dbKind:'org.wordpress.account:1', onSuccess:'accountSuccess', onFailure:'accountFailure', components:[
      { name:'findAccounts', method:'find', onSuccess:'loadAccounts'},
      { name:'putAccountKind', method:'putKind'  }
    ]},
    // main sliding pane interface
    {
      name: 'panes',
      kind: 'enyo.SlidingPane',
      flex: 1,
      multiViewMinWidth:500,
      components: [
        { name:'left', width:'225px', components:[
          { name:'sourceList', kind:'wp.SourceList', flex:1, onSelectAccountAction:'performAccountAction', onAddBlog:'addNewBlog' }
        ] },
        { name:'middle', width:'350px', peekWidth:42, components:[
          { kind:'wp.CommentList', onSelectComment:"selectComment" }
        ] },
        { name:'detail', peekWidth:92, flex:2, onResize: "slidingResize", components:[
          { kind:'wp.CommentView', flex:1 }
        ] }
      ]
    },
    { name: 'setup', kind: 'wp.AccountSetup', onSelectBlogs:'setupBlogs', onCancel:'showPanes' }
  ],
  create:function(){
    this.inherited(arguments);
    // create a signing key
    this.$.store.call({
      // this is the name used to reference the key
      'keyname': 'WordPressAccounts',
      // the data in the key, this is going to be somewhat randomized
      'keydata': this.generateKey(),
      // algorithm to use
      'type' : 'HMACSHA1',
      // we don't want anyone to retrieve the key, we're just going to use it
      // for encryption/decryption purposes
      'nofetch' : true
    });
    
    // should this only be done when needed or can it be called whenever?
    this.$.putAccountKind.call({ owner:'org.wordpress.webos' });
    this.accounts = enyo.json.from(enyo.getCookie('accounts')) || [];
    this.accountsChanged();
  },
  loadAccounts:function(sender, response){
    this.setAccounts(response.results);
  },
  newKey:function(sender, response){
    this.log("I have a new key " + JSON.stringify(response));
  },
  failedKeystore:function(sender, response){
    this.log("Key Manager Error: " + JSON.stringify(response));
  },
  accountFailure:function(sender, response){
    this.log("Accounts Store Error: " + JSON.stringify(response));
  },
  accountSuccess:function(sender, response){
    this.log("Response for accounts: " + JSON.stringify(response));
  },
  resizeHandler: function(){
    this.$.panes.resize();
  },
  performAccountAction: function(sender, action, account){
    if (action == 'Comments') {
      this.$.commentList.setAccount(account);
    };
    if (!this.$.panes.multiView) {
      this.$.panes.selectView(this.$.middle);
    };
  },
  selectComment:function(sender, comment, account){
    this.$.commentView.setAccount(account);
    this.$.commentView.setComment(comment);
    if(!this.$.panes.multiView){
      this.$.panes.selectView(this.$.detail);
    }
  },
  backHandler: function(sender, e){
    this.$.panes.back(e);
  },
  generateKey: function(){
    // right now, nothing
    var key = (new Base64).encode("hi");
    this.log("Key: " + key);
    return key;
  },
  accountsChanged:function(){
    // save the accounts
    enyo.setCookie('accounts', enyo.json.to(this.accounts), { expires:100 });
    this.$.sourceList.setAccounts(this.accounts);
    if (this.accounts.length == 0) {
      // we don't have any accounts, force the welcome screen
      this.setTransitionKind('enyo.transitions.Simple');
      this.$.setup.setCancelable(false);
      this.selectView(this.$.setup);
      this.setTransitionKind('enyo.transitions.Fade');
    }
  },
  addNewBlog:function(sender){
    if (this.accounts.length > 0) this.$.setup.setCancelable(true);
    this.$.setup.reset();
    this.selectView(this.$.setup);
  },
  setupBlogs:function(sender, blogs, username, password){
    enyo.map(blogs, function(blog, index, blogs){
      this.accounts.push(enyo.mixin(blog, { username:username, password:password }));
    }, this);
    this.accountsChanged();
    this.selectView(this.$.panes);
  },
  showPanes:function(){
    this.selectView(this.$.panes);
  },
  gotComments:function(sender, response, request){
  }
});


enyo.mixin(enyo.application, {
  /*

  	404: do not load any image if none is associated with the email hash, instead return an HTTP 404 (File Not Found) response
  	mm: (mystery-man) a simple, cartoon-style silhouetted outline of a person (does not vary by email hash)
  	identicon: a geometric pattern based on an email hash
  	monsterid: a generated 'monster' with different colors, faces, etc
  	wavatar: generated faces with differing features and backgrounds
  	retro: awesome generated, 8-bit arcade-style pixelated faces

  */
  makeBlavatar:function(url, settings){
    var options = {
      size: '50',
      missing: '404'
    }
    enyo.mixin(options, settings);
    var domain = url.match(/^((https?)?:\/\/)?([^ \/]+)/).slice(-1)[0].trim();
    if (domain) {
      return "http://gravatar.com/blavatar/" + hex_md5(domain) + '?d=' + options.missing + '&s=' + options.size 
    }else{
      return false;
    }   
  },
  makeGravatar:function(email, settings){
    var options = {
      size: '50',
      missing: '404'
    }
    enyo.mixin(options, settings);

    if (typeof email == 'string') {
      return "http://gravatar.com/avatar/" + hex_md5(email.trim().toLowerCase()) + '?d=' + options.missing + '&s=' + options.size;
    }else{
      return false;
    }

  }
})
