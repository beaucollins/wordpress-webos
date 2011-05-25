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
    { name:"header", components:[
      { name:'title', content:"Title", className:'enyo-item first' },
      { name:'date', content:"Date", className:'enyo-item' },
      { name:'author', content:"Author", className:'enyo-item' },
      { name:'categories', content:'Categories', className:'enyo-item'}
    ] },
    { kind:'Scroller', flex:1, components:[
      { name:'content' }
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
    console.log(this.post);
    this.$.title.setContent(this.post.title);
    this.$.content.setContent(this.post.description + this.post.mt_text_more);
    if(this.post.categories && this.post.categories.length > 0) {
    	 this.$.categories.setContent( 'Categories: '+ this.post.categories.join(', '));
	  } 
    this.$.date.setContent('Date: ' + this.post.date_created_gmt);
    this.$.author.setContent('Author: ' + this.post.wp_author_display_name);
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