import { useState } from 'react'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { buildStakeInstructions } from './stake-service'
import { confirmStake } from '@/features/match/match-service'

type StakeStatus = 'idle' | 'signing' | 'confirming' | 'done' | 'error'

interface UseStakeResult {
  status: StakeStatus
  txSignature: string | null
  error: string | null
  stake: (matchId: string, stakeAmountLamports: number) => Promise<string | null>
  reset: () => void
}

/**
 * Handles the full stake flow:
 *  1. Build transfer + memo instructions
 *  2. Request wallet signature via Mobile Wallet Adapter
 *  3. Notify the backend to record the stake
 */
export function useStake(): UseStakeResult {
  const { account, sendTransaction } = useMobileWallet()
  const [status, setStatus] = useState<StakeStatus>('idle')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function stake(matchId: string, stakeAmountLamports: number): Promise<string | null> {
    if (!account) {
      setError('Wallet not connected')
      return null
    }

    try {
      setStatus('signing')
      setError(null)

      const instructions = buildStakeInstructions(
        account.address,
        matchId,
        stakeAmountLamports,
      )

      const sig = await sendTransaction(instructions)
      setTxSignature(sig)

      setStatus('confirming')
      await confirmStake(matchId, account.address, sig)

      setStatus('done')
      return sig
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Stake failed'
      setError(msg)
      setStatus('error')
      return null
    }
  }

  function reset() {
    setStatus('idle')
    setTxSignature(null)
    setError(null)
  }

  return { status, txSignature, error, stake, reset }
}
