enyo.kind({
  name:'PasswordReset',
  kind:'enyo.Popup',
  scrim:true,
  events: {
    onSavePassword:'',
    onCancel:''
  },
  published: {
    account:null
  },
  components:[
    { content:$L("Bas username/password") },
    { name:'username' },
    { name:'login', kind:'enyo.RowGroup', caption:'Password', components:[
      { kind:'enyo.Input', name:'passwordField', inputType:'password' },
    ]},
    { kind:'enyo.Button', content:'Save', onclick:'savePassword' },
    { kind:'enyo.Button', content:'Cancel', onclick:'doCancel' }
  ],
  accountChanged:function(){
    this.$.username.setContent(this.account.account.username);
  },
  savePassword:function(sender){
    this.doSavePassword(this.$.passwordField.getValue());
  }
});