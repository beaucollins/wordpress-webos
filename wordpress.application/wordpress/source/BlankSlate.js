enyo.kind({
  name:'BlankSlate',
  kind:'VFlexBox',
  className:'blank-slate',
  published: {
    message: $L('Select an Item to View')
  },
  components: [
	{ name: 'container', flex:1, className:'blank-slate-container', components: [
      { name:'graphic', className:'blank-slate-graphic' },
      { name:'message', className:'blank-slate-message' }
	]},
	{ name:'list', kind: 'VFlexBox', flex:1 },
	{ kind:'enyo.Toolbar', className:'enyo-toolbar-light', components:[
      { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'}
    ]}
  ],
  create:function(){
    this.inherited(arguments);
    this.messageChanged();
  },
  messageChanged:function(){
    this.$.message.setContent(this.message);
  }
})