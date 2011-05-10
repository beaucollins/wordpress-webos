enyo.kind({
  name:'wp.Compose',
  kind:'Control',
  published:{
    showSettings:false
  },
  components:[
    { name:'desktop', className:'desktop', components:[
      { name:'composer', className:'composer', kind:'VFlexBox', components:[
        { kind:'enyo.Header', components:[
          { content:'Compose', flex:1 },
          { name:'advanced', kind:'enyo.Button', toggling:true, caption:'Settings', onclick:'toggleSettings' },
          { name:'previewButton', kind:'enyo.Button', caption:'Preview', onclick:'showPreview' }
        ] },
        { kind:'HFlexBox', flex:1, components:[
          { name:'main', kind:'VFlexBox', flex:1, components:[
            { kind:'enyo.Input', name: 'titleField', className:'enyo-item', hint:'Title' },
            { kind:'enyo.RichText', name : 'contentField',  flex:1, hint:'Write Here' }
          ] },
          { name:'settings', kind:'VFlexBox', width:'300px', style:'background:#EEE;', showing:false, components:[
            { kind:'Scroller', flex:1, components:[
              { kind:'Item', layoutKind:'HFlexLayout', components:[
                { flex:1, content:"Published" },
                { kind:'ToggleButton' }
              ] },
              { kind:'Item', components:[
                { kind:'Drawer', open:false, caption:'Password', components:[
                  { kind:'Input', hint:'Password', inputType:'password' }
                ] }
              ] },
              { kind:'Item', components:[
                { kind:'Drawer', caption:'Categories', open:false, components:[
                  { content:'One' },
                  { content:'Two' },
                  { content:'Three' }
                ] }
              ]}
            ]}
          ]}
        ]}
      ] }
    ] }
  ],
  create:function(){
    this.inherited(arguments);
  },
  toggleSettings:function(sender){
    this.$.composer.addRemoveClass('expanded-mode', sender.depressed);
    this.setShowSettings(sender.depressed);
  },
  showSettingsChanged:function(){
    this.$.settings.setShowing(this.showSettings);
  },
  showPreview:function() {
	  //launches a new window with the preview view
	  params = {'title' : this.$.titleField.value, 'content' : this.$.contentField.value};
	  options = {};
	  enyo.mixin(params, options);
	  enyo.windows.activate("Post Preview", "../postPreview.html", params);
  }
});