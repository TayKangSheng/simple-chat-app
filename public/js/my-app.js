// globals
var appconfig = {
  socket: io(window.location.host),
  username: '',
  socketstatus: false,
  apptitle: 'My not so simple Vue chat',
  connected: '',
  messages: []
}

// Vue Components
Vue.component('app-header', {
  props: ['appconfig'],
  template: `
    <h1>{{ appconfig.apptitle }}
      <span id="status" v-bind:class="classObject">
        {{ appconfig.socketstatus ? 'connected' : 'loading' }}
      </span>
    </h1>
  `,
  computed: {
    classObject: function () {
      return {
        label: true,
        'label-default': !this.appconfig.socketstatus,
        'label-success': this.appconfig.socketstatus
      }
    }
  }
})

Vue.component('app-footer', {
  template: `
  <footer><slot></slot></footer>
  `
})

Vue.component('join-message-form', {
  props: [ 'appconfig' ],
  template: `
    <section id="join" class="well" v-show="this.appconfig.socketstatus && this.appconfig.username===''">
      <form id="JoinForm" class="form-inline text-right">
          <fieldset>
            <input type="text" class="form-control " placeholder="Your name" autocomplete="off" required autofocus v-model="inputMessage" />
            <button id="sendJoin" class="btn btn-success" v-bind:disabled="!buttonstatus" v-on:click.stop.prevent="submitUsername">Join</button>
          </fieldset>
      </form>
    </section>
  `,
  data: function () {
    return {
      buttonstatus: false,
      inputMessage: ''
    }
  },
  watch: {
    inputMessage: function (newInput) {
      if (this.inputMessage !== '') this.buttonstatus = true
      if (this.inputMessage == '') this.buttonstatus = false
    }
  },
  methods: {
    submitUsername: function () {
      this.appconfig.username = this.inputMessage
      console.log('Joining chat with name: ', this.appconfig.username)
      this.appconfig.socket.emit('join', { name: this.appconfig.username })
      this.inputMessage = ''
    }
  }
})

Vue.component('chat-message', {
  props: [ 'message' ],
  template: `
  <div class="text-center" v-if="message.type=='info'">
    <strong>
      {{ message.content }}
    </strong>
  </div>
  <div class="alert alert-info text-right" v-else-if="message.type=='success' ">
    <strong>
      {{ message.content }}
    </strong>
  </div>
  <div class="alert alert-success" v-else-if="message.type=='alert' ">
    <strong>
      {{ message.content }}
    </strong>
  </div>
  `
})

Vue.component('panel', {
  props: ['appconfig'],
  template: `
  <main class="panel panel-default" v-show="appconfig.socketstatus && appconfig.username!=='' ">
    <div class="panel-heading">
      <form id="MessageForm" class="form-inline text-right" v-show="this.appconfig.socketstatus && this.appconfig.username!==''" >
        <fieldset>
          <input type="text" class="form-control" placeholder="say what?" autocomplete="off" v-model="inputMessage" required autofocus />
          <button id="sendMessage" class="btn btn-success" v-bind:disabled='!isThereAMessage'
          v-on:click.stop.prevent="submitMessage">Send</button>
        </fieldset>
      </form>
    </div>
    <section class="panel-body">
      <div class="text-center">
        <small id="connected">
          {{ appconfig.connected }}
        </small>
        </div>
      <hr>
      <div id="messages" v-for="message in appconfig.messages">
        <chat-message v-bind:message="message"></chat-message>
      </div>
    </section>
  </main>
  `,
  data: function () {
    return {
      inputMessage: ''
    }
  },
  computed: {
    isThereAMessage: function () {
      return (this.inputMessage !== '')
    }
  },
  methods: {
    submitMessage: function () {
      console.log('submit: ' + this.inputMessage)
      this.appconfig.messages.unshift(
        { type: 'success', content: this.inputMessage }
      )
      console.log('messages:', this.appconfig.messages)
      this.appconfig.socket.emit('chat', this.inputMessage)
      this.inputMessage = ''
    }
  }
})

// My App instance
var vm = new Vue({
  el: '#app',
  data: {
    appconfig: appconfig
  },
  methods: {
    setUsername: function (name) {
      this.appconfig.username = name
    }
  }
})

// SOCKET EVENTS
// handle connectting to and disconnecting from the chat server
appconfig.socket.on('connect', function () {
  console.log('Connected to Chat Socket')
  // status(true)
  vm.appconfig.socketstatus = true
})
appconfig.socket.on('disconnect', function () {
  console.log('Disconnected from Chat Socket')
  // status(false)
  vm.appconfig.socketstatus = false
})

// welcome message received from the server
appconfig.socket.on('welcome', function (msg) {
  console.log('Received welcome message: ', msg)
  // enable the form and add welcome message
  // $('main').removeClass('hidden')
  appconfig.messages.unshift(
    { type: 'info', content: msg }
  )
  // $('#messages').prepend($('<div class="text-center">').html('<strong>' + msg + '<strong>'))
})

// chat message from another user
appconfig.socket.on('chat', function (msg) {
  console.log('Received message: ', msg)
  appconfig.messages.unshift(
    { type: 'alert', content: msg.user.name + ': ' + msg.message }
  )
  // $('#messages').prepend($('<div class="alert alert-success">').html('<strong>' + msg.user.name + ':</strong> ' + msg.message))
})

// message received that new user has joined the chat
appconfig.socket.on('joined', function (user) {
  console.log(user.name + ' joined left the chat.')
  appconfig.messages.unshift(
    { type: 'info', content: user.name + ' joined the chat.' }
  )
  // $('#messages').prepend($('<div class="text-center">').html('<strong>' + user.name + ' joined the chat.' + '<strong> '))
})

// handle leaving message
appconfig.socket.on('left', function (user) {
  console.log(user.name + ' left the chat.')
  appconfig.messages.unshift(
    { type: 'info', content: user.name + ' left the chat.' }
  )
  // $('#messages').prepend($('<div class="text-center">').html('<strong>' + user.name + ' left the chat.' + '<strong> '))
})

// // keep track of who is online
appconfig.socket.on('online', function (connections) {
  var names = ''
  // console.log('Connections: ', connections)
  for (var i = 0; i < connections.length; ++i) {
    if (connections[i].user) {
      if (i > 0) {
        if (i === connections.length - 1) names += ' and '
        else names += ', '
      }
      names += connections[i].user.name
    }
  }
  appconfig.connected = names
  // $('#connected').text(names)
})
