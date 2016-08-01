# Syncer

One way dom sync over the wire.

## Usage

Sending:

    new Syncer.sender(domnode, (events) => {
      ws.send(JSON.stringify(events));
    });

Recieving:

    sync = new Syncer.reciever(domnode);

    ws.on('message', (event) => {
      sync.recieve(JSON.parse(event.data));
    })

    