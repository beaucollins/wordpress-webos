enyo.kind({
  name:'wp.DraftList',
  kind:'wp.PostList',
  create: function(){
	  this.inherited(arguments);
	  this.$.list.pageSize = 1000;
	  this.hideNewButton();
  },
  acquirePosts:function(sender, page){
    if (page < 0) return;
    var that = this;
    var pageSize = this.$.list.pageSize;
    enyo.application.models.Post.all().filter('local_modifications', '=', 'true').count(function(postCount){
      enyo.application.models.Page.all().filter('local_modifications', '=', 'true').count(function(pageCount){
        enyo.application.models.Post.all().filter('local_modifications', '=', 'true')
          .prefetch('account')
          .limit(pageSize)
          .skip(page*pageSize)
          .order('date_created_gmt', false)
          .list(function(posts){
            if (posts.length == pageSize) {
              that.setPage(page, posts);
              that.$.list.refresh();
            }else{
              //combine posts with pages query
              var limit = pageSize - posts.length;
              var offset = (page * pageSize) + posts.length;
              enyo.application.models.Page.all().filter('local_modifications', '=', 'true')
                .limit(pageSize - offset)
                .skip(offset)
                .order('date_created_gmt', false)
                .list(function(pages){
                  var items = posts.concat(pages);
                  if (items.length > 0) {
                    that.setPage(page, posts.concat(pages));
                    that.$.list.refresh();
                  };
                });
            }
          })
      })
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