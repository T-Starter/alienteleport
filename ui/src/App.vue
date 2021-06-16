<template>
  <div id="q-app">
    <ual vi-if="appName" :appName="appName" :chains="chains" :authenticators="authenticators"/>
    <router-view />
  </div>
</template>
<script>

import ual from 'components/ual/ual'
import { Scatter } from 'ual-scatter'
import { Wax } from '@eosdacio/ual-wax'
import { Anchor } from 'ual-anchor'

export default {
    name: 'App',
    components: {
        ual
    },
    methods: {
        splitEndpoint (endpoint) {
            const [protocol, hostPort] = endpoint.split('://')
            const [host, portStr] = hostPort.split(':')
            let port = parseInt(portStr)
            if (isNaN(port)) {
                port = (protocol === 'https') ? 443 : 80
            }

            return {
                protocol,
                host,
                port
            }
        }
    },
    data () {
        const appName = 'T-Starter'
        const endpointsTelos = [process.env.telosEndpoint]
        // const network = 'wax'

        const chainsTelos = [{
            chainId: process.env.telosChainId,
            rpcEndpoints: [this.splitEndpoint(endpointsTelos[0])]
        }]

        const authenticatorsWax = [
            new Wax(chainsTelos, { appName }),
            new Scatter(chainsTelos, { appName }),
            new Anchor(chainsTelos, { appName })
        ]

        const chains = {
            wax: chainsTelos
        }
        const authenticators = {
            wax: authenticatorsWax
        }

        return {
            appName,
            chains,
            authenticators
        }
    }
}
</script>
