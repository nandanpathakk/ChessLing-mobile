import { address, AccountRole, Instruction } from '@solana/kit'
import { getAddMemoInstruction } from '@solana-program/memo'

/**
 * Treasury address — set via EXPO_PUBLIC_TREASURY_ADDRESS in your .env file.
 * This is where both players' stakes are sent before the game starts.
 * In production, replace with a Solana Anchor program PDA for trustless escrow.
 */
export const TREASURY_ADDRESS =
  process.env.EXPO_PUBLIC_TREASURY_ADDRESS ?? 'YOUR_TREASURY_PUBLIC_KEY'

const SYSTEM_PROGRAM = address('11111111111111111111111111111111')

/**
 * Builds a SOL transfer instruction manually using the System Program's
 * binary layout: [u32 LE instruction_index=2, u64 LE lamports].
 *
 * We build it manually (rather than using @solana-program/system's helper)
 * because that helper requires a TransactionSigner object for `source`.
 * With sendTransaction() from @wallet-ui/react-native-kit, the wallet
 * automatically signs for any WRITABLE_SIGNER account matching its address.
 */
function buildTransferInstruction(
  fromAddress: string,
  toAddress: string,
  lamports: number,
): Instruction {
  const data = new Uint8Array(12)
  const view = new DataView(data.buffer)
  view.setUint32(0, 2, true)                  // u32 LE: instruction index 2 = Transfer
  view.setBigUint64(4, BigInt(lamports), true) // u64 LE: amount in lamports

  return {
    programAddress: SYSTEM_PROGRAM,
    accounts: [
      { address: address(fromAddress), role: AccountRole.WRITABLE_SIGNER }, // source
      { address: address(toAddress),   role: AccountRole.WRITABLE },         // destination
    ],
    data,
  }
}

/**
 * Returns the instructions needed to stake into a match:
 *  1. SOL transfer: player wallet → treasury
 *  2. Memo containing matchId for on-chain traceability
 */
export function buildStakeInstructions(
  fromAddress: string,
  matchId: string,
  stakeAmountLamports: number,
): Instruction[] {
  return [
    buildTransferInstruction(fromAddress, TREASURY_ADDRESS, stakeAmountLamports),
    getAddMemoInstruction({ memo: `chessBet:stake:${matchId}` }) as unknown as Instruction,
  ]
}

/** Formats lamports as a readable SOL string. e.g. 100_000_000 → "0.1 SOL" */
export function formatSol(lamportAmount: number): string {
  return `${(lamportAmount / 1e9).toFixed(4).replace(/\.?0+$/, '')} SOL`
}

/** Solana Explorer URL for a transaction. */
export function explorerTxUrl(
  signature: string,
  cluster: 'devnet' | 'mainnet-beta' = 'devnet',
): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`
}
