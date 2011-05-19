/*
 WordPress application root
*/
enyo.kind({
  name: 'wp.WordPress',
  kind: 'Pane',
  className: 'enyo-bg',
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
    { name: 'stats_api', kind: 'WebService', method: 'POST', url: 'https://api.wordpress.org/webosapp/update-check/1.0/' },
    // main sliding pane interface
    {
      name: 'panes',
      kind: 'enyo.SlidingPane',
      flex: 1,
      multiViewMinWidth:500,
      components: [
        { name:'left', width:'225px', components:[
          { name:'sourceList', kind:'wp.SourceList', flex:1, onSelectAccountAction:'performAccountAction', onCreateDraft:'composeDraft', onAddBlog:'addNewBlog' }
        ]},
        // column for showing what is selected from the source list
        { name:'main', flex:1, onResize:'resizeSubviews', peekWidth:42, components:[
            { name:'content', flex:1, kind:'Pane', onSelectView:'setupSubView', components:[
              { name:'blank', kind:'Control', flex:1 },
              { name:'comments', kind: 'wp.Comments', flex:1, lazy:true },
              { name:'posts', kind: 'wp.Posts', flex:1, lazy:true },
              { name:'pages', kind: 'wp.Posts', methodName:'wp.getPages', flex:1, lazy:true },
              { name:'stats', kind: 'wp.Stats', flex:1, lazy:true },
              { name:'drafts', kind: 'Control', flex:1, lazy:true, style:'background:-webkit-gradient(linear, left top, left bottom, from(#000), to(#FFF));'},
            ]}
        ]}
    ]},
    { name: 'setup', kind: 'wp.AccountSetup', onSelectBlogs:'setupBlogs', onCancel:'showPanes' },
    { kind:'AppMenu', components:[
      {name: "edit", kind: "EditMenu"},
      {name: 'setupMenuItem', caption: 'Setup Blog', onclick:'addNewBlog' }
    ]}
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
    
    this.runStats();
  },
  performAccountAction: function(sender, action, account){
    this.activeAccount = account;
    if (action == 'Comments') {
      this.$.content.selectViewByName('comments');      
    };
    if (action == 'Posts') {
      this.$.content.selectViewByName('posts');
    };
    if (action == 'Pages') {
      this.$.content.selectViewByName('pages');
    };
    if (action == 'Drafts') {
      this.$.content.selectViewByName('drafts');
    };
    if (action == 'Stats') {
      this.$.content.selectViewByName('stats');
    };
    if (!this.$.panes.multiView) {
      this.$.panes.selectView(this.$.main);
    };
  },
  setupSubView:function(sender, view){
    if (view.name == 'comments' || view.name == 'posts' || view.name == 'pages' || view.name == 'stats') {
      view.setAccount(this.activeAccount);
    };
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
  resizeSubviews: function(){
    if (this.$.comments) this.$.comments.resize();
    if (this.$.posts) this.$.posts.resize();
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
  // if given a post, then creating a draft based on that post
  // the sender should have an associated account that we will
  // link up by xmlrpc url for now
  composeDraft:function(sender, inEvent, post, options){
    //launches a new window with the compose view
	this.log("post",post);
	this.log("options", options);
	params = {'account': this.activeAccount};
    enyo.mixin(params, options);
	this.log("params", params);
    var composeLabel = Math.round(Math.random() * 100); // just for fun
    enyo.windows.activate("compose-" + composeLabel, "./compose/index.html", params);
  },
  openAppMenuHandler: function() {
      this.$.appMenu.open();
  },
  closeAppMenuHandler: function() {
      this.$.appMenu.close();
  },
  runStats: function() {
      var lastRun = Date.parse(enyo.getCookie('statsLastRun'));
      var now = new Date();
      var daysSinceLastRun = 100;
      if (lastRun) {
          console.log('Last time we sent stats: ' + lastRun);
          daysSinceLastRun = (now.getTime() - lastRun) / (1000 * 86400);
      }
      if (daysSinceLastRun >= 7) {
          var statsParams = {
              appVersion: enyo.fetchAppInfo().version,
          };
          var deviceInfo = enyo.fetchDeviceInfo();
          if (deviceInfo) {
              statsParams.deviceInfo = deviceInfo;
          }
          console.log('Sending info to Stats API: ' + this.$.stats_api.url);
          // console.log('data => ' + enyo.json.stringify(statsParams));
          this.$.stats_api.call(statsParams);
          enyo.setCookie('statsLastRun', new Date());          
      }
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
