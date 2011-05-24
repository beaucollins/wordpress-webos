enyo.kind({
  name:'wp.ReplyForm',
  kind:'enyo.Toaster',
  events: {
    onPublish:''
  },
  published: {
    comment:null
  },
  components:[
    { kind:'Header', className:'enyo-toolbar-light', components:[
      { name:'replyTitle', content:$L('Reply'), flex:1 },
      { kind:'Button', content:$L('Cancel'), onclick:'cancel' },
      { kind:'Button', content:$L('Publish'), className:'enyo-button-blue', onclick:'doPublish' }
    ]},
    { kind:'FadeScroller', height:'100%', components:[
      { name:'replyContent', kind:'enyo.RichText', onChange:'updateContent' }
    ]}
  ],
  open:function(options){
    options = enyo.mixin({
      value:''
    }, options)
    this.$.replyContent.setContent(options.value);
    this.inherited(arguments);
    this.$.replyContent.forceFocus();
  },
  getValue:function(){
    return this.$.replyContent.getValue();
  },
  cancel:function(){
    this.$.replyContent.setValue();
    this.close();
  }
});