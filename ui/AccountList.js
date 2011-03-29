// List of the current accounts configured

enyo.kind({
  name:'AccountList',
  kind:'enyo.Control',
  layoutKind:'VFlexLayout',
  events: {
    onNewAccount: ""
  },
  components: [
    {
     kind: 'PageHeader',
     content: 'Accounts' 
    },
    {
      flex: 1,
      kind: 'Scroller'
    },
    {
      name:'menu',
      kind:'nouveau.CommandMenu',
      components: [
        {kind: 'Spacer'},
        {caption: 'New Account', onclick:'doNewAccount'},
        {kind: 'Spacer'}
      ]
    }
  ]
})