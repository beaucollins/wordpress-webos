enyo.kind({
  name:'wp.PostView',
  kind:'VFlexBox',
  published: {
    account:null,
    post:null
  },
  events: {
    
  },
  components: [
    { kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'open' },
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
      { name: "slidingDrag", slidingHandler: true, kind: "Control", className: "enyo-command-menu-draghandle" },
      { caption: 'Edit' },
      { caption: 'Open', onclick:'openPostURL' }
    ]}
  ],
  postChanged:function(){
    
    if (!this.post) {
      return;
    }
    console.log(this.post);
    this.$.title.setContent(this.post.title);
    this.$.content.setContent(this.post.description);
    this.$.scroller.setScrollPositionDirect(0,0);
    
  },
  openPostURL:function(sender){
    
    if (this.post.permaLink && this.post.permaLink.trim() != "" ) this.$.palmService.call({ target: this.post.permaLink });
    
  }
});