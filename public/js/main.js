const socket = io('localhost:8000');
let user;

window.onload = () => {
    $.ajax({
        url: '/get_session',
        method: 'GET',
        success: (result) => {
            user = JSON.parse(result);
        }
    });

    $('button').click(sendMsg);
    $(document).keypress(e => {
        const key = e.which;
        if(key == 13){
            sendMsg();
        }
    });
}

socket.on('messages', function (msg) {
    $('#messages').empty();
    for (let i = 0; i < msg.length; i++) {
        const markup = `<li>${msg[i].user}: ${msg[i].message}</li>`;
        $('#messages').append(markup);
    }
    $(window).scrollTop(10000);
});

function sendMsg() {

  const inputVal = $('#m').val();

  if (inputVal) {

    const message = {
      msg: inputVal,
      user: user.username,
    };

    socket.emit('new message', message);

    $('#m').val('');
  }
}
