import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useAccountGetBalance } from '@/features/account/use-account-get-balance'
import type { Address } from '@solana/kit'

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

function short(addr: string) {
  return `${addr.slice(0, 4)}···${addr.slice(-4)}`
}

function solDisplay(lamports: bigint) {
  return (Number(lamports) / 1e9).toFixed(2)
}

function ConnectedChip({ address }: { address: string }) {
  const { data: balance } = useAccountGetBalance({ address: address as Address })
  return (
    <View style={styles.chip}>
      <View style={styles.pip} />
      <Text style={styles.addr}>{short(address)}</Text>
      {balance !== undefined && (
        <Text style={styles.bal}> {solDisplay(balance.value)} SOL</Text>
      )}
    </View>
  )
}

export function WalletButton() {
  const { account, connect, disconnect } = useMobileWallet()
  if (account) {
    return (
      <TouchableOpacity onPress={disconnect} activeOpacity={0.80}>
        <ConnectedChip address={account.address} />
      </TouchableOpacity>
    )
  }
  return (
    <TouchableOpacity onPress={connect} activeOpacity={0.80} style={styles.connectBtn}>
      <Text style={styles.connectText}>CONNECT</Text>
    </TouchableOpacity>
  )
}

export function WalletChip({ address }: { address: string }) {
  return <ConnectedChip address={address} />
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(232,184,75,0.30)',
    borderRadius: 2,
    backgroundColor: 'rgba(232,184,75,0.05)',
    gap: 6,
  },
  pip: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E8B84B',
  },
  addr: {
    fontSize: 11,
    fontFamily: mono,
    fontWeight: '500',
    color: 'rgba(240,237,232,0.65)',
    letterSpacing: 0.2,
  },
  bal: {
    fontSize: 11,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
    letterSpacing: 0.2,
  },
  connectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(232,184,75,0.38)',
    borderRadius: 2,
    backgroundColor: 'rgba(232,184,75,0.05)',
  },
  connectText: {
    fontSize: 10,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
    letterSpacing: 2.5,
  },
})
