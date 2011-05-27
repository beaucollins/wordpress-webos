enyo.kind({
  name:'wp.PostView',
  kind:'VFlexBox',
  published: {
    account:null,
    post:null
  },
  events: {
    onEdit:''
  },
  components: [
    { name:"xmlrpc_client", kind:"XMLRPCService" },
    { name:"header", kind:'Header', components:[
      { kind:'VFlexBox', flex:1, components: [
        { name:'title', content:"Title", className:'wp-post-title' },
        { name:'meta', kind:'HFlexBox', components:[
          { name:'date', className:'post-date', flex:1, content:'Date' },
          { name:'author', className:'post-author', content:'Author'}
        ]},
        { name:'category_row', kind:'HFlexBox', className:'post-categories-row', components:[
          { content: $L('Categories'), className:'post-categories-label'},
          { name:'categories', className:'post-categories', content:'Categories' }
        ]}
      ]}
    ]},
    { kind:'Scroller', flex:1, components:[
      { name:'content', className:'wp-post-content' }
    ] },
    { kind:'enyo.Toolbar', components:[
      { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'},
      { flex:1 },
      { caption: 'Edit', onclick:"openEditor" },
      { caption: 'Preview', onclick:'openPostURL' }
    ]}
  ],
  postChanged:function(){
    if (!this.post) {
      return;
    }
    var date_format = new enyo.g11n.DateFmt({ format:'medium' });
    console.log(this.post);
    this.$.title.setContent(this.post.title);
    this.$.content.setContent(this.post.description + this.post.mt_text_more);
    if(this.post.categories && this.post.categories.length > 0) {
      this.$.categories.setContent( this.post.categories.join(', '));
      this.$.category_row.show();
	  }else{
	    this.$.category_row.hide();
	  }
	  console.log(this.post);
	  if (this.post.date_created_gmt) {
      this.$.date.setContent(date_format.format(this.post.date_created_gmt));
    }else{
      this.$.date.setContent("<em>" + $L("not published") + "</em>");
	  };
	  if (this.post.wp_author_display_name) {
      this.$.author.setContent($L("By: ") + this.post.wp_author_display_name);
	  }else{
	    this.$.author.setContent('');
	  }
    this.$.scroller.setScrollPositionDirect(0,0);
  },
  openPostURL:function(sender){
	  //launches a new window with the preview view
	  console.log("Launching Preview");
	  params = {'account': this.account.account, 'post': this.post};
	  enyo.windows.activate("Post Preview", "./postPreview.html", params);
  },
  openEditor:function(sender){
    this.doEdit(this.post);
  }
});