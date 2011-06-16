enyo.kind({
  name:'wp.ReplyForm',
  kind:'enyo.Toaster',
  events: {
    onPublish:''
  },
  published: {
    comment:null,
    authorEmail:'',
    authorName:''
  },
  components:[
    { kind:'Header', className:'enyo-toolbar-light', components:[
      { name:'replyTitle', content:$L('Comment Reply'), flex:1 },
      { kind:'Button', content:$L('Cancel'), onclick:'cancel' },
      { kind:'Button', content:$L('Reply'), className:'enyo-blue-button', onclick:'doPublish' }
    ]},
    { kind:'FadeScroller', height:'100%', components:[
      { name:'replyContent', kind:'enyo.RichText', onChange:'updateContent' }
    ]}
  ],
  create:function(){
    this.inherited(arguments);
  },
  open:function(options){
    this.inherited(arguments);  
  },
  // because popups are lazily created, initialize properties that effect components 
  // in componentsReady rather than create.
  componentsReady: function() {
	  this.inherited(arguments);
	  this.$.replyContent.forceFocus();
  },
  getValue:function(){
    return this.$.replyContent.getValue();
  },
  cancel:function(){
    this.$.replyContent.setValue();
    this.close();
  },
  reset:function(){
    this.$.replyContent.setValue();
  },
  focusField:function(){
    this.$.replyContent.forceFocus();
  }
});