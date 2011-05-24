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
    password:'',
    pendingCommentCount:0
  },
  events: {
    onPasswordReady:'',
    onInvalidPassword:'',
    onNewComment:'',
    onUpdateComment:'',
    onNewPost:'',
    onUpdatePost:'',
    onNewPage:'',
    onUpdatePage:'',
    onPendingComments:'',
    onSavePost:'',
    onSaveDraft:''
  },
  kind: 'Component',
  components: [
    { name:'http', kind:'XMLRPCService', onRequestFault:'wordpressApiFault', onFailure:'wordpressApiFailure', components:[
      { name:'getComments', methodName:'wp.getComments', onSuccess:'checkNewComments' }
    ] },
    { name:'keystore', kind:'PalmService', service:'palm://com.palm.keymanager/', onSuccess:'keystoreSuccess', onFailure:'keystoreFailure', components:[
      { name: 'fetchKey', method:'fetchKey', onFailure:'missingPassword', onSuccess:'setPasswordFromKey' },
      { name: 'storeKey', method:'store', onSuccess:'doPasswordReady' },
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
      // console.log("No password, get it from the keystore");
      this.$.fetchKey.call({
        "keyname" : this.passwordKeyName()
      });
    }else{
      this.setPassword(this.account.password);
      this.doPasswordReady()
    }
    
    this.refreshPendingCommentCount();
  },
  // @private
  passwordKeyName:function(){
    var name = (this.account.username + "@" + this.account.xmlrpc.replace(/https?:\/\//,'')).toLowerCase();
    // console.log("Password Key: " + name);
    return name;
  },
  keystoreSuccess:function(sender, response, request){
    // console.log("Keystore Success!");
    // console.log(enyo.json.to(response));
  },
  keystoreFailure:function(sender, response, request){
    // console.log("Keystore Failure!");
    // console.log(enyo.json.to(response));
  },
  missingPassword:function(sender, response, request){
    // console.log("Missing password bitches!: " + enyo.json.to(response));
    this.$.removeKey.call({keyname:this.passwordKeyName()});
  },
  setPasswordFromKey:function(sender, response, request){
    // console.log("Got the password from the key: " + enyo.json.to(response));
    this.account.password = enyo.string.fromBase64(response.keydata)
    this.setPassword(this.account.password);
    // console.log("We're ready!" + this.password);
    this.doPasswordReady();
  },
  downloadComments:function(){
    // we should page through comments until there are no more, or to a sane amount of comments
    // this should probably only be done when the account is added
    this.refreshComments();
  },
  // download a sane number of posts
  downloadPages:function(){
    this.$.http.callMethod({
      methodName:'wp.getPages',
      methodParams:[this.account.blogid, this.account.username, this.password, 100]
    }, { url:this.account.xmlrpc, onSuccess:'savePages' });
  },
  updateComment:function(comment){
    // console.log("Edit comment", comment._data);
    this.$.http.callMethod({
      methodName:'wp.editComment',
      methodParams: [this.account.blogid, this.account.username, this.password, comment.comment_id, comment._data],
      comment:comment
    }, { url:this.account.xmlrpc, onSuccess:'commentUpdated' } );
  },
  commentUpdated:function(sender, response, request){
    // console.log("Comment updated:", request);
    var client = this;
    enyo.application.persistence.flush(function(){
      client.doUpdateComment(request.comment);
      client.refreshPendingCommentCount();
    });
  },
  savePages:function(semder, response, request){
    var account = this.account;
    var pages = response;
    var client = this;
    enyo.forEach(pages, function(page){
      account.pages.filter('page_id', '=', page.page_id).one(function(existing){
        if (!existing) {
          var p = new enyo.application.models.Page(page);
          account.pages.add(p);
          enyo.application.persistence.flush(function(){
            client.doNewPage(p, account);
          });
        }else{
          
          for(field in page){
            existing[field] = page[field];
          }
          enyo.application.persistence.flush(function(){
            client.doUpdatePage(existing, account);
          });
        }
      });
    }, this);
  },
  downloadPosts:function(){

    this.$.http.callMethod({
      methodName: 'metaWeblog.getRecentPosts',
      methodParams: [this.account.blogid, this.account.username, this.password, 100]
    }, { url:this.account.xmlrpc, onSuccess:'savePosts' });
  },
  savePosts:function(sender, response, request){

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
          
          enyo.application.persistence.flush(function(){
            client.doUpdatePost(existing, account);
          });
          
        }
      });
    }, this);
  },
  refreshComments:function(){
    var options = {};
    this.$.getComments.callMethod({
      methodParams:[this.account.blogid, this.account.username, this.password, options]
    }, { url: this.account.xmlrpc } );
  },
  checkNewComments:function(sender, response, request){
    var account = this.account;
    var client = this;
    enyo.forEach(response, function(comment){
      // first see if we have the comment already in this account
      // check by the comment's id
      // account.comments.add(new Comment(comment));
      console.log("Checking for a comment with id: ", comment.comment_id);
      account.comments.filter('comment_id', '=', comment.comment_id).one(function(existing){
        if (!existing) {
          var c = new enyo.application.models.Comment(comment);
          account.comments.add(c);
          enyo.application.persistence.flush(function(){
          	
            enyo.application.commentDashboard.notifyComment(c, account);
            client.doNewComment(c, account);
            client.refreshPendingCommentCount();
          });
        }else{
          //let's just update the content
          // this should work, Persistence doesn't have any documentation for mass assigning properties
          // console.log("It exists!", existing);
          for(field in comment){
            existing[field]=comment[field];
          }
          enyo.application.persistence.flush(function(){
            client.doUpdateComment(existing, account);
            client.refreshPendingCommentCount();
          });
        }
      });
    });
  },
  refreshPendingCommentCount:function(){
    var client = this;
    this.account.comments.filter('status','=','hold').count(function(count){
      client.setPendingCommentCount(count);
    });
  },
  pendingCommentCountChanged:function(){
    this.doPendingComments(this.pendingCommentCount);
  },
  savePassword:function(onSuccess){
    var options = {}
    if(onSuccess) options.onSuccess = onSuccess;
    // console.log("Saving password: " + this.password);
    this.$.storeKey.call({
      'keyname' : this.passwordKeyName(),
      'keydata' : enyo.string.toBase64(this.password),
      'type' : 'AES',
      'nohide' : true
    }, options);
  },
  // saves local modifications
  // Post should be an instance of enyo.application.models.Post
  saveDraft:function(post){
    var client = this;
    var account = this.account;
    account.posts.add(post);
    enyo.application.persistence.flush(function(){
      client.doSaveDraft(post, account);
    });
  },
  savePost:function(post){
		
    var client = this;
    var http = this.$.http;
    var account = this.account;
    // this posts exists already
    if (post.postid) {
      // mw.method('editPost', 'post_id', 'username', 'password', 'content', 'publish');
      return http.callMethod({
        methodName:'metaWeblog.editPost',
        methodParams:[post.postid, account.username, account.password, post, false]
      }, {onSuccess:'savePostSuccess', post:post});
    }else{
      return http.callMethod({
        //     mw.method('newPost', 'blog_id', 'username', 'password', 'content', 'publish');
        methodName:'metaWeblog.newPost',
        methodParams:[account.blogid, account.username, client.password, post._data, false]
      }, {onSuccess:'savePostSuccess', post:post});
    };
  },
  savePostSuccess:function(sender, response, request){
    // if it was a metaWeblog.editPost request response will be boolean true
    // otherwise it will be the new id of the post
    var post = request.post;
    var client = this;
    var account = this.account;
    if (response === true) {
      
    }else{
      post.postid = response;
      account.posts.add(post);
      enyo.application.persistence.flush(function(){
        client.doSavePost(post, account);
      });
    }
  },
  onSavePost:function(sender, response, request){
    console.log("Saved the post!", response);
    var post = response;
    this.doSavePost(post, this.account);
  },
  wordpressApiFault:function(sender, response, request){
    // bad password/username
    if (response.faultCode == 403) {
      // delete the password
      this.$.removeKey.call({keyname:this.passwordKeyName()});
    };
  },
  wordpressApiFailure:function(sender, response, request){
    // console.log("API Failure!");
    // console.log(enyo.json.to(response));
    this.$.removeKey.call({keyname:this.passwordKeyName()});
  },
  newComment:function(comment){
    console.log("Publishing new comment", comment);
    this.account.comments.add(comment);
    return this.$.http.callMethod({
      methodName:'wp.newComment',
      methodParams:[
        this.account.blogid,
        this.account.username,
        this.password,
        comment.post_id,
        comment._data
      ] // methodParams
    }, { url:this.account.xmlrpc, onSuccess:'publishCommentSuccess', comment:comment });
    
  },
  publishCommentSuccess:function(sender, response, request){
    console.log("Success!", response);
    var comment = request.comment;
    comment.comment_id = response;
    comment.date_created_gmt = new Date();
    var client = this;
    enyo.application.persistence.flush(function(){
      client.refreshComments();
    });
    console.log("Comment has an id now", comment.comment_id, comment);
  }
  
  
})