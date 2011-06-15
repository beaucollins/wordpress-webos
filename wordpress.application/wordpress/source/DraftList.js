enyo.kind({
  name:'wp.DraftList',
  kind:'wp.PostList',
  create: function(){
	  this.inherited(arguments);
	  this.$.list.pageSize = 1000;
	  this.hideNewButton();
  },
 acquirePosts:function(page){
	if (page < 0) return;
	page = 0;
    var that = this;
    var load_requests = this.load_requests;
    var pageSize = this.$.list.pageSize;
    enyo.application.models.Post.all().filter('local_modifications', '=', 'true')
      .prefetch('account')
      .order('date_created_gmt', false)
     // .limit(pageSize)
     // .skip(page*pageSize)
      .list(function(posts){   
	    enyo.application.models.Page.all().filter('local_modifications', '=', 'true')
	      .prefetch('account')
	      .order('date_created_gmt', false)
	   //   .limit(pageSize)
	     // .skip(page*pageSize)
	      .list(function(pages){
	      //  that.log("Found something? ",  posts.concat(pages));
	        that.setPage(page, posts.concat(pages)); 
	        that.$.list.refresh();  
	      });
      });
  },
  refreshList:function(sender){
	 this.$.spinner.show();
	  //we don't have an account, so we should call the main window here
	  var wordpress = enyo.windows.fetchWindow('wordpress');
	  if (wordpress) {
		  enyo.windows.setWindowParams(wordpress, {'action':'refreshDrafts'});
	  };
  }
});