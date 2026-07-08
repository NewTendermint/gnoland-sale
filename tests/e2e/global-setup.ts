import { RPC_PORT } from "./support/constants"
import { startRpcStub } from "./support/rpc-stub/server"

/** Starts the sepolia RPC stub once for the whole run; the returned function is Playwright's
 *  global teardown. */
export default function globalSetup(): () => Promise<void> {
  const server = startRpcStub(RPC_PORT)
  return () =>
    new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
}
