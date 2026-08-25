import { computed } from 'vue'
import { useAccount, useReadContract } from '@wagmi/vue'
import { bookingContract } from './contract'

export function useIsAdmin() {
  const { address } = useAccount()
  const { data: owner } = useReadContract({
    ...bookingContract,
    functionName: 'owner',
  })
  const isAdmin = computed(
    () =>
      !!address.value &&
      !!owner.value &&
      address.value.toLowerCase() === owner.value.toLowerCase()
  )
  return { isAdmin, owner }
}
