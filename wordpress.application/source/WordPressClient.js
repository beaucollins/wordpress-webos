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
       
    onFailure:'',
    onBadUrl:'',
    
    onNewComment:'',
    onUpdateComment:'',
    onDeleteComment:'',
    onPendingComments:'',
    onRefreshComments:'',
    
    onNewPage:'',
    onUpdatePage:'',
    onSaveDraftPage:'',
    onDeletePage:'',
    onRefreshPages: '',
    
    onNewPost:'',
    onUpdatePost:'',
    onSaveDraft:'',
    onDeletePost:'',
    onRefreshPosts: '',
    
    onNewCategory:'',
    onUpdateCategory:'',
    
    onUploadComplete:'',
    onUploadFailed:''
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
    ] },
    { name:'uploader', kind:'PalmService', service:'palm://org.wordpress.webos.uploader/', method:'upload', onSuccess:'uploadCompleted', onFailure:'uploadFailed'}
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
    // console.log(enyo.json.stringify(response));
  },
  keystoreFailure:function(sender, response, request){
    // console.log("Keystore Failure!");
    // console.log(enyo.json.stringify(response));
  },
  missingPassword:function(sender, response, request){
    // console.log("Missing password bitches!: " + enyo.json.stringify(response));
    this.$.removeKey.call({keyname:this.passwordKeyName()});
  },
  setPasswordFromKey:function(sender, response, request){
    // console.log("Got the password from the key: " + enyo.json.stringify(response));
    this.account.password = enyo.string.fromBase64(response.keydata)
    this.setPassword(this.account.password);
    // console.log("We're ready!" + this.password);
    this.doPasswordReady();
  },
  // apiFault, either bad username/pass or API disabled
  apiFault:function(sender, response, request){
	this.log("apiFault", response, request);
	//if the response is null we can read the error status and the error message within the XHR obj. see WordPress.js
	  //if(this.cancelled == true) return;
    this.doFailure(response, request);
  },
  badURL:function(sender, response, request){
	  this.log("_badURL", response, request);
	//if the response is null we can read the error status and the error message within the XHR obj. see WordPress.js
	 // if(this.cancelled == true) return;
	 this.doBadURL(response, request);
  },
  downloadComments:function(){
    // we should page through comments until there are no more, or to a sane amount of comments
    // this should probably only be done when the account is added
    this.refreshComments();
  },
  downloadPosts:function(){
    this.$.http.callMethod({
      methodName: 'metaWeblog.getRecentPosts',
      methodParams: [this.account.blogid, this.account.username, this.password, 20]
    }, { url:this.account.xmlrpc, onSuccess:'savePosts',  onRequestFault:'apiFault', onFailure:'badURL' });
    
    this.$.http.callMethod({
        methodName: 'wp.getCategories',
        methodParams: [this.account.blogid, this.account.username, this.password]
      }, { url:this.account.xmlrpc, onSuccess:'saveCategories',  onRequestFault:'apiFault', onFailure:'badURL' });
  },
  saveCategories:function(sender, response, request){
	  var account = this.account;
	  var categories = response;
	  var client = this;
	  var category;
	  enyo.forEach(categories, function(cat){
		  account.categories.filter('categoryId', '=', cat.categoryId).one(function(existing){
			  if (!existing) {
				  var category = new enyo.application.models.Category(cat);
				  account.categories.add(category);
			  }else{
				  for(field in cat){
					  existing[field] = cat[field];
				  }
			  }
		  });
	  }, this);
	  
	  //remove categories from the local db that are not on the server anymore!!
	 if(categories) {
		 account.categories.list(function(storedCategories){
			 enyo.forEach(storedCategories, function(storedCategory){
				 var presence = false;
				 for(var i=0; i < categories.length; i++) {
					 if(storedCategory.categoryId == categories[i].categoryId)
						 presence=true;
				 }
				 if(presence == false){
					 console.log("Not Found: " + storedCategory.categoryName);
					 account.categories.remove(storedCategory);
				 }
			 }, this);    	 
			 enyo.application.persistence.flush(function(){ });
		 });
	 } else {
		 enyo.application.persistence.flush(function(){ });
	 }
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
			  } else {
				  // update the post
				  if (!existing.local_modifications) {
					  for(field in post){
						  existing[field] = post[field];
					  }
				  };
			  }
		  });
	  }, this);

	  //remove posts from the local db that are not on the server anymore!!
	  if(posts) {
		  account.posts.list(function(storedPosts){
			  enyo.forEach(storedPosts, function(storedPost){
				  var presence = false;
				  for(var i=0; i<posts.length; i++) {
					  if(storedPost.postid == posts[i].postid)
						  presence=true;
				  }
				  if(presence == false){
					  console.log("Not Found: " + storedPost.title);
					  account.posts.remove(storedPost);
				  }
			  }, this);
			  enyo.application.persistence.flush(function(){
				  client.doRefreshPosts(null, account);
			  });
		  });
	  } else {
		  enyo.application.persistence.flush(function(){
			  client.doRefreshPosts(null, account);
		  });
	  }
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
    post.local_modifications = true;
    console.log("Save draft");
    enyo.application.persistence.flush(function(){
      client.doSaveDraft(post, account);
      enyo.application.launcher.draftSaved();
    });
  },
  // saves local modifications
  // Page should be an instance of enyo.application.models.Page
  saveDraftPage:function(post){
    var client = this;
    var account = this.account;
    account.pages.add(post);
    post.local_modifications = true;
    console.log("Save draft Page");
    enyo.application.persistence.flush(function(){
      client.doSaveDraftPage(post, account);
      enyo.application.launcher.draftSaved();
    });
  },
  // download a sane number of posts
  downloadPages:function(){
    this.log("start loading pages from server");
    this.$.http.callMethod({
      methodName:'wp.getPages',
      methodParams:[this.account.blogid, this.account.username, this.password, 20]
    }, { url:this.account.xmlrpc, onSuccess:'savePages', onRequestFault:'apiFault', onFailure:'badURL' });
  },
  savePages:function(sender, response, request){
    var account = this.account;
    var pages = response;
    var client = this;

    enyo.forEach(pages, function(page){
      account.pages.filter('page_id', '=', page.page_id).one(function(existing){
        if (!existing) {
          var p = new enyo.application.models.Page(page);
          account.pages.add(p);
        }else{     
          for(field in page)
            existing[field] = page[field];
        }
      });
    }, this);
    //remove pages from the local db that are not on the server anymore!!
    if(pages) {    	
    	account.pages.list(function(storedPages){
    		enyo.forEach(storedPages, function(storedPage){
    			var presence = false;
    			for(var i=0; i < pages.length; i++) {
    				if(storedPage.page_id == pages[i].page_id)
    					presence=true;
    			}
    			if(presence == false){
    				console.log("Not Found: " + storedPage.title);
    				account.pages.remove(storedPage);
    			}
    		}, this);
    		enyo.application.persistence.flush(function(){
    			client.doRefreshPages(null,  account);
    		});
    	});
    } else {
    	enyo.application.persistence.flush(function(){
			client.doRefreshPages(null, account);
		});
    }
  },
  savePage:function(post){
	  var client = this;
	  var http = this.$.http;
	  var account = this.account;
	  if (post.page_id) {
		  return http.callMethod({
			  methodName:'wp.editPage',
			  methodParams:[account.blogid, post.page_id, account.username, account.password, post._data, false]
		  }, {onSuccess:'savePageSuccess', post:post, update:true, onRequestFault:'apiFault', onFailure:'badURL'});
	  }else{
		  this.log("sending the new page to the server");
		  return http.callMethod({
			  methodName:'wp.newPage',
			  methodParams:[account.blogid, account.username, client.password, post._data, false]
		  }, {onSuccess:'savePageSuccess', post:post, update:false, onRequestFault:'apiFault', onFailure:'badURL'});
	  };
  },
  savePageSuccess:function(sender, response, request){
	  this.log(">>>savePageSuccess", response);
	  // if it was a metaWeblog.editPost request response will be boolean true
	  // otherwise it will be the new id of the post
	  var post = request.post;
	  var client = this;
	  var account = this.account;
	  if(post.local_modifications) {
		  post.local_modifications = false;
	  }
	  
	  if(request.update) {
		  //check the response bool value
		  if(response === false) 
			  enyo.windows.addBannerMessage("Something went wrong!", "{}");
	  } else {
		  //this is a new page
		  post.page_id = response;
	  }
	    
	  account.pages.add(post);
	  enyo.application.persistence.flush(function(){
		  client.$.http.callMethod({
			  methodName:'wp.getPage',
			  methodParams:[account.blogid, post.page_id, client.account.username, client.password]
		  }, { url:account.xmlrpc, onSuccess:'refreshPage', post:post, update:false, onRequestFault:'apiFault', onFailure:'badURL' })
	  });
  },
  refreshPage:function(sender, response, request){
	  this.log(">>>refreshPage");
	  var post = request.post;
	  var client = this;
	  var account = this.account;
	  for(field in response){
		  post[field] = response[field];
	  }
	  enyo.application.persistence.flush(function(){
		  if (request.update) {
			  client.doUpdatePage(post, account);
		  }else{
			  client.doNewPage(post, account);
		  }
	  })
  },
  deletePage:function(post){
	  this.log(">>>deletePage");
	  var client = this;
	  var http = this.$.http;
	  var account = this.account;
	  if (post.page_id) {
		  return http.callMethod({
			  methodName:'wp.deletePage',
			  methodParams:[account.blogid, account.username, account.password, post.page_id]
		  }, {onSuccess:'deletePageSuccess', post:post, onRequestFault:'apiFault', onFailure:'badURL'});
	  }
  },
  deletePageSuccess:function(sender, response, request){
	  this.log(">>>deletePageSuccess");
	  var client = this;
	  var account = this.account;
	  var post = request.post;
	  enyo.application.models.Page.all().remove(post);
	  enyo.application.persistence.flush(function(){
		  client.doDeletePage(post, account);
	  });
  },
  savePost:function(post){
	  var client = this;
	  var http = this.$.http;
	  var account = this.account;
	  // this post exists already
	  if (post.postid) {
		  // mw.method('editPost', 'post_id', 'username', 'password', 'content', 'publish');
		  return http.callMethod({
			  methodName:'metaWeblog.editPost',
			  methodParams:[post.postid, account.username, account.password, post._data, false]
		  }, {onSuccess:'savePostSuccess', post:post, update:true, onRequestFault:'apiFault', onFailure:'badURL'});
	  }else{
		  this.log("sending the new post to the server");
		  return http.callMethod({
			  //     mw.method('newPost', 'blog_id', 'username', 'password', 'content', 'publish');
			  methodName:'metaWeblog.newPost',
			  methodParams:[account.blogid, account.username, client.password, post._data, false]
		  }, {onSuccess:'savePostSuccess', post:post, update:false, onRequestFault:'apiFault', onFailure:'badURL'});
	  };
  },
  savePostSuccess:function(sender, response, request){
	this.log(">>>savePostSuccess", response);
	  // if it was a metaWeblog.editPost request response will be boolean true
    // otherwise it will be the new id of the post
    var post = request.post;
    var client = this;
    var account = this.account;
    if(post.local_modifications) {
    	post.local_modifications = false;
    }
    
    if(request.update) {
    	//check the response bool value
    	if(response === false) 
    		 enyo.windows.addBannerMessage("Something went wrong!", "{}");
    } else {
    	//this is a new post
    	post.postid = response;
    }
    
    account.posts.add(post);
    enyo.application.persistence.flush(function(){
      client.$.http.callMethod({
        methodName:'metaWeblog.getPost',
        methodParams:[post.postid, client.account.username, client.password]
      }, { url:account.xmlrpc, onSuccess:'refreshPost', post:post, update:false, onRequestFault:'apiFault', onFailure:'badURL' })
    });
  },
  refreshPost:function(sender, response, request){
	  this.log(">>>refreshPost");
	  var post = request.post;
	  var client = this;
	  var account = this.account;
	  for(field in response){
		  post[field] = response[field];
	  }
	  
	  enyo.application.persistence.flush(function(){
		  if (request.update) {
			  client.doUpdatePost(post, account);
		  }else{
			  client.doNewPost(post, account);
		  }
	  });
  },
  deletePost:function(post){
	  this.log(">>>deletePost");
	  var client = this;
	  var http = this.$.http;
	  var account = this.account;
	  if (post.postid) {
		  return http.callMethod({
			  methodName:'metaWeblog.deletePost',
			  methodParams:["unused", post.postid, account.username, account.password, false]
		  }, {onSuccess:'deletePostSuccess', post:post, onRequestFault:'apiFault', onFailure:'badURL'});
	  }
  },
  deletePostSuccess:function(sender, response, request){
	  this.log(">>>deletePostSuccess");
	  var client = this;
	  var account = this.account;
	  var post = request.post;
	  if (post._type === "Page")
		  enyo.application.models.Page.all().remove(post);
	  else
		  enyo.application.models.Post.all().remove(post);
	  
	  enyo.application.persistence.flush(function(){
		  client.doDeletePost(post, account);
	  });
  },
  updatePostSuccess:function(sender, response, request){
	this.log(">>>AAA: ping danilo if this function is called somewhere! Saved the post!", response);
    var post = request.post;
    var client = this;
    var account = this.account;
    //reload the post from the api
    enyo.windows.addBannerMessage($L("Post updated successfully"), "{}");
    
    this.$.http.callMethod({
      methodName:'metaWeblog.getPost',
      methodParams:[post.postid, account.username, this.password]
    }, { url:account.xmlrpc, onSuccess:'refreshPost', post:post, update:true, onRequestFault:'apiFault', onFailure:'badURL'})
  },
  onSavePost:function(sender, response, request){
    this.log(">>>AAA: ping danilo if this function is called somewhere! Saved the post!", response);
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
    // console.log(enyo.json.stringify(response));
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
    }, { url:this.account.xmlrpc, onSuccess:'publishCommentSuccess', comment:comment, onRequestFault:'apiFault', onFailure:'badURL' }); 
  },
  publishCommentSuccess:function(sender, response, request){
    console.log("Success!", response);
    var comment = request.comment;
    comment.comment_id = response;
    comment.date_created_gmt = new Date();
    var client = this;
    enyo.application.persistence.flush(function(){
      client.getComment(comment.comment_id);
    });
    console.log("Comment has an id now", comment.comment_id, comment);
  },
  getComment:function(comment_id){
	this.$.http.callMethod({
      methodName:'wp.getComment',
      methodParams:[this.account.blogid, this.account.username, this.account.password, comment_id]
    }, { url:this.account.xmlrpc, onSuccess:'getCommentSuccess', onRequestFault:'apiFault', onFailure:'badURL' });
  },
  getCommentSuccess:function(sender, response, success){
	this.log("getCommentSuccess ", response);
    var account = this.account;
    var client = this;
    account.comments.filter('comment_id', '=', response.comment_id).one(function(comment){
      if (comment) {
        for(field in response){
          comment[field] = response[field];
        }
        enyo.application.persistence.flush(function(){
          client.doUpdateComment(comment, account);
        });
      }else{
        comment = new enyo.application.models.Comment(response)
        account.comments.add(comment);
        enyo.application.persistence.flush(function(){
          client.doNewComment(comment, account);
        });
      }
      
    });
  },
  updateComment:function(comment){
    console.log("Edit comment", comment._data);
    this.$.http.callMethod({
      methodName:'wp.editComment',
      methodParams: [this.account.blogid, this.account.username, this.password, comment.comment_id, comment._data]
    }, { url:this.account.xmlrpc, onSuccess:'commentUpdated', comment:comment, onRequestFault:'apiFault', onFailure:'badURL'} );
  },
  commentUpdated:function(sender, response, request){
    //console.log("Comment updated - request:", request);
    //console.log("Comment updated - response:", response);
    var client = this;
    enyo.application.persistence.flush(function(){
      enyo.windows.addBannerMessage($L("Comment updated"), "{}");
      client.doUpdateComment(request.comment);
      client.refreshPendingCommentCount();
    });
  },
  deleteComment:function(comment){
 //   console.log("Deleting comment", comment._data);
    this.$.http.callMethod({
      methodName:'wp.deleteComment',
      methodParams: [this.account.blogid, this.account.username, this.password, comment.comment_id]
    }, { url:this.account.xmlrpc, onSuccess:'commentDeleted',  comment:comment, onRequestFault:'apiFault', onFailure:'badURL'} );
  },
  commentDeleted:function(sender, response, request){
//	console.log("Deleted comment", request.comment);
    var client = this;
    this.account.comments.remove(request.comment);
    enyo.application.persistence.flush(function(){
      client.doDeleteComment();
      client.refreshPendingCommentCount();
    });
  },
  refreshComments:function(skip_notifications){ //call checkNewComments on success
    var options = {};
    this.$.getComments.callMethod({
      methodParams:[this.account.blogid, this.account.username, this.password, options]
    }, { url: this.account.xmlrpc, skip_notifications:skip_notifications, onRequestFault:'apiFault', onFailure:'badURL' } );
  },
  checkNewComments:function(sender, response, request){
    var account = this.account;
    var client = this;
    enyo.forEach(response, function(comment){
      // first see if we have the comment already in this account
      // check by the comment's id
      // account.comments.add(new Comment(comment));
      account.comments.filter('comment_id', '=', comment.comment_id).one(function(existing){
        if (!existing) {
          var c = new enyo.application.models.Comment(comment);
          account.comments.add(c);
          if(request.skip_notifications !== true){
        	  enyo.application.commentDashboard.notifyComment(c, account)
          }else{
        	  console.log("Skipping notifications");
          }
        }else{
          //let's just update the content
          // this should work, Persistence doesn't have any documentation for mass assigning properties
          // console.log("It exists!", existing);
          for(field in comment){
            existing[field]=comment[field];
          }

        }
      });
    });
    
    //remove comments from the local db that are not on the server anymore!!
    if(response) {
    	account.comments.list(function(storedComments){
    		enyo.forEach(storedComments, function(storedComment){
    			var presence = false;
    			for(var i=0; i < response.length; i++) {
    				if(storedComment.comment_id == response[i].comment_id)
    					presence=true;
    			}
    			if(presence == false){
    				console.log("Not Found Comment: " + storedComment.comment_id);
    				account.comments.remove(storedComment);
    			}
    		}, this);    	 
    		enyo.application.persistence.flush(function(){
    			client.doRefreshComments(null, account);
    			client.refreshPendingCommentCount();
    		});
    	});    
    } else {
    	enyo.application.persistence.flush(function(){
    		client.doRefreshComments(null, account);
    		client.refreshPendingCommentCount();
    	});
    }
  },
  refreshPendingCommentCount:function(){
    var client = this;
    if(this.account.comments)
	    this.account.comments.filter('status','=','hold').count(function(count){
	      client.setPendingCommentCount(count);
	    });
  },
  pendingCommentCountChanged:function(){
    this.doPendingComments(this.pendingCommentCount);
  },
  uploadCompleted:function(sender, response, request){
    console.log("Upload completed!");
    // parse the response XML here
    var response_object = XMLRPCParser.parse(response.xml);
    console.log(enyo.json.stringify(response_object));
    if(response_object.fault){
      this.doUploadFailed(response_object);
    }else{
      this.doUploadComplete(response_object);
    }  
  },
  uploadFailed:function(sender, response, request){
    console.log("Upload failed");
    console.log(enyo.json.stringify(response));
    this.doUploadFailed();
  }
})