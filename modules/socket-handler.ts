import { ZuploContext, ZuploRequest } from "@zuplo/runtime";
import sh from "./custom-handler"

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

    // this not working correctly for handlers
    // const handler = options.handler.module[options.handler.export] as SocketHandler;

    // if (!handler || typeof handler.onOpen !== 'function') {
    //   throw new Error(`options.handler did not evaluate to a SocketHandler`);
    // }

    // your policy code goes here, and can use the options to perform any
    // configuration
    // See the docs: https://www.zuplo.com/docs/policies/custom-code-inbound

    const handler = sh;

    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    const source = server;

    server.accept();

    server.addEventListener('open', async (event) => {
      handler.onOpen(source, context);
    })

    server.addEventListener('message', async (event) => {
      handler.onMessage(event.data, source, context);
    });

    server.addEventListener('close', async (event) => {
      handler.onClose({
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      }, source, context)
    })

    server.addEventListener('error', async (event) => {
      handler.onError(event as Error, source, context)
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
