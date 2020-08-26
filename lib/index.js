class WsConnection {
    constructor({
        url,
        pingTimeout = 15000,
        pongTimeout = 10000,
        reconnectTimeout = 2000,
        pingMsg = 'heartbeat',
        repeatLimit = null
    }) {
        this.opts = {
            url,
            pingTimeout,
            pongTimeout,
            reconnectTimeout,
            pingMsg,
            repeatLimit
        }
        this.ws = null
        this.repeat = 0

        this.onclose = () => {}
        this.onerror = () => {}
        this.onopen = () => {}
        this.onmessage = () => {}
        this.onreconnect = () => {}

        this.createWebSocket()
    }

    createWebSocket() {
        try {
            this.ws = new WebSocket(this.opts.url)
            this.initEventHandle()
        } catch (e) {
            this.reconnect()
            throw e
        }
    }

    initEventHandle() {
        this.ws.onclose = () => {
            this.onclose()
            this.reconnect()
        }
        this.ws.onerror = () => {
            this.onerror()
            this.reconnect()
        }
        this.ws.onopen = () => {
            this.repeat = 0
            this.onopen()
            this.heartCheck()
        }
        this.ws.onmessage = event => {
            this.onmessage(event)
            this.heartCheck()
        }
    }

    reconnect() {
        if (this.opts.repeatLimit > 0 && this.opts.repeatLimit <= this.repeat) return
        if (this.lockReconnect || this.forbidReconnect) return
        this.lockReconnect = true
        this.repeat++
        this.onreconnect()
        setTimeout(() => {
            this.createWebSocket()
            this.lockReconnect = false
        }, this.opts.reconnectTimeout)
    }

    send(msg) {
        this.ws.send(msg)
    }

    heartCheck() {
        this.heartReset()
        this.heartStart()
    }

    heartStart() {
        if (this.forbidReconnect) return
        this.pingTimeoutId = setTimeout(() => {
            this.ws.send(this.opts.pingMsg)
            this.pongTimeoutId = setTimeout(() => {
                this.ws.close()
            }, this.opts.pongTimeout)
        }, this.opts.pingTimeout)
    }

    heartReset() {
        clearTimeout(this.pingTimeoutId)
        clearTimeout(this.pongTimeoutId)
    }

    close() {
        this.forbidReconnect = true
        this.heartReset()
        this.ws.close()
    }
}

if (typeof window != 'undefined') window.WsConnection = WsConnection
export default WsConnection
