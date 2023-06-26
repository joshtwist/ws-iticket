import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

type SocketHandlerOptions = {
  handler: {
    "module": any,
    "export": string
  }
};

export interface SocketHandler {
  onOpen?: (source: WebSocket, context: ZuploContext) => Promise<void>;
  onMessage?: (message: string, source: WebSocket, context: ZuploContext) => Promise<void>;
  onClose?: (data: { code: number, reason: string, wasClean: Boolean }, source: WebSocket, context: ZuploContext) => Promise<void>;
  onError?: (error: Error, source: WebSocket, context: ZuploContext) => Promise<void>
}

export default async function (
  request: ZuploRequest,
  context: ZuploContext,
  options: SocketHandlerOptions,
  policyName: string
) {
  try {

    const handler = options.handler.module[options.handler.export] as SocketHandler;

    if (!handler || typeof handler.onOpen !== 'function') {
      throw new Error(`options.handler did not evaluate to a SocketHandler`);
    }

    // your policy code goes here, and can use the options to perform any
    // configuration
    // See the docs: https://www.zuplo.com/docs/policies/custom-code-inbound

    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();

    server.addEventListener('open', event => {
      handler.onOpen(server, context);
    })

    server.addEventListener('message', event => {
      handler.onMessage(event.data, server, context);
    });

    server.addEventListener('close', event => {
      handler.onClose({
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      }, server, context)
    })

    server.addEventListener('error', event => {
      handler.onError(event as Error, server, context)
    })

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
  catch (err) {
    context.log.error('error', err);
    throw err;
  }
}
