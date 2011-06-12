enyo.kind({
  name:'wp.DraftList',
  kind:'wp.PostList',
  create: function(){
	  this.inherited(arguments);
	  this.hideNewButton();
  },
  acquirePosts:function(page, pageSize){
    if (page < 0) return;
    var that = this;
    console.log("Requesting page", page, pageSize);
    enyo.application.models.Post.all().filter('local_modifications', '=', 'true')
      .prefetch('account')
      .order('date_created_gmt', false)
     // .limit(pageSize)
     // .skip(page*pageSize)
      .list(function(posts){       
	    enyo.application.models.Page.all().filter('local_modifications', '=', 'true')
	      .prefetch('account')
	      .order('date_created_gmt', false)
	     // .limit(pageSize)
	     // .skip(page*pageSize)
	      .list(function(pages){
	        console.log("setting page", page, posts.concat(pages));
	        that.setPage(page, posts.concat(pages)); 
	      });
      });
  },
  refreshPosts:function(){
    //this.refresh();
	  //we don't have an account, so we should call the main window here
	  var wordpress = enyo.windows.fetchWindow('wordpress');
	  if (wordpress) {
		  enyo.windows.setWindowParams(wordpress, {'action':'refreshDrafts'});
	  };
  },
  refreshList:function(sender){
	 this.$.spinner.show();
	 this.refreshPosts();
  }

});