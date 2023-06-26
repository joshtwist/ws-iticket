import { SocketHandler } from "./socket-handler";

const sh: SocketHandler = {
  onOpen: async (source, context) => {
    source.send('OK');
    context.log.error('open');
  },
  onMessage: async (message, source, context) => {
    context.log.error(`message recevied: '${message}'`);
    source.send('OK');

    void fetch('https://en9ayfz8nn85.x.pipedream.net', {
      method: "POST",
      body: message
    });

  },
  onClose: async (data, source, context) => {
    context.log.error(`close`, data);
  },
  onError: async (error, source, context) => {
    context.log.error('error', error);
  }
}

export default sh;