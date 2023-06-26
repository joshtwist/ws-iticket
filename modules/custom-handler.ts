import { SocketHandler } from "./socket-handler";

const sh: SocketHandler = {
  onOpen: async (source, context) => {
    source.send('OK');
    context.log.info('open');
  },
  onMessage: async (message, source, context) => {
    context.log.info(`message recevied: '${message}'`);
  }
}

export default sh;