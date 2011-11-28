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
    onBadURL:'',
    
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
    { name:'uploader', kind:'PalmService', service:'palm://org.wordpress.webos.uploader.service/', method:'upload', onSuccess:'uploadCompleted', onFailure:'uploadFailed'}
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
  downloadPosts:function(number){
    if (!number) { number = 20};
    this.$.http.callMethod({
      methodName: 'metaWeblog.getRecentPosts',
      methodParams: [this.account.blogid, this.account.username, this.password, number]
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
	  var client = this;
	  var account = this.account;
	  var remote_posts = response;
	  var persistence = enyo.application.persistence;
	  
	  var remote_post_ids = enyo.map(remote_posts, function(post){ return post.postid; });
	  account.posts.filter('postid', 'in', remote_post_ids).list(function(local_posts){
	    var local_posts_index = {};
	    // create the index
	    enyo.map(local_posts, function(post){ local_posts_index[post.postid] = post; });
	    enyo.map(remote_posts, function(remote_post){
	      var local_post;
	      if (local_post = local_posts_index[remote_post.postid]) {
	        // already exists locally
	        if (!local_post.local_modifications) {
	          for (field in remote_post) {
	           local_post[field] = remote_post[field]
	          };
	        }
	      } else {
	        local_post = new enyo.application.models.Post(remote_post);
	        account.posts.add(local_post);
	      }
	      
	    }, client);
	    
	    account.posts.filter('postid', 'not in', remote_post_ids).list(function(old_local_posts){
  		
  		 for(var removeIndex = 0; removeIndex < old_local_posts.length; removeIndex++) {
  			  var candidateToBeRemoved = old_local_posts[removeIndex];
  		        if (candidateToBeRemoved.local_modifications) {
  		        	//local draft
  		        } else {
  		        	//remove this post
  		        	account.posts.remove(old_local_posts[removeIndex]);		        	
  		        }
  		  }
  		  persistence.flush(function(){
  			  client.doRefreshPosts();
  		  });
  	  });
	    
	  });
	    
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
	  post.local_modifications = true;
	  account.posts.add(post);
	  enyo.application.persistence.flush(function(){
		  client.doSaveDraft(post, account);
		  enyo.application.launcher.draftSaved();
	  });
  },
  // saves local modifications
  // Page should be an instance of enyo.application.models.Page
  saveDraftPage:function(page){
	  var client = this;
	  var account = this.account;
	  page.local_modifications = true;
	  account.pages.add(page);
	  enyo.application.persistence.flush(function(){
		  client.doSaveDraft(page, account);
		  enyo.application.launcher.draftSaved();
	  });
  },
  // download a sane number of posts
  downloadPages:function(number){
    if (!number) number = 20;
    this.log("start loading pages from server");
    this.$.http.callMethod({
      methodName:'wp.getPages',
      methodParams:[this.account.blogid, this.account.username, this.password, number]
    }, { url:this.account.xmlrpc, onSuccess:'savePages', onRequestFault:'apiFault', onFailure:'badURL', pageRequestCount:number });
  },
  savePages:function(sender, response, request){

	  var client = this;
	  var account = this.account;
	  var remote_pages = response;
	  var persistence = enyo.application.persistence;

	  var remote_page_ids = enyo.map(remote_pages, function(post){ return post.page_id; });
	  account.pages.filter('page_id', 'in', remote_page_ids).list(function(local_pages){
		  var local_pages_index = {};
		  // create the index
		  enyo.map(local_pages, function(page){ local_pages_index[page.page_id] = page; });
		  enyo.map(remote_pages, function(remote_page){
			  var local_page;
			  if (local_page = local_pages_index[remote_page.page_id]) {
				  // already exists locally
				  if (!local_page.local_modifications) {
					  for (field in remote_page) {
						  local_page[field] = remote_page[field]
					  };
				  }
			  } else {
				  local_page = new enyo.application.models.Page(remote_page);
				  account.pages.add(local_page);
			  }

		  }, client);

		  account.pages.filter('page_id', 'not in', remote_page_ids).list(function(old_local_pages){
			  for(var removeIndex = 0; removeIndex < old_local_pages.length; removeIndex++) {
				  var candidateToBeRemoved = old_local_pages[removeIndex];
				  if (candidateToBeRemoved.local_modifications) {
					  //local drafts, do not remove here
				  } else {
					  //this page should be removed
					  account.pages.remove(old_local_pages[removeIndex]);		        	
				  }
			  }
			  persistence.flush(function(){
				  client.doRefreshPages();
			  });
		  });

	  });
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

	  if(request.update) {
		  //check the response bool value
		  if(response === false) 
			  enyo.windows.addBannerMessage("Something went wrong!", "{}");
	  } else {
		  //this is a new page
		  post.page_id = response;
	  }

	  //if this post is a local draft of a previous published post we should remove it from the local storage and update the 'original' version of the post   
	  if(post.local_modifications == null || post.local_modifications == 'false') {

	  } else {
		  //find and update the original version
		  account.pages.filter('page_id', '=', post.page_id)  
		  .filter('local_modifications', '=', null) //we must filter the local drafts here
		  .one(function(existing){
			  if (existing) {
				  client.log("removed the original page",existing.id );
				  enyo.application.models.Page.all().remove(existing);
			  } else {
				  client.log("original page not found");
			  }
		  });
	  }
	  
	  post.local_modifications = null;
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
    if(request.update) {
    	//check the response bool value
    	if(response === false) 
    		 enyo.windows.addBannerMessage("Something went wrong!", "{}");
    } else {
    	//this is a new post
    	post.postid = response;
    }
    
    //if this post is a local draft of a previous published post we should remove it from the local storage and update the 'original' version of the post   
    if(post.local_modifications == null || post.local_modifications == 'false') {
    	this.log("this is NOT a local draft");
    } else {
    	this.log("this IS a local draft");
    	//find and update the original version
    	account.posts.filter('postid', '=', post.postid)  
    	.filter('local_modifications', '=', null) //we must filter the local drafts here
    	.one(function(existing){
    		if (existing) {
    			client.log("removed the original",existing.id );
    			enyo.application.models.Post.all().remove(existing);
    		} else {
    			client.log("original not found");
    		}
    	});
    }

    post.local_modifications = null;
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
    if (response && response.faultCode == 403) {
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
    this.account.comments.add(comment);
    var struct = comment._data;
    struct.comment_parent = struct.parent;
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
    enyo.windows.addBannerMessage($L("Comment published successfully"), "{}");
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
      client.doDeleteComment(request.comment);
      client.refreshPendingCommentCount();
    });
  },
  refreshComments:function(skip_notifications){ //call checkNewComments on success
    var options = {};
    this.$.getComments.callMethod({
      methodParams:[this.account.blogid, this.account.username, this.password, options]
    }, { url: this.account.xmlrpc, skip_notifications:skip_notifications, delete_comments:true, onRequestFault:'apiFault', onFailure:'badURL' } );
  },
  loadComments:function(options, skip_notifications){
    this.$.getComments.callMethod({
      methodParams:[this.account.blogid, this.account.username, this.password, options]
    }, { url: this.account.xmlrpc, skip_notifications:skip_notifications });
  },
  checkNewComments:function(sender, response, request){
    var account = this.account;
    var client = this;
    var persistence = enyo.application.persistence;
    // we are receiving a subset of comments here
    // so we should just create/or update
    // first let's load all of the comments that we might have already have locally
    // get all of the id's from the response
    var remote_ids = enyo.map(response, function(comment){ return comment.comment_id }, this);
    // find all local comments that may match these ids
    this.account.comments.filter('comment_id', 'in', remote_ids).list(function(local_comments){
      // index the local comments by comment_id
      var comment_index = {};
      var new_comments = [];
      enyo.map(local_comments, function(comment){ comment_index[comment.comment_id] = comment; return comment}, client);
      // now loop through the response array, if it's in the comment_index, update the comment
      // if not, insert the comment
      enyo.map(response, function(remote_comment){
        var local_comment;
        if (local_comment = comment_index[remote_comment.comment_id]) {
          // update the local comment
          for (field in remote_comment) {
           local_comment[field]= remote_comment[field]
          };
        }else{
          // create a new coment
          local_comment = new enyo.application.models.Comment(remote_comment);
          // add it to the new_comments array so we can notify when we've committed all these changes
          account.comments.add(local_comment);
          new_comments.push(local_comment);
        }
        
      }, client);
      
      if(request.delete_comments && request.delete_comments === true) {
    	  //now loop through the response array, if it not in the comment_index, delete the comment

    	  account.comments.filter('comment_id', 'not in', remote_ids).list(function(old_local_comments){
      		  client.log("these comment shoud be removed from the local db", old_local_comments);
      		  for(var removeIndex = 0; removeIndex < old_local_comments.length; removeIndex++) {
   		        	account.comments.remove(old_local_comments[removeIndex]);		        	
      		  }
      	      // comment modification shave been made let's persist them
      	      persistence.flush(function(){
      	        // notify that the comments have been refreshed
      	        client.doRefreshComments();
      	        client.refreshPendingCommentCount();
      	        if (!(request.skip_notifications === true)) {
      	          enyo.map(new_comments, function(comment){
      	            enyo.application.commentDashboard.notifyComment(comment, account);
      	          });
      	        };
      	        
      	      });
      	  });
    	  
      } else {
          // comment modification shave been made let's persist them
          persistence.flush(function(){
            // notify that the comments have been refreshed
            client.doRefreshComments();
            client.refreshPendingCommentCount();
            if (!(request.skip_notifications === true)) {
              enyo.map(new_comments, function(comment){
                enyo.application.commentDashboard.notifyComment(comment, account);
              });
            };
            
          });    	  
      }
      
    });
    
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
  uploadFile:function(filePath){
    
    // blogName: 'TEXT',
    // blogid: 'INT',
    // isAdmin: 'BOOLEAN',
    // url: 'TEXT',
    // username: 'TEXT',
    // xmlrpc: 'TEXT'
    
    this.$.uploader.call({
      endpoint:this.account.xmlrpc,
      username:this.account.username,
      password:this.password,
      file:filePath,
      blogId:this.account.blogid
    });
  },
  uploadCompleted:function(sender, response, request){
    this.log("Upload completed!");
   // console.log(enyo.json.stringify(response.deviceFilePath));
    // parse the response XML here
    var parser = new XMLRPCParser(response.xml);
	var response_object = parser.toObject();
	var fault = parser.fault; 
	response_object.deviceFilePath = response.deviceFilePath;
    if(fault){
      this.doUploadFailed(response_object);
    }else{
      this.doUploadComplete(response_object);
    }  
  },
  uploadFailed:function(sender, response, request){
    this.log("Upload failed!");
    //console.log(enyo.json.stringify(response.deviceFilePath));
    console.log(enyo.json.stringify(response));
    this.doUploadFailed(response);
  }
})