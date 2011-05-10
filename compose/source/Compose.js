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
          { content:'New Post', flex:1 },
          { name:'previewButton', kind:'enyo.Button', caption:'Preview', onclick:'showPreview' },
		  { name:'postButton', kind:'enyo.Button', toggling:true, caption:'Publish', onclick:'savePost' }
        ] },		
        { kind:'HFlexBox', flex:1, components:[
          { name:'main', kind:'VFlexBox', flex:1, components:[
            { name: 'titleField', kind:'enyo.Input', className:'enyo-item', hint:'Title' },
			{ name: 'contentWrapper', kind:'VFlexBox', flex:1, components:[
			{ name: 'richTextButtons', kind:'HFlexBox', components:[
				{ name: 'boldButton', className:'wp-formatBtn', toggling:true, kind:'enyo.Button', caption:'<strong>b</strong>', onclick:'formatBtnClick' },
				{ name: 'emButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'<em>i</em>', onclick:'formatBtnClick' },
				{ name: 'linkButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'<u style="color: #21759b">link</u>', onclick:'formatBtnClick' },
				{ name: 'quoteButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'b-quote', onclick:'formatBtnClick' },
				{ name: 'ulButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'ul', onclick:'formatBtnClick' },
				{ name: 'olButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'ol', onclick:'formatBtnClick' },
				{ name: 'liButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'li', onclick:'formatBtnClick' },
				{ name: 'codeButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'code', onclick:'formatBtnClick' },
				{ name: 'moreButton', className:'wp-formatBtn', kind:'enyo.Button', toggling:true, caption:'more', onclick:'formatBtnClick' },		
	          ] },
			{ kind:'Scroller', flex:1, components:[
            { name: 'contentField', kind:'enyo.RichText', flex:1, changeOnInput: true, oninput: 'keyTapped', hint:'Write Here' }
          	] },
	        { name:'advanced', kind:'enyo.Button', toggling:true, caption:'Settings', onclick:'toggleSettings' }
			] },
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
  formatBtnClick:function(sender){
	if (sender.name == 'boldButton') {
		//this.$.boldButton.depressed = true;		
	}
  },
  keyTapped: function() {
	console.log('tap!');
  },
  showPreview:function() {
	  //launches a new window with the preview view
	  params = {'title' : this.$.titleField.value, 'content' : this.$.contentField.value};
	  options = {};
	  enyo.mixin(params, options);
	  enyo.windows.activate("Post Preview", "../postPreview.html", params);
  }
});