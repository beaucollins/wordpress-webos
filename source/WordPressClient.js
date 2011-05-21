/*

The main interface for the XML-RPC API. All WordPress API calls should go through here

Published properties:

account: this should be an instance of persistence.Account or similar JavaScript object

*/

enyo.kind({
  name: 'wp.WordPressClient',
  kind: enyo.Component,
  published: {
    account:null,
    password:''
  },
  events: {
    onInvalidPassword:'',
    onNewComment:'',
    onNewPost:'',
    onNewPage:''
  },
  kind: 'Component',
  components: [
    { name:'http', kind:'XMLRPCService', onRequestFault:'wordpressApiFault', onFailure:'wordpressApiFailure', components:[
      { name:'getComments', methodName:'wp.getComments', onSuccess:'checkNewComments' }
    ] },
    { name:'keystore', kind:'PalmService', service:'palm://com.palm.keymanager/', onSuccess:'keystoreSuccess', onFailure:'keystoreFailure', components:[
      { name: 'fetchKey', method:'fetchKey', onFailure:'missingPassword', onSuccess:'setPasswordFromKey' },
      { name: 'storeKey', method:'store' },
      { name: 'removeKey', method:'remove', onSuccess:'doInvalidPassword', onFailure:'doInvalidPassword' }
    ] }
  ],
  create:function(){
    this.inherited(arguments);
    this.accountChanged();
  },
  accountChanged:function(){
    // if there isn't an account set then do nothing
    if(!this.account) return;
    this.$.http.setUrl(this.account.xmlrpc);
    // load up the password?
    if (!this.account.password) {
      console.log("No password, get it from the keystore");
      this.$.fetchKey.call({
        "keyname" : this.passwordKeyName()
      });
    }else{
      this.setPassword(this.account.password);
    }
  },
  getDashboard:function(){
    if(!this.dashboard){
      this.dashboard = this.createComponent({
        kind:'enyo.Dashboard',
        name:'wp_comment_notification'
      });
    }
    return this.dashboard;
  },
  // @private
  passwordKeyName:function(){
    var name = (this.account.username + "@" + this.account.xmlrpc.replace(/https?:\/\//,'')).toLowerCase();
    console.log("Looking up password: " + name);
    return name;
  },
  keystoreSuccess:function(sender, response, request){
    console.log("Success!");
    console.log(enyo.json.to(response));
  },
  keystoreFailure:function(sender, response, request){
    console.log("Failure!");
    console.log(enyo.json.to(response));
  },
  missingPassword:function(sender, response, request){
    enyo.windows.addBannerMessage("Invalid password for " + this.account.blogName, "{}" );
    this.$.removeKey.call({keyname:this.passwordKeyName()});
  },
  setPasswordFromKey:function(sender, response, request){
    console.log("Got the password from the key: " + enyo.json.to(response));
    this.setPassword(this.account.password = enyo.string.fromBase64(response.keydata));
  },
  downloadComments:function(){
    // we should page through comments until there are no more, or to a sane amount of comments
    // this should probably only be done when the account is added
  },
  // download a sane number of posts
  downloadPages:function(){
    console.log("Download pages! Now");
    this.$.http.callMethod({
      methodName:'wp.getPages',
      methodParams:[this.account.blogid, this.account.username, this.password, 100]
    }, { url:this.account.xmlrpc, onSuccess:'savePages' });
  },
  savePages:function(semder, response, request){
    console.log("PAGE!", response);
    var account = this.account;
    var pages = response;
    var client = this;
    enyo.forEach(pages, function(page){
      console.log("Looking up the page", page);
      account.pages.filter('page_id', '=', page.page_id).one(function(existing){
        if (!existing) {
          console.log("Creating new page");
          var p = new enyo.application.models.Page(page);
          account.pages.add(p);
          enyo.application.persistence.flush(function(){
            client.doNewPage(p, account);
          });
        }else{
          console.log("Page exists?", existing);
          
          for(field in page){
            existing[field] = page[field];
          }
          enyo.application.persistence.flush();
        }
      });
    }, this);
  },
  downloadPosts:function(){
    console.log("Downloading pages!");
    this.$.http.callMethod({
      methodName: 'metaWeblog.getRecentPosts',
      methodParams: [this.account.blogid, this.account.username, this.password, 100]
    }, { url:this.account.xmlrpc, onSuccess:'savePosts' });
  },
  savePosts:function(sender, response, request){
    console.log("Downloaded posts", response);
    var account = this.account;
    var posts = response;
    var client = this;
    enyo.forEach(posts, function(post){
      // first find the post by id
      // if the post doesn't exist create a new one
      account.posts.filter('postid', '=', post.postid).one(function(existing){
        if (!existing) {
          // create it and save it
          var p = new enyo.application.models.Post(post);
          account.posts.add(p);
          enyo.application.persistence.flush(function(){
            client.doNewPost(p, account);
          });
        }else{
          
          // update the post
          for(field in post){
            existing[field] = post[field];
          }
          
          enyo.application.persistence.flush();
          
        }
      });
    }, this);
  },
  refreshComments:function(){
    var options = {};
    console.log("Getting comments", [this.account.blogid, this.account.username, this.password, options] );
    this.$.getComments.callMethod({
      methodParams:[this.account.blogid, this.account.username, this.password, options]
    }, { url: this.account.xmlrpc } );
  },
  checkNewComments:function(sender, response, request){
    var account = this.account;
    var client = this;
    var dash = client.getDashboard();
    enyo.forEach(response, function(comment){
      // first see if we have the comment already in this account
      // check by the comment's id
      // account.comments.add(new Comment(comment));
      account.comments.filter('comment_id', '=', comment.comment_id).one(function(existing){
        if (!existing) {
          var c = new enyo.application.models.Comment(comment);
          account.comments.add(c);
          enyo.application.persistence.flush(function(){
          	
            enyo.application.commentDashboard.notifyComment(c, account);
            client.doNewComment(c, account);
          });
        }else{
          //let's just update the content
          // this should work, Persistence doesn't have any documentation for mass assigning properties
          for(field in comment){
            existing[field]=comment[field];
          }
          enyo.application.persistence.flush();
        }
      });
    });
  },
  savePassword:function(onSuccess){
    var options = {}
    if(onSuccess) options.onSuccess = onSuccess;

    this.$.storeKey.call({
      'keyname' : this.passwordKeyName(),
      'keydata' : enyo.string.toBase64(this.password),
      'type' : 'AES',
      'nohide' : true
    }, options);
  },
  wordpressApiFault:function(sender, response, request){
    // bad password/username
    if (response.faultCode == 403) {
      // delete the password
      this.doInvalidPassword();
    };
  },
  wordpressApiFailure:function(sender, response, request){
    console.log("API Failure!");
    console.log(enyo.json.to(response));
    this.$.removeKey.call({keyname:this.passwordKeyName()});
  }
})