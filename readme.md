# Syncer

One way dom sync over the wire.

## Requirements

All dom elements need a uuid attribute.

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

    