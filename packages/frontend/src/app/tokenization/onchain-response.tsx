import CodeBlock from '@/components/code-block'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  fetchHouse,
  fetchOnChainHouse,
  getCurrentPrice,
  getListPrice
} from '@/lib/fetch-house'
import { firaCode } from '@/lib/fonts'
import { cn } from '@/lib/utils'

type OnchainResponseProps = {
  tokenId: string
}

export const OnchainResponse = async ({
  tokenId,
}: OnchainResponseProps) => {
  const houseData = await fetchOnChainHouse(tokenId)

  const rawData = JSON.stringify(houseData, null, 3)
  const latestValue = getCurrentPrice(houseData)
  const parsedData = `${latestValue}`

  return (
    <>
      <label className="text-base font-[450] text-card-foreground">
        Raw Data
      </label>
      <ScrollArea
        className={cn('mb-6 mt-2 h-[125px] rounded', firaCode.variable)}
      >
        <CodeBlock codeString={rawData} />
      </ScrollArea>
      <div className="flex justify-between space-x-4">
        <div className="flex flex-col justify-end">
          <label className="mb-2 text-base font-[450] text-card-foreground">
           Lasted Value
          </label>
          <div className="rounded bg-[#181D29] px-4 py-3 text-sm leading-4 text-muted-foreground">
            {parsedData}
          </div>
        </div>
        <div className="flex flex-col justify-end lg:grow">
          <label className="mb-2 text-base font-[450] text-card-foreground">
            Unit
          </label>
          <div className="rounded bg-[#181D29] px-4 py-3 text-sm leading-4 text-muted-foreground">
            {`$`}
          </div>
        </div>
      </div>
    </>
  )
}
