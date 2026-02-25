import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useAccountGetBalance } from '@/features/account/use-account-get-balance'
import type { Address } from '@solana/kit'

function shortAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

function lamportsToSol(lamports: bigint): string {
  return (Number(lamports) / 1e9).toFixed(2)
}

function ConnectedChip({ address }: { address: string }) {
  const { data: balance } = useAccountGetBalance({ address: address as Address })

  return (
    <View style={styles.chip}>
      {/* Small status indicator */}
      <View style={styles.dot} />
      <Text style={styles.address}>{shortAddress(address)}</Text>
      {balance !== undefined && (
        <Text style={styles.balance}>  {lamportsToSol(balance.value)} SOL</Text>
      )}
    </View>
  )
}

export function WalletButton() {
  const { account, connect, disconnect } = useMobileWallet()

  if (account) {
    return (
      <TouchableOpacity onPress={disconnect} activeOpacity={0.75}>
        <ConnectedChip address={account.address} />
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity onPress={connect} activeOpacity={0.75} style={styles.connectBtn}>
      <Text style={styles.connectText}>CONNECT WALLET</Text>
    </TouchableOpacity>
  )
}

export function WalletChip({ address }: { address: string }) {
  return <ConnectedChip address={address} />
}

const styles = StyleSheet.create({
  // ── Connected state ─────────────────────────────────────────────────────────
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.70)',
    marginRight: 7,
  },
  address: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.3,
  },
  balance: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 0.2,
  },

  // ── Connect button ──────────────────────────────────────────────────────────
  connectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    borderRadius: 3,
  },
  connectText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
})
